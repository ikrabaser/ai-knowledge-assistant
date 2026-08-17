"""Text extraction from PDF, DOCX and TXT files."""
from io import BytesIO

from docx import Document as DocxDocument
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.core.exceptions import ParsingError, UnsupportedFileTypeError

SUPPORTED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}


class ParsingService:
    """Extracts plain text from supported document formats."""

    def extract_text(self, content: bytes, content_type: str) -> str:
        file_kind = SUPPORTED_CONTENT_TYPES.get(content_type)
        if file_kind is None:
            raise UnsupportedFileTypeError(f"Unsupported content type: {content_type}")

        if file_kind == "pdf":
            text = self._extract_pdf(content)
        elif file_kind == "docx":
            text = self._extract_docx(content)
        else:
            text = self._extract_txt(content)

        cleaned = text.strip()
        if not cleaned:
            raise ParsingError("Document contains no extractable text.")
        return cleaned

    def _extract_pdf(self, content: bytes) -> str:
        try:
            reader = PdfReader(BytesIO(content))
            if reader.is_encrypted:
                raise ParsingError("PDF is password-protected and cannot be read.")
            pages_text = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages_text)
        except ParsingError:
            raise
        except (PdfReadError, ValueError) as exc:
            raise ParsingError(f"Failed to parse PDF file: {exc}") from exc

    def _extract_docx(self, content: bytes) -> str:
        try:
            document = DocxDocument(BytesIO(content))
            paragraphs = [paragraph.text for paragraph in document.paragraphs]
            return "\n".join(paragraphs)
        except Exception as exc:  # python-docx raises varied/undocumented exceptions on corrupt files
            raise ParsingError(f"Failed to parse DOCX file: {exc}") from exc

    def _extract_txt(self, content: bytes) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return content.decode("latin-1")
            except UnicodeDecodeError as exc:
                raise ParsingError(f"Failed to decode TXT file: {exc}") from exc
