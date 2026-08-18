"""Tests for RerankingService: the lexical-overlap second-stage reranker."""
from app.services.reranking_service import RerankingService
from app.services.retrieval_types import RetrievedChunk


def _chunk(document_id: int, content: str, similarity_score: float) -> RetrievedChunk:
    return RetrievedChunk(
        document_id=document_id,
        filename=f"doc-{document_id}.txt",
        chunk_index=0,
        content=content,
        similarity_score=similarity_score,
    )


def test_rerank_returns_empty_list_for_no_candidates() -> None:
    service = RerankingService()

    assert service.rerank("anything", [], top_k=5) == []


def test_rerank_truncates_to_top_k() -> None:
    service = RerankingService()
    candidates = [_chunk(i, f"chunk number {i}", 0.5) for i in range(10)]

    result = service.rerank("chunk", candidates, top_k=3)

    assert len(result) == 3


def test_rerank_promotes_exact_keyword_matches_over_higher_vector_score() -> None:
    """A lower vector-similarity chunk that actually contains the query terms
    should be able to outrank a higher-similarity chunk that doesn't.
    """
    service = RerankingService(lexical_weight=0.9)
    off_topic_but_high_similarity = _chunk(1, "Completely unrelated filler content here.", 0.95)
    on_topic_but_lower_similarity = _chunk(2, "Annual leave policy grants fourteen days per year.", 0.40)

    result = service.rerank(
        "annual leave policy", [off_topic_but_high_similarity, on_topic_but_lower_similarity], top_k=2
    )

    assert result[0].document_id == 2


def test_rerank_falls_back_to_vector_order_when_lexical_weight_is_zero() -> None:
    service = RerankingService(lexical_weight=0.0)
    higher = _chunk(1, "no keyword overlap", 0.9)
    lower = _chunk(2, "annual leave policy annual leave policy", 0.2)

    result = service.rerank("annual leave policy", [higher, lower], top_k=2)

    assert result[0].document_id == 1


def test_rerank_never_returns_more_than_the_input_candidates() -> None:
    service = RerankingService()
    candidates = [_chunk(1, "one match term", 0.5)]

    result = service.rerank("term", candidates, top_k=10)

    assert len(result) == 1
