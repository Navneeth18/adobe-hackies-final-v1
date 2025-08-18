# backend/services/enhanced_podcast_service.py
"""
Enhanced Multilingual Podcast Generator from PDF
- Adaptive summary length (scales with PDF size)
- Optional translation to target language
- Robust, chunked TTS with audio stitching using Edge TTS
"""

import os
import math
import asyncio
import tempfile
import uuid
import logging
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

try:
    import fitz  # PyMuPDF for PDF parsing
except ImportError:
    try:
        import pymupdf as fitz  # Alternative import
    except ImportError:
        fitz = None

from tqdm import tqdm

# Summarization (no external API)
try:
    import nltk
    # Set NLTK data path to local venv directory
    nltk.data.path.append('./venv/nltk_data')
    from sumy.summarizers.lex_rank import LexRankSummarizer
    from sumy.nlp.tokenizers import Tokenizer
    from sumy.parsers.plaintext import PlaintextParser
    SUMY_AVAILABLE = True
except ImportError:
    SUMY_AVAILABLE = False

# Optional language detect + translation
try:
    from langdetect import detect as detect_lang
    from deep_translator import GoogleTranslator
    TRANSLATION_AVAILABLE = True
except ImportError:
    TRANSLATION_AVAILABLE = False

# TTS
try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

# Audio merge
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

logger = logging.getLogger(__name__)

# Configuration
DEFAULT_LANG = "en"  # target TTS language if not provided
# Map ISO-ish language codes to Edge voices
EDGE_VOICES = {
    "en": "en-IN-NeerjaNeural",   # Indian English female (natural for IN users)
    "en-us": "en-US-GuyNeural",
    "hi": "hi-IN-SwaraNeural",
    "te": "te-IN-ShrutiNeural",
    "ta": "ta-IN-PallaviNeural",
    "kn": "kn-IN-SapnaNeural",
    "mr": "mr-IN-AarohiNeural",
    "bn": "bn-IN-TanishaaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "ml": "ml-IN-SobhanaNeural",
    "pa": "pa-IN-AnanyaNeural",
    "ur": "ur-IN-GulNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "es": "es-ES-ElviraNeural",
    "ja": "ja-JP-NanamiNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
}

# Edge TTS text limit (safe chunk size) - much more conservative to avoid 5000 char limit
TTS_MAX_CHARS = 3000

class EnhancedPodcastService:
    def __init__(self):
        self.supported_languages = {
            "en": "English",
            "hi": "Hindi",
            "te": "Telugu",
            "ta": "Tamil",
            "kn": "Kannada",
            "mr": "Marathi",
            "bn": "Bengali",
            "gu": "Gujarati",
            "ml": "Malayalam",
            "pa": "Punjabi",
            "ur": "Urdu",
            "fr": "French",
            "de": "German",
            "es": "Spanish",
            "ja": "Japanese",
            "zh": "Chinese"
        }

    def _check_dependencies(self):
        """Check if required dependencies are available"""
        missing = []
        if not EDGE_TTS_AVAILABLE:
            missing.append("edge-tts")
        if not PYDUB_AVAILABLE:
            missing.append("pydub")
        if not SUMY_AVAILABLE:
            missing.append("sumy")
        return missing
        
    def extract_text_from_pdf(self, pdf_path: str) -> Tuple[str, int]:
        """Extract text from PDF file and return text with page count"""
        try:
            if fitz is None:
                raise ImportError("PyMuPDF (fitz) is not available")

            doc = fitz.open(pdf_path)
            all_text = []
            for page in doc:
                txt = page.get_text("text")
                if txt:
                    all_text.append(txt.strip())
            full_text = "\n".join(all_text).strip()
            page_count = len(doc)
            doc.close()
            return full_text, page_count
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")

    def _target_summary_words(self, total_words: int, size: str = "medium") -> int:
        """Scale summary length with document size and requested size, clamp to sane bounds."""
        # Base ratios for medium size
        if total_words < 1500:
            base_ratio = 0.22
        elif total_words < 5000:
            base_ratio = 0.16
        elif total_words < 15000:
            base_ratio = 0.12
        else:
            base_ratio = 0.08

        # Adjust ratio based on size
        size_multipliers = {
            "small": 0.6,   # 60% of medium
            "medium": 1.0,  # 100% (base)
            "large": 1.8    # 180% of medium
        }

        ratio = base_ratio * size_multipliers.get(size.lower(), 1.0)

        # Size-specific bounds
        if size.lower() == "small":
            min_words, max_words = 150, 3000
        elif size.lower() == "large":
            min_words, max_words = 500, 15000
        else:  # medium
            min_words, max_words = 250, 8000

        return max(min_words, min(int(total_words * ratio), max_words))

    def _split_text(self, text: str, chunk_chars: int = 8000) -> List[str]:
        """Split text into manageable chunks"""
        chunks, cur = [], []
        total = 0
        for para in text.splitlines():
            if not para.strip():
                continue
            # +1 for newline join
            if total + len(para) + 1 > chunk_chars and cur:
                chunks.append("\n".join(cur))
                cur, total = [], 0
            cur.append(para)
            total += len(para) + 1
        if cur:
            chunks.append("\n".join(cur))
        return chunks if chunks else [text]

    def _lexrank_summarize(self, text: str, language: str, sentences_count: int) -> str:
        """Summarize using LexRank algorithm"""
        if not SUMY_AVAILABLE:
            # Fallback to simple truncation
            words = text.split()
            target_words = sentences_count * 20  # Approximate words per sentence
            if len(words) > target_words:
                return " ".join(words[:target_words]) + "..."
            return text

        try:
            parser = PlaintextParser.from_string(text, Tokenizer(language))
            summarizer = LexRankSummarizer()
            sentences = summarizer(parser.document, sentences_count)
            return " ".join(str(s) for s in sentences)
        except Exception as e:
            logger.warning(f"LexRank summarization failed: {e}, using simple truncation")
            # Fallback to simple truncation
            words = text.split()
            target_words = sentences_count * 20  # Approximate words per sentence
            if len(words) > target_words:
                return " ".join(words[:target_words]) + "..."
            return text

    def summarize_text(self, text: str, target_language_for_tokenizer: str = "english", size: str = "medium") -> str:
        """Summarize long text by chunking, then optional second pass."""
        if not text.strip():
            raise ValueError("No selectable text found. If your PDF is scanned images, run OCR first.")

        words = text.split()
        total_words = len(words)
        target_words = self._target_summary_words(total_words, size)
        approx_words_per_sentence = 22
        target_sentences_total = max(10, target_words // approx_words_per_sentence)

        # Chunk the input, summarize each chunk proportionally
        chunks = self._split_text(text, chunk_chars=9000)
        chunk_sentences = max(6, target_sentences_total // max(1, len(chunks)))

        partial_summaries = []
        for c in chunks:
            # For each chunk, cap sentences to avoid overly long excerpts
            summary_c = self._lexrank_summarize(c, target_language_for_tokenizer, sentences_count=chunk_sentences)
            partial_summaries.append(summary_c)

        combined = "\n".join(partial_summaries).strip()

        # Second pass compression to hit target size more closely
        combined_words = len(combined.split())
        if combined_words > target_words * 1.2:
            final_sentences = max(10, target_sentences_total)
            combined = self._lexrank_summarize(combined, target_language_for_tokenizer, sentences_count=final_sentences)

        return combined.strip()

    def translate_summary(self, summary: str, target_lang: str) -> str:
        """Translate summary to target language"""
        if not TRANSLATION_AVAILABLE:
            logger.warning("Translation not available, returning original text")
            return summary

        try:
            src = detect_lang(summary)
        except Exception:
            src = "auto"

        if target_lang.lower() in ("en", "en-us", "en-in"):
            tgt = "en"
        else:
            tgt = target_lang

        if src.startswith(tgt):
            return summary  # already in desired language

        # Chunked translation (Google blocks huge texts)
        out_parts, buf = [], []
        for paragraph in summary.split("\n"):
            if not paragraph.strip():
                continue
            # keep chunks under ~3000 chars
            if sum(len(x) for x in buf) + len(paragraph) + 1 > 3000 and buf:
                translated = GoogleTranslator(source="auto", target=tgt).translate("\n".join(buf))
                out_parts.append(translated)
                buf = []
            buf.append(paragraph)
        if buf:
            translated = GoogleTranslator(source="auto", target=tgt).translate("\n".join(buf))
            out_parts.append(translated)

        return "\n".join(out_parts)

    def _pick_voice(self, lang_code: str) -> str:
        """Pick appropriate Edge TTS voice for language"""
        code = (lang_code or DEFAULT_LANG).lower()
        return EDGE_VOICES.get(code, EDGE_VOICES.get(code.split("-")[0], EDGE_VOICES[DEFAULT_LANG]))

    async def synthesize_to_parts(self, text: str, voice: str, out_dir: Path) -> List[Path]:
        """Synthesize text to audio parts using Edge TTS"""
        if not EDGE_TTS_AVAILABLE:
            raise RuntimeError("Edge TTS is not available")

        out_dir.mkdir(parents=True, exist_ok=True)
        parts: List[Path] = []

        # Hard split on paragraphs, then ensure <= TTS_MAX_CHARS
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        current, cur_len = [], 0
        buckets: List[str] = []

        for p in paragraphs:
            # If single paragraph is too long, split it further
            if len(p) > TTS_MAX_CHARS:
                # Split long paragraph by sentences
                sentences = p.split('. ')
                for i, sentence in enumerate(sentences):
                    if i < len(sentences) - 1:
                        sentence += '. '  # Add back the period and space
                    
                    if cur_len + len(sentence) > TTS_MAX_CHARS and current:
                        buckets.append("\n".join(current))
                        current, cur_len = [], 0
                    
                    current.append(sentence)
                    cur_len += len(sentence)
            else:
                if cur_len + len(p) + 1 > TTS_MAX_CHARS and current:
                    buckets.append("\n".join(current))
                    current, cur_len = [], 0
                current.append(p)
                cur_len += len(p) + 1
                
        if current:
            buckets.append("\n".join(current))

        # Final safety check - split any chunks that are still too long
        safe_buckets = []
        for bucket in buckets:
            if len(bucket) <= TTS_MAX_CHARS:
                safe_buckets.append(bucket)
            else:
                # Force split by character count if still too long
                words = bucket.split()
                temp_chunk = []
                temp_len = 0
                
                for word in words:
                    if temp_len + len(word) + 1 > TTS_MAX_CHARS and temp_chunk:
                        safe_buckets.append(" ".join(temp_chunk))
                        temp_chunk = []
                        temp_len = 0
                    temp_chunk.append(word)
                    temp_len += len(word) + 1
                    
                if temp_chunk:
                    safe_buckets.append(" ".join(temp_chunk))

        for idx, chunk in enumerate(safe_buckets):
            # Double check chunk length before TTS - be very strict
            if len(chunk) > 4000:
                logger.warning(f"Chunk {idx} is {len(chunk)} chars, truncating to 3000")
                chunk = chunk[:3000] + "..."
            elif len(chunk) > TTS_MAX_CHARS:
                logger.warning(f"Chunk {idx} is {len(chunk)} chars, truncating to {TTS_MAX_CHARS}")
                chunk = chunk[:TTS_MAX_CHARS] + "..."
                
            outfile = out_dir / f"part_{idx:03d}.mp3"
            logger.info(f"Synthesizing chunk {idx}: {len(chunk)} characters")
            
            try:
                # Edge TTS with final validation
                if len(chunk) > 5000:
                    logger.error(f"Chunk {idx} still too long ({len(chunk)} chars), skipping")
                    continue
                    
                communicate = edge_tts.Communicate(chunk, voice=voice)
                await communicate.save(str(outfile))
                parts.append(outfile)
            except Exception as e:
                logger.error(f"Failed to synthesize chunk {idx}: {e}")
                # Continue with other chunks instead of failing completely
                continue

        return parts

    def merge_mp3(self, parts: List[Path], output_mp3: Path) -> Path:
        """Merge multiple MP3 files into one"""
        if not parts:
            raise ValueError("No audio parts to merge.")

        # If only one part, just copy it
        if len(parts) == 1:
            import shutil
            output_mp3.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(parts[0], output_mp3)
            return output_mp3

        if not PYDUB_AVAILABLE:
            # If pydub not available, just return the first part
            import shutil
            output_mp3.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(parts[0], output_mp3)
            return output_mp3

        try:
            # Load & concat with better error handling
            final = AudioSegment.silent(duration=500)  # 0.5 second intro
            for i, p in enumerate(parts):
                try:
                    audio_segment = AudioSegment.from_file(str(p), format="mp3")
                    final += audio_segment
                    # Add small pause between parts (except last)
                    if i < len(parts) - 1:
                        final += AudioSegment.silent(duration=300)  # 0.3 second pause
                except Exception as e:
                    logger.warning(f"Failed to process audio part {p}: {e}")
                    continue

            output_mp3.parent.mkdir(parents=True, exist_ok=True)
            final.export(str(output_mp3), format="mp3")
            return output_mp3
        except Exception as e:
            logger.error(f"Failed to merge audio files: {e}")
            # Fallback: just copy the first file
            import shutil
            output_mp3.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(parts[0], output_mp3)
            return output_mp3

    async def pdf_to_podcast(
        self,
        pdf_path: str,
        target_lang: str = "en",
        translate: bool = True,
        output_dir: str = "podcasts",
        base_filename: Optional[str] = None,
        size: str = "medium",
    ) -> Path:
        """Generate podcast from PDF using Edge TTS"""
        # Check dependencies
        missing = self._check_dependencies()
        if missing:
            raise RuntimeError(f"Missing dependencies: {', '.join(missing)}")

        text, pages = self.extract_text_from_pdf(pdf_path)
        if not text.strip():
            raise RuntimeError(
                "No selectable text extracted. If the PDF is scanned images, run OCR first."
            )

        # Summarize using LexRank
        summary_en = self.summarize_text(text, target_language_for_tokenizer="english", size=size)

        if translate and target_lang.lower() not in ("en", "en-us", "en-in"):
            summary = self.translate_summary(summary_en, target_lang)
        else:
            summary = summary_en

        # TTS
        voice = self._pick_voice(target_lang)
        safe_name = base_filename or (Path(pdf_path).stem + f"_{target_lang}")
        out_dir = Path(output_dir) / safe_name

        with tempfile.TemporaryDirectory() as td:
            parts = await self.synthesize_to_parts(summary, voice, Path(td))
            final_path = self.merge_mp3(parts, Path(output_dir) / f"{safe_name}.mp3")

        return final_path

    async def generate_multilingual_podcast_from_pdf(
        self,
        pdf_path: str,
        language: str = "en",
        summarize: bool = True,
        size: str = "medium"
    ) -> Dict[str, Any]:
        """
        Generate a multilingual podcast from PDF

        Args:
            pdf_path: Path to the PDF file
            language: Language code (e.g., 'en', 'hi', 'fr')
            summarize: Whether to summarize the text before TTS

        Returns:
            Dict with success status, audio_id, file_path, and metadata
        """
        try:
            # Validate language
            if language not in self.supported_languages:
                raise ValueError(f"Language '{language}' not supported. Supported languages: {list(self.supported_languages.keys())}")

            # Check if PDF exists
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")

            logger.info(f"Starting multilingual podcast generation from PDF: {pdf_path}")

            # Generate unique audio ID
            audio_id = str(uuid.uuid4())
            output_dir = "podcasts"
            os.makedirs(output_dir, exist_ok=True)

            # Use the new pdf_to_podcast method
            audio_file_path = await self.pdf_to_podcast(
                pdf_path=pdf_path,
                target_lang=language,
                translate=True,
                output_dir=output_dir,
                base_filename=f"podcast_{audio_id}",
                size=size
            )

            # Get file info
            file_size = os.path.getsize(audio_file_path)
            logger.info(f"Generated podcast file: {audio_file_path} ({file_size} bytes)")

            return {
                "success": True,
                "audio_id": audio_id,
                "file_path": str(audio_file_path),
                "language": language,
                "language_name": self.supported_languages[language],
                "file_size": file_size,
                "summarized": summarize
            }

        except Exception as e:
            logger.error(f"Error generating multilingual podcast: {e}")
            return {
                "success": False,
                "error": str(e),
                "audio_id": None,
                "file_path": None
            }

    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return self.supported_languages.copy()

# Global instance
enhanced_podcast_service = EnhancedPodcastService()
