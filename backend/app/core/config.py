"""Core configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # OpenRouter (AI)
    openrouter_api_key: str = Field(default="", description="OpenRouter API key from InsForge")
    openrouter_model: str = Field(default="google/gemini-2.5-flash", description="LLM model to use")

    # Kubernetes
    kubeconfig_path: str = Field(default="~/.kube/config", description="Path to kubeconfig file")

    # InsForge
    insforge_url: str = Field(default="", description="InsForge backend URL")
    insforge_anon_key: str = Field(default="", description="InsForge anonymous key")

    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
