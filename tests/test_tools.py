"""Tests for individual tools, the registry, and ToolExecutionService's safety net."""
import pytest

from app.services.document_service import DocumentService
from app.services.tool_execution_service import ToolExecutionService
from app.services.workspace_service import WorkspaceService
from app.tools.base import ToolContext
from app.tools.get_document_tool import GetDocumentTool
from app.tools.list_documents_tool import ListDocumentsTool
from app.tools.list_workspaces_tool import ListWorkspacesTool
from app.tools.registry import ToolRegistry
from tests.fakes import FakeDocumentRepository, FakeWorkspaceRepository

OWNER_ID = 1
OTHER_USER_ID = 2


async def _seed() -> tuple[WorkspaceService, DocumentService, int]:
    workspace_repository = FakeWorkspaceRepository()
    workspace_service = WorkspaceService(workspace_repository)
    workspace = await workspace_service.create(name="Mine", owner_id=OWNER_ID)

    document_repository = FakeDocumentRepository()
    from app.services.chunking_service import ChunkingService
    from app.services.embedding_service import EmbeddingService
    from app.services.parsing_service import ParsingService
    from tests.fakes import FakeChunkRepository, FakeEmbeddingProvider

    document_service = DocumentService(
        document_repository=document_repository,
        chunk_repository=FakeChunkRepository(),
        parsing_service=ParsingService(),
        chunking_service=ChunkingService(chunk_size=50, chunk_overlap=10),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        upload_directory="/tmp/tool-test-uploads",
        max_upload_size_mb=1,
    )
    return workspace_service, document_service, workspace.id


@pytest.mark.asyncio
async def test_list_workspaces_tool_only_returns_the_callers_workspaces() -> None:
    workspace_service, _, _ = await _seed()
    await workspace_service.create(name="Someone else's", owner_id=OTHER_USER_ID)
    tool = ListWorkspacesTool(workspace_service)

    result = await tool.execute(tool.args_model(), ToolContext(user_id=OWNER_ID))

    assert len(result["workspaces"]) == 1
    assert result["workspaces"][0]["name"] == "Mine"


@pytest.mark.asyncio
async def test_list_documents_tool_rejects_a_non_owner(tmp_path) -> None:
    workspace_service, document_service, workspace_id = await _seed()
    tool = ListDocumentsTool(document_service, workspace_service)

    from app.core.exceptions import WorkspaceNotFoundError

    with pytest.raises(WorkspaceNotFoundError):
        await tool.execute(tool.args_model(workspace_id=workspace_id), ToolContext(user_id=OTHER_USER_ID))


@pytest.mark.asyncio
async def test_get_document_tool_rejects_a_non_owner() -> None:
    workspace_service, document_service, workspace_id = await _seed()
    document = await document_service._documents.create(
        filename="a.txt", stored_filename="x.txt", content_type="text/plain", workspace_id=workspace_id
    )
    tool = GetDocumentTool(document_service, workspace_service)

    from app.core.exceptions import WorkspaceNotFoundError

    with pytest.raises(WorkspaceNotFoundError):
        await tool.execute(
            tool.args_model(workspace_id=workspace_id, document_id=document.id),
            ToolContext(user_id=OTHER_USER_ID),
        )


@pytest.mark.asyncio
async def test_tool_registry_produces_json_schema_specs() -> None:
    workspace_service, document_service, _ = await _seed()
    registry = ToolRegistry([ListWorkspacesTool(workspace_service), ListDocumentsTool(document_service, workspace_service)])

    specs = registry.specs()

    names = {s.name for s in specs}
    assert names == {"list_workspaces", "list_documents"}
    assert all(isinstance(s.parameters, dict) for s in specs)


@pytest.mark.asyncio
async def test_tool_execution_service_rejects_unknown_tool() -> None:
    registry = ToolRegistry([])
    service = ToolExecutionService(registry)

    result = await service.execute("call-1", "delete_everything", {}, ToolContext(user_id=OWNER_ID))

    assert result.success is False
    assert "Unknown tool" in result.error


@pytest.mark.asyncio
async def test_tool_execution_service_rejects_invalid_arguments() -> None:
    workspace_service, document_service, _ = await _seed()
    registry = ToolRegistry([ListDocumentsTool(document_service, workspace_service)])
    service = ToolExecutionService(registry)

    result = await service.execute("call-1", "list_documents", {"workspace_id": "not-a-number"}, ToolContext(user_id=OWNER_ID))

    assert result.success is False
    assert "Invalid arguments" in result.error


@pytest.mark.asyncio
async def test_tool_execution_service_never_raises_on_authorization_failure() -> None:
    workspace_service, document_service, workspace_id = await _seed()
    registry = ToolRegistry([ListDocumentsTool(document_service, workspace_service)])
    service = ToolExecutionService(registry)

    result = await service.execute(
        "call-1", "list_documents", {"workspace_id": workspace_id}, ToolContext(user_id=OTHER_USER_ID)
    )

    assert result.success is False
    assert result.result is None


@pytest.mark.asyncio
async def test_tool_execution_service_returns_structured_result_on_success() -> None:
    workspace_service, document_service, workspace_id = await _seed()
    registry = ToolRegistry([ListDocumentsTool(document_service, workspace_service)])
    service = ToolExecutionService(registry)

    result = await service.execute(
        "call-1", "list_documents", {"workspace_id": workspace_id}, ToolContext(user_id=OWNER_ID)
    )

    assert result.success is True
    assert result.result == {"documents": []}
