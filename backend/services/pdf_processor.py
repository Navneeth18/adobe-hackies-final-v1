# backend/services/pdf_processor.py
import fitz
import re
import os
import nltk
from concurrent.futures import ThreadPoolExecutor

nltk.data.path.append('./core_engine_data/nltk_data')

def _clean_text(text):
    text = re.sub(r'[\u2022\u25E6\u25CF\ufb00-\ufb04]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

class SectionExtractor:
    def _is_heading_by_layout(self, text: str) -> bool:
        if not text or len(text.split()) > 12 or text.strip().endswith(('.', '!', '?')): return False
        if not (text.istitle() or text.isupper()) and len(text.split()) > 1: return False
        if len(text) <= 2: return False
        return True

    def extract_from_pdf(self, pdf_path: str) -> list:
        doc_name = os.path.basename(pdf_path)
        sections = []
        try:
            doc = fitz.open(pdf_path)
            current_heading, current_content, heading_page = "Introduction", [], 1
            for page_num, page in enumerate(doc, 1):
                for block in page.get_text("blocks"):
                    block_text = _clean_text(block[4])
                    if not block_text: continue
                    if self._is_heading_by_layout(block_text):
                        if current_content:
                            sections.append({"title": current_heading, "content": " ".join(current_content), "source": doc_name, "page": heading_page})
                        current_heading, current_content, heading_page = block_text, [], page_num
                    else:
                        current_content.append(block_text)
            if current_content:
                sections.append({"title": current_heading, "content": " ".join(current_content), "source": doc_name, "page": heading_page})
        except Exception as e:
            print(f"[ERROR] Could not process {doc_name}: {e}")
        return sections

    def extract_parallel(self, pdf_paths: list) -> dict:
        results = {}
        with ThreadPoolExecutor(max_workers=min(8, os.cpu_count() or 1)) as executor:
            future_to_path = {executor.submit(self.extract_from_pdf, path): path for path in pdf_paths}
            for future in future_to_path:
                path = future_to_path[future]
                try: results[path] = future.result()
                except Exception as exc: results[path] = []
        return results

pdf_processor_service = SectionExtractor()