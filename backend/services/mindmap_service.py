# backend/services/mindmap_service.py
import os
import re
from typing import List, Tuple, Optional
from dataclasses import dataclass

# PDF text extraction
from pdfminer.high_level import extract_text

# NLP / keyphrase scoring
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from nltk.corpus import stopwords

# Ensure nltk stopwords exist
try:
    STOP_WORDS = set(stopwords.words("english"))
except Exception:
    nltk.download("stopwords")
    STOP_WORDS = set(stopwords.words("english"))

@dataclass
class Section:
    title: str
    text: str

class MindmapService:
    def __init__(self):
        self.stop_words = STOP_WORDS

    def read_pdf_text(self, path: str) -> str:
        """Extract text from PDF file"""
        if not os.path.isfile(path):
            raise FileNotFoundError(f"PDF file not found: {path}")
        text = extract_text(path)
        return text or ""

    def normalize_line(self, s: str) -> str:
        """Normalize line by removing extra whitespace"""
        return re.sub(r'\s+', ' ', s.strip())

    def is_heading_line(self, line: str) -> bool:
        """Detect if a line is likely a heading"""
        if not line or len(line) < 2:
            return False
        s = line.strip()

        # Numbered headings: "1", "2.1", "3. Method"
        if re.match(r'^\d+(\.\d+)*(\s+.*)?$', s):
            return True

        # All-caps heading (short)
        if len(s) <= 120 and re.fullmatch(r'[A-Z0-9\s\-\(\):,./&]+', s) and re.search(r'[A-Z]', s):
            # avoid single-letter lines
            return len(s) > 3

        # Ends with colon
        if s.endswith(':') and len(s) <= 120:
            return True

        return False

    def split_sections_by_headings(self, text: str, min_section_chars: int = 200) -> List[Section]:
        """Split text into sections based on detected headings"""
        lines = [self.normalize_line(l) for l in text.splitlines()]
        headings_idx = [i for i, l in enumerate(lines) if self.is_heading_line(l)]
        
        # Merge headings very close to each other
        filtered = []
        last = -10
        for i in headings_idx:
            if i - last >= 2:
                filtered.append(i)
                last = i
        headings_idx = filtered

        if len(headings_idx) >= 2:
            sections = []
            for i, h in enumerate(headings_idx):
                start = h
                end = headings_idx[i+1] if i+1 < len(headings_idx) else len(lines)
                title = lines[start] or f"Section {i+1}"
                body = "\n".join(lines[start+1:end]).strip()
                if len(body) < min_section_chars:
                    # keep even small sections but label them
                    pass
                sections.append(Section(title=title, text=body if body else ""))
            
            # Filter empty text sections but keep title-only if needed
            sections = [s for s in sections if s.text.strip() or s.title.strip()]
            return sections

        # fallback: split by paragraph blocks separated by blank lines
        blocks = []
        buf = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                if buf:
                    blocks.append(" ".join(buf).strip())
                    buf = []
            else:
                buf.append(line)
        if buf:
            blocks.append(" ".join(buf).strip())

        # Create sections of ~1000-1500 chars (safe chunking)
        chunks = []
        current = ""
        for b in blocks:
            if not current:
                current = b
            elif len(current) + len(b) + 1 <= 1500:
                current += "\n\n" + b
            else:
                chunks.append(current)
                current = b
        if current:
            chunks.append(current)

        sections = []
        for i, ch in enumerate(chunks, 1):
            title = f"Section {i}"
            sections.append(Section(title=title, text=ch))
        if not sections:
            sections = [Section(title="Document", text=text)]
        return sections

    def safe_tfidf_top_phrases(self, sections: List[Section], top_k: int = 6) -> List[Tuple[Section, List[str]]]:
        """Extract top phrases from sections using TF-IDF"""
        docs = [s.text for s in sections]
        # token pattern keeps words with letters and numbers, avoids single letters.
        token_pattern = r'(?u)\b[a-zA-Z][a-zA-Z0-9\-]{1,}\b'

        # Try with reasonable min_df, but fallback if ValueError (small docs)
        try:
            vect = TfidfVectorizer(
                ngram_range=(1, 3), 
                stop_words='english', 
                token_pattern=token_pattern, 
                min_df=1, 
                max_df=0.95
            )
            X = vect.fit_transform(docs)
        except Exception:
            vect = TfidfVectorizer(
                ngram_range=(1, 2), 
                stop_words='english', 
                token_pattern=token_pattern, 
                min_df=1
            )
            X = vect.fit_transform(docs)

        terms = vect.get_feature_names_out()
        result = []
        for i, sec in enumerate(sections):
            row = X.getrow(i)
            if row.nnz == 0:
                result.append((sec, []))
                continue
            idx_scores = list(zip(row.indices, row.data))
            idx_scores.sort(key=lambda x: x[1], reverse=True)
            phrases = []
            seen = set()
            for idx, score in idx_scores:
                term = terms[idx]
                t_lower = term.lower()
                # filter stopword-only phrases and duplicates
                if all(w in self.stop_words for w in t_lower.split()):
                    continue
                if t_lower in seen:
                    continue
                seen.add(t_lower)
                phrases.append(term)
                if len(phrases) >= top_k:
                    break
            result.append((sec, phrases))
        return result

    def escape_xml(self, s: str) -> str:
        """Escape XML special characters"""
        return (s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&apos;"))

    def to_freemind_mm(self, root: str, scored: List[Tuple[Section, List[str]]]) -> str:
        """Generate FreeMind .mm format mindmap"""
        out = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<map version="0.9.0">',
            f'  <node TEXT="{self.escape_xml(root)}">'
        ]
        for sec, phrases in scored:
            out.append(f'    <node TEXT="{self.escape_xml(sec.title)}">')
            # include a summary of the section (first 120 chars) as a child
            summary = (sec.text[:120] + '...') if len(sec.text) > 120 else sec.text
            if summary.strip():
                out.append(f'      <node TEXT="{self.escape_xml(summary)}" />')
            for ph in phrases:
                out.append(f'      <node TEXT="{self.escape_xml(ph)}" />')
            out.append('    </node>')
        out.append('  </node>')
        out.append('</map>')
        return "\n".join(out)

    def escape_mermaid(self, s: str) -> str:
        """Escape Mermaid special characters"""
        return s.replace('"', '\\"')

    def clean_mermaid_text(self, text: str) -> str:
        """Clean text for Mermaid mindmap format"""
        if not text:
            return ""
        
        # Remove ALL parentheses and problematic characters
        cleaned = re.sub(r'[^\w\s\-.,]', '', text)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Limit length to avoid parsing issues
        if len(cleaned) > 40:
            cleaned = cleaned[:37] + "..."
        
        # Replace spaces with underscores for valid node IDs
        node_id = re.sub(r'\s+', '_', cleaned)
        return node_id

    def to_mermaid_mmd(self, root: str, scored: List[Tuple[Section, List[str]]]) -> str:
        """Generate Mermaid mindmap format"""
        root_id = self.clean_mermaid_text(root)
        lines = [
            "mindmap",
            f'  root[{root_id}]'
        ]
        
        for i, (sec, phrases) in enumerate(scored):
            # Create section node with clean text and unique ID
            sec_id = f"sec{i}_{self.clean_mermaid_text(sec.title)}"
            lines.append(f'    {sec_id}[{self.clean_mermaid_text(sec.title)}]')
            
            # Add phrases as sub-nodes
            for j, phrase in enumerate(phrases[:4]):  # Limit to 4 phrases
                clean_phrase = self.clean_mermaid_text(phrase)
                if clean_phrase and len(clean_phrase) > 2:  # Only add meaningful phrases
                    phrase_id = f"p{i}_{j}_{clean_phrase[:10]}"
                    lines.append(f'      {phrase_id}[{clean_phrase}]')
        
        return "\n".join(lines)

    def generate_mindmap_from_pdf(
        self, 
        pdf_path: str, 
        max_sections: int = 12, 
        phrases_per_section: int = 6
    ) -> dict:
        """Generate mindmap data from PDF file"""
        text = self.read_pdf_text(pdf_path)
        if not text.strip():
            raise RuntimeError("No text found in PDF. If PDF is scanned, run OCR first (e.g., ocrmypdf).")

        # root title from first non-empty line
        root = "Document"
        for l in text.splitlines():
            if l.strip():
                root = self.normalize_line(l)[:120]
                break

        sections = self.split_sections_by_headings(text)
        # sort by length and keep top N
        sections = sorted(sections, key=lambda s: len(s.text), reverse=True)[:max_sections]

        scored = self.safe_tfidf_top_phrases(sections, top_k=phrases_per_section)

        # Generate both formats
        mermaid_content = self.to_mermaid_mmd(root, scored)
        freemind_content = self.to_freemind_mm(root, scored)

        return {
            "root_title": root,
            "sections_count": len(sections),
            "mermaid": mermaid_content,
            "freemind": freemind_content,
            "sections": [
                {
                    "title": sec.title,
                    "phrases": phrases,
                    "content_preview": sec.text[:200] + "..." if len(sec.text) > 200 else sec.text
                }
                for sec, phrases in scored
            ]
        }

    def generate_mindmap_from_text(
        self, 
        text: str, 
        title: str = "Document",
        max_sections: int = 12, 
        phrases_per_section: int = 6
    ) -> dict:
        """Generate mindmap data from raw text"""
        if not text.strip():
            raise RuntimeError("No text provided for mindmap generation.")

        sections = self.split_sections_by_headings(text)
        # sort by length and keep top N
        sections = sorted(sections, key=lambda s: len(s.text), reverse=True)[:max_sections]

        scored = self.safe_tfidf_top_phrases(sections, top_k=phrases_per_section)

        # Generate both formats
        mermaid_content = self.to_mermaid_mmd(title, scored)
        freemind_content = self.to_freemind_mm(title, scored)

        return {
            "root_title": title,
            "sections_count": len(sections),
            "mermaid": mermaid_content,
            "freemind": freemind_content,
            "sections": [
                {
                    "title": sec.title,
                    "phrases": phrases,
                    "content_preview": sec.text[:200] + "..." if len(sec.text) > 200 else sec.text
                }
                for sec, phrases in scored
            ]
        }

# Global service instance
mindmap_service = MindmapService()
