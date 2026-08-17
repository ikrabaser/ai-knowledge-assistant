"""Tests for ParsingService."""
import pytest

from app.core.exceptions import ParsingError, UnsupportedFileTypeError
from app.services.parsing_service import ParsingService


@pytest.fixture
def parsing_service() -> ParsingService:
    return ParsingService()


def test_extract_text_from_txt(parsing_service: ParsingService) -> None:
    content = "Şirketin yıllık izin politikası 14 gündür.".encode("utf-8")

    text = parsing_service.extract_text(content, "text/plain")

    assert "yıllık izin politikası" in text


def test_extract_text_rejects_unsupported_content_type(parsing_service: ParsingService) -> None:
    with pytest.raises(UnsupportedFileTypeError):
        parsing_service.extract_text(b"whatever", "application/zip")


def test_extract_text_rejects_empty_txt(parsing_service: ParsingService) -> None:
    with pytest.raises(ParsingError):
        parsing_service.extract_text(b"   \n\t  ", "text/plain")


def test_extract_text_from_corrupt_pdf_raises_parsing_error(parsing_service: ParsingService) -> None:
    with pytest.raises(ParsingError):
        parsing_service.extract_text(b"not a real pdf", "application/pdf")
