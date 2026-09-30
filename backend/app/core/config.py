from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "INTER-NET API"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api/v1"
    API_V1_STR: str = "/api/v1"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "Admin"
    DB_PASSWORD: str = "Admin123"
    DB_NAME: str = "inter_net"
    DATABASE_URL: Optional[str] = None

    @property
    def sync_database_url(self) -> str:
        """
        @brief Builds the synchronous database URL, using DATABASE_URL when set or a MySQL PyMySQL URL from the DB settings.
        @return The database connection URL string.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    SECRET_KEY: str = "super_secret_jwt_key_inter_net_dashboard_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    STEAM_API_KEY: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_API_KEY: Optional[str] = None
    STEAM_SERVICE_URL: str = "http://localhost:8081"
    GITHUB_SERVICE_URL: str = "http://localhost:8082"
    BASE_URL: str = "http://localhost:8080"
    FRONTEND_URL: str = "http://localhost:3000"

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """
        @brief Validates and normalizes the CORS origins setting from a JSON list, comma-separated string or list.
        @param v The raw CORS origins value, either a string or a list of strings.
        @return The list of allowed origin strings, or a default localhost list for unsupported types.
        """
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                import json
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8080",
            "http://localhost:8000",
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
