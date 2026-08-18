"""A lightweight, second-stage reranker over vector-search candidates.

Pipeline: Question -> Embedding -> Vector Search -> Top N Candidates -> Reranker
-> Top K -> RAG.

Deliberately simple, per the milestone's own guidance: no extra model, no extra
API call, no new dependency. It rescoring candidates by lexical (token) overlap
between the query and each chunk's content — a classic, cheap complement to pure
vector similarity that tends to promote chunks containing the query's actual
keywords over ones that are merely semantically nearby. The final score blends
the two signals so a reranked result never ignores vector similarity entirely.
"""
import re
from dataclasses import replace

from app.services.retrieval_types import RetrievedChunk

_TOKEN_PATTERN = re.compile(r"[\w]+", re.UNICODE)

# How much weight the lexical overlap score gets versus the original vector
# similarity score when blending. 0.0 would ignore lexical overlap entirely
# (pure vector order); 1.0 would ignore vector similarity entirely.
_LEXICAL_WEIGHT = 0.4


def _tokenize(text: str) -> set[str]:
    return {token.lower() for token in _TOKEN_PATTERN.findall(text)}


def _lexical_overlap_score(query_tokens: set[str], content: str) -> float:
    """Fraction of query tokens that appear in the chunk's content (0..1)."""
    if not query_tokens:
        return 0.0
    content_tokens = _tokenize(content)
    if not content_tokens:
        return 0.0
    overlap = len(query_tokens & content_tokens)
    return overlap / len(query_tokens)


class RerankingService:
    """Reorders and truncates retrieval candidates using a blended relevance score."""

    def __init__(self, lexical_weight: float = _LEXICAL_WEIGHT) -> None:
        self._lexical_weight = lexical_weight

    def rerank(self, query: str, candidates: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        if not candidates:
            return []

        query_tokens = _tokenize(query)
        scored = [
            (
                (1 - self._lexical_weight) * chunk.similarity_score
                + self._lexical_weight * _lexical_overlap_score(query_tokens, chunk.content),
                chunk,
            )
            for chunk in candidates
        ]
        scored.sort(key=lambda pair: pair[0], reverse=True)

        return [
            replace(chunk, similarity_score=round(blended_score, 4)) for blended_score, chunk in scored[:top_k]
        ]
