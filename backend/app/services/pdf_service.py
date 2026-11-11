import os
import json
import re
from typing import List, Dict, Any, Tuple, Optional

class PDFService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Tuple[int, List[Dict[str, Any]], Optional[str]]:
        """
        Extracts text from a PDF file page by page.
        Returns:
            (page_count, pages_data, error_message)
            where pages_data is list of {"page": page_num (1-indexed), "text": str}
        """
        if not os.path.exists(file_path):
            return 0, [], "File not found on disk."

        # Attempt with PyMuPDF (fitz) first
        try:
            import fitz
            doc = fitz.open(file_path)
            if doc.is_encrypted:
                return 0, [], "This PDF is password-protected. Please upload an unprotected PDF."
            
            pages_data = []
            page_count = len(doc)
            total_chars = 0

            for page_index in range(page_count):
                page = doc[page_index]
                text = page.get_text("text").strip()
                pages_data.append({
                    "page": page_index + 1,
                    "text": text
                })
                total_chars += len(text)

            doc.close()

            if total_chars < 20 and page_count > 0:
                # Scanned or image-only PDF warning
                return page_count, pages_data, "PDF appears to be scanned or contains very little selectable text."

            return page_count, pages_data, None

        except ImportError:
            # Fallback to pypdf
            pass
        except Exception as e:
            # If fitz had an issue (e.g. corrupted file), try pypdf fallback before failing
            print(f"PyMuPDF error: {e}, falling back to pypdf")

        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            if reader.is_encrypted:
                return 0, [], "This PDF is password-protected. Please upload an unprotected PDF."

            pages_data = []
            page_count = len(reader.pages)
            total_chars = 0

            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                text = text.strip()
                pages_data.append({
                    "page": i + 1,
                    "text": text
                })
                total_chars += len(text)

            if total_chars < 20 and page_count > 0:
                return page_count, pages_data, "PDF appears to be scanned or contains very little selectable text."

            return page_count, pages_data, None

        except Exception as e:
            return 0, [], f"Could not read PDF: {str(e)}"

    @staticmethod
    def get_relevant_chunks(pages_data: List[Dict[str, Any]], query: str, max_chars: int = 14000) -> Tuple[str, List[int]]:
        """
        Selects relevant pages or chunks based on query keywords.
        Returns (context_text, source_pages_list).
        """
        if not pages_data:
            return "", []

        # If total document is small enough, include all pages
        total_text = "\n\n".join([f"--- Page {p['page']} ---\n{p['text']}" for p in pages_data])
        if len(total_text) <= max_chars:
            pages = [p["page"] for p in pages_data if len(p.get("text", "").strip()) > 0]
            return total_text, pages

        # Simple score-based retrieval based on query terms
        query_words = set(re.findall(r"\w+", query.lower()))
        # Filter common stopwords
        stopwords = {"what", "is", "the", "a", "an", "and", "or", "in", "of", "to", "for", "with", "how", "why", "does", "explain"}
        keywords = [w for w in query_words if w not in stopwords and len(w) > 2]

        scored_pages = []
        for p in pages_data:
            page_text = p.get("text", "")
            lower_text = page_text.lower()
            if not lower_text.strip():
                continue
            score = 0
            for kw in keywords:
                # Count frequency of keyword
                count = lower_text.count(kw)
                score += count * 2
            # Add small prior for earlier pages
            score += 1.0 / (p["page"] + 1)
            scored_pages.append((score, p["page"], p["text"]))

        # Sort descending by relevance score
        scored_pages.sort(key=lambda x: x[0], reverse=True)

        selected_pages = []
        accumulated_chars = 0
        used_page_nums = []

        for score, page_num, text in scored_pages:
            formatted = f"--- Page {page_num} ---\n{text}"
            if accumulated_chars + len(formatted) > max_chars:
                break
            selected_pages.append((page_num, formatted))
            accumulated_chars += len(formatted)
            used_page_nums.append(page_num)

        # Re-sort chronologically by page number for readability
        selected_pages.sort(key=lambda x: x[0])
        final_context = "\n\n".join([item[1] for item in selected_pages])
        return final_context, sorted(used_page_nums)

pdf_service = PDFService()

