"""Registry of tools available to the LLM agent."""
from app.providers.base_chat_provider import ToolSpec
from app.tools.base import BaseTool


class ToolRegistry:
    """Holds the set of tools the agent is allowed to call, by name."""

    def __init__(self, tools: list[BaseTool]) -> None:
        self._tools: dict[str, BaseTool] = {tool.name: tool for tool in tools}

    def get(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def all(self) -> list[BaseTool]:
        return list(self._tools.values())

    def specs(self) -> list[ToolSpec]:
        """Provider-agnostic tool specs (JSON schema), for the LLM's function-calling API."""
        return [
            ToolSpec(name=tool.name, description=tool.description, parameters=tool.args_model.model_json_schema())
            for tool in self._tools.values()
        ]
