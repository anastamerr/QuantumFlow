import json
import logging
import os
import secrets
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from starlette.responses import JSONResponse

from .models import ExecuteRequest, ExecuteResponse
from .qiskit_runner import run_circuit


@dataclass(frozen=True)
class Settings:
    allowed_origins: list[str]
    allow_all_origins: bool
    host: str
    port: int
    auth_username: Optional[str]
    auth_password: Optional[str]
    rate_limit_requests: int
    rate_limit_window_sec: int
    log_level: str


def _load_settings() -> Settings:
    load_dotenv()
    allowed_raw = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if not allowed_raw:
        allowed_origins: list[str] = []
    else:
        allowed_origins = [o.strip() for o in allowed_raw.split(",") if o.strip()]

    allow_all = allowed_origins == ["*"]

    def _env_int(name: str, default: int) -> int:
        try:
            return int(os.getenv(name, str(default)))
        except Exception:
            return default

    return Settings(
        allowed_origins=allowed_origins,
        allow_all_origins=allow_all,
        host=os.getenv("HOST", "0.0.0.0"),
        port=_env_int("PORT", 8000),
        auth_username=os.getenv("AUTH_USERNAME"),
        auth_password=os.getenv("AUTH_PASSWORD"),
        rate_limit_requests=_env_int("RATE_LIMIT_REQUESTS", 0),
        rate_limit_window_sec=_env_int("RATE_LIMIT_WINDOW_SEC", 0),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
    )


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
        }
        for field in (
            "request_id",
            "method",
            "path",
            "status_code",
            "duration_ms",
            "client_ip",
            "user_agent",
        ):
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=True)


def _configure_logging(level: str) -> logging.Logger:
    logger = logging.getLogger("quantumflow")
    logger.setLevel(level.upper() if level else "INFO")
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.handlers = [handler]
    logger.propagate = False

    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False
    return logger


class RateLimiter:
    def __init__(self, max_requests: int, window_sec: int) -> None:
        self.max_requests = max_requests
        self.window_sec = window_sec
        self._hits: dict[str, tuple[float, int]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> Optional[dict]:
        if self.max_requests <= 0 or self.window_sec <= 0:
            return None

        now = time.monotonic()
        with self._lock:
            window_start, count = self._hits.get(key, (now, 0))
            if now - window_start >= self.window_sec:
                window_start, count = now, 0
            count += 1
            self._hits[key] = (window_start, count)

        remaining = max(self.max_requests - count, 0)
        reset = int(time.time() + max(0.0, (window_start + self.window_sec) - now))
        allowed = count <= self.max_requests
        return {
            "allowed": allowed,
            "limit": self.max_requests,
            "remaining": remaining,
            "reset": reset,
        }


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def create_app() -> FastAPI:
    settings = _load_settings()
    logger = _configure_logging(settings.log_level)
    limiter = RateLimiter(settings.rate_limit_requests, settings.rate_limit_window_sec)
    security = HTTPBasic(auto_error=False)

    app = FastAPI(title="QuantumFlow Backend", version="1.0.0")
    app.state.settings = settings
    app.state.logger = logger

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins if not settings.allow_all_origins else ["*"],
        allow_credentials=not settings.allow_all_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def require_basic_auth(
        credentials: Optional[HTTPBasicCredentials] = Depends(security),
    ) -> None:
        if not settings.auth_username or not settings.auth_password:
            return
        if credentials is None:
            raise HTTPException(
                status_code=401,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Basic"},
            )
        valid = secrets.compare_digest(credentials.username, settings.auth_username) and secrets.compare_digest(
            credentials.password, settings.auth_password
        )
        if not valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Basic"},
            )

    @app.middleware("http")
    async def observability_middleware(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        client_ip = _client_ip(request)
        user_agent = request.headers.get("user-agent")

        limit_info = limiter.check(client_ip)
        if limit_info and not limit_info["allowed"]:
            headers = {
                "X-RateLimit-Limit": str(limit_info["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(limit_info["reset"]),
                "X-Request-ID": request_id,
            }
            logger.info(
                "rate_limited",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 429,
                    "duration_ms": 0,
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                },
            )
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}, headers=headers)

        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                    "duration_ms": int((time.monotonic() - start) * 1000),
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                },
            )
            raise

        duration_ms = int((time.monotonic() - start) * 1000)
        response.headers["X-Request-ID"] = request_id
        if limit_info:
            response.headers["X-RateLimit-Limit"] = str(limit_info["limit"])
            response.headers["X-RateLimit-Remaining"] = str(limit_info["remaining"])
            response.headers["X-RateLimit-Reset"] = str(limit_info["reset"])

        logger.info(
            "request_complete",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
                "user_agent": user_agent,
            },
        )
        return response

    @app.get("/health")
    def health():
        qiskit_ok = True
        try:
            import qiskit  # noqa: F401
        except Exception:
            qiskit_ok = False
        return {
            "status": "ok",
            "qiskit": qiskit_ok,
            "backend_env": os.getenv("QISKIT_BACKEND", "aer_simulator"),
            "auth_required": bool(settings.auth_username and settings.auth_password),
            "rate_limit": {
                "requests": settings.rate_limit_requests,
                "window_sec": settings.rate_limit_window_sec,
            }
            if settings.rate_limit_requests > 0 and settings.rate_limit_window_sec > 0
            else None,
        }

    @app.post("/api/v1/execute", response_model=ExecuteResponse, dependencies=[Depends(require_basic_auth)])
    def execute(req: ExecuteRequest) -> ExecuteResponse:
        try:
            result = run_circuit(
                num_qubits=req.num_qubits,
                gates=[g.model_dump() for g in req.gates],
                method=req.method,
                shots=req.shots,
                memory=req.memory,
                override_backend=req.backend,
            )
            return ExecuteResponse(**result, status="success")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = _load_settings()
    uvicorn.run(app, host=settings.host, port=settings.port)
