import os
import socket

from fastapi import FastAPI, Request

from common.cache import Cache

INSTANCE_ID = socket.gethostname()


def create_service_app(title: str) -> FastAPI:
    """
    @brief Creates a FastAPI app for a microservice with an X-Served-By header middleware and a health endpoint.
    @param title Title of the FastAPI application.
    @return The configured FastAPI application.
    """
    app = FastAPI(title=title)

    @app.middleware("http")
    async def add_instance_header(request: Request, call_next):
        """
        @brief Middleware that adds an X-Served-By header with the instance hostname to every response.
        @param request Incoming HTTP request.
        @param call_next Callable that forwards the request to the next handler.
        @return The downstream response with the X-Served-By header set.
        """
        response = await call_next(request)
        response.headers["X-Served-By"] = INSTANCE_ID
        return response

    @app.get("/health")
    def health():
        """
        @brief Handles the health check endpoint reporting service status and instance identifier.
        @return A dictionary with status ok and the instance hostname.
        """
        return {"status": "ok", "instance": INSTANCE_ID}

    return app


def create_cache(namespace: str) -> Cache:
    """
    @brief Creates a namespaced Cache configured from the CACHE_TTL_SECONDS and REDIS_URL environment variables.
    @param namespace Namespace prefix used for the cache keys.
    @return A Cache instance using Redis when a URL is configured.
    """
    return Cache(
        namespace=namespace,
        ttl=int(os.getenv("CACHE_TTL_SECONDS", "300")),
        redis_url=os.getenv("REDIS_URL") or None,
    )
