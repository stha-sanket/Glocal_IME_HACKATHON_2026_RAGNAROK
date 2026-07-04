"""
Voice Banking Sahayak — FastAPI Server
=======================================
Exposes the LangGraph agent as a REST API with per-session state management.

Endpoints:
  POST   /v1/auth/register      — Register a new user
  POST   /v1/auth/login         — Login and receive a session token
  POST   /v1/auth/logout        — Logout and destroy the session
  GET    /v1/session/me         — Get current session info (auth required)
  POST   /v1/converse           — Send a message; receive agent reply (auth required)
  DELETE /v1/session/reset      — Reset conversation state (auth required)

Run:
    source venv/bin/activate
    uvicorn server:app --reload --port 8000
"""

import uuid
import logging
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from agent import build_graph, fresh_state
from api_client import BankingAPIClient, APIError

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("voicebanking.server")

# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Voice Banking Sahayak API",
    description=(
        "Agentic voice-banking assistant powered by LangGraph + Ollama.\n\n"
        "Use `POST /v1/auth/login` to get a `session_token`, then pass it as "
        "`X-Session-Token: <token>` on all protected endpoints."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# In-Memory Session Store
# ─────────────────────────────────────────────────────────────────────────────

class Session:
    def __init__(self, client: BankingAPIClient):
        self.client = client
        self.graph = build_graph(client)
        self.agent_state: dict | None = None
        self.created_at = datetime.utcnow()
        self.last_active = datetime.utcnow()

sessions: dict[str, Session] = {}

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, examples=["Prashant Adhikari"])
    email: EmailStr = Field(..., examples=["prashant@example.com"])
    password: str = Field(..., min_length=6, examples=["Test@1234"])
    account_number: str | None = Field(None, examples=["13273039260361"])

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["prashant@example.com"])
    password: str = Field(..., examples=["Test@1234"])

class LoginResponse(BaseModel):
    session_token: str
    user: dict
    message: str = "Login successful."

class RegisterResponse(BaseModel):
    message: str

class SessionInfoResponse(BaseModel):
    session_token: str
    user: dict
    created_at: datetime
    last_active: datetime

class ConversationRequest(BaseModel):
    message: str = Field(..., min_length=1, examples=["send 5000 to sunway ko bhai"])

class ConversationResponse(BaseModel):
    reply: str
    intent: str | None = None
    slots: dict[str, Any] | None = None
    phase: str | None = None
    intent_queue: list[dict[str, Any]] | None = None
    history: list[dict[str, Any]] | None = None
    awaiting_queue_confirm: bool | None = None

class ErrorResponse(BaseModel):
    detail: str

# ─────────────────────────────────────────────────────────────────────────────
# Auth Dependency
# ─────────────────────────────────────────────────────────────────────────────

def get_session(x_session_token: str = Header(..., alias="X-Session-Token")) -> Session:
    """Resolve and return the Session for the given token, or raise 401."""
    session = sessions.get(x_session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session token. Please login again.")
    session.last_active = datetime.utcnow()
    return session

# ─────────────────────────────────────────────────────────────────────────────
# Routes — Auth
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/v1/auth/register",
    response_model=RegisterResponse,
    status_code=201,
    tags=["Auth"],
    summary="Register a new user",
)
async def register(body: RegisterRequest):
    """
    Creates a new bank account. Returns a success message.
    No authentication required.
    """
    client = BankingAPIClient()
    try:
        result = client.register(
            name=body.name,
            email=body.email,
            password=body.password,
            account_number=body.account_number or "",
        )
        return RegisterResponse(message=result.get("message", "User registered successfully."))
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/v1/auth/login",
    response_model=LoginResponse,
    tags=["Auth"],
    summary="Login and receive a session token",
)
async def login(body: LoginRequest):
    """
    Authenticates the user and returns a `session_token`.
    Pass this token as `X-Session-Token` header on all subsequent requests.
    """
    client = BankingAPIClient()
    try:
        user_info = client.login(email=body.email, password=body.password)
    except APIError as e:
        raise HTTPException(status_code=401, detail=str(e))

    token = str(uuid.uuid4())
    sessions[token] = Session(client=client)
    logger.info(f"[session:{token[:8]}] Login — {body.email} | account={user_info.get('accountNumber')}")
    return LoginResponse(session_token=token, user=user_info)


@app.post(
    "/v1/auth/logout",
    status_code=200,
    tags=["Auth"],
    summary="Logout and invalidate the session",
)
async def logout(session: Session = Depends(get_session), x_session_token: str = Header(..., alias="X-Session-Token")):
    """
    Clears the session from the server and logs the user out from the banking backend.
    """
    try:
        session.client.logout()
    except Exception:
        pass
    sessions.pop(x_session_token, None)
    logger.info(f"[session:{x_session_token[:8]}] Logged out.")
    return {"message": "Logged out successfully."}

# ─────────────────────────────────────────────────────────────────────────────
# Routes — Session
# ─────────────────────────────────────────────────────────────────────────────

@app.get(
    "/v1/session/me",
    response_model=SessionInfoResponse,
    tags=["Session"],
    summary="Get current session info",
)
async def session_info(
    session: Session = Depends(get_session),
    x_session_token: str = Header(..., alias="X-Session-Token"),
):
    """Returns the authenticated user's profile and session timestamps."""
    return SessionInfoResponse(
        session_token=x_session_token,
        user=session.client.user_info,
        created_at=session.created_at,
        last_active=session.last_active,
    )


@app.delete(
    "/v1/session/reset",
    status_code=200,
    tags=["Session"],
    summary="Reset conversation state (keep logged in)",
)
async def reset_conversation(session: Session = Depends(get_session)):
    """
    Clears the agent's conversation memory for this session without logging out.
    Useful to start a fresh conversation context.
    """
    session.agent_state = None
    logger.info(f"Conversation state reset for session.")
    return {"message": "Conversation state reset successfully."}

# ─────────────────────────────────────────────────────────────────────────────
# Routes — Conversation
# ─────────────────────────────────────────────────────────────────────────────

@app.post(
    "/v1/converse",
    response_model=ConversationResponse,
    tags=["Conversation"],
    summary="Send a message and receive an agent reply",
)
async def converse(
    body: ConversationRequest,
    session: Session = Depends(get_session),
):
    """
    Main conversational endpoint. Sends `message` through the LangGraph agent
    and returns the bot's `reply`.

    The agent maintains multi-turn state per session — you can have a natural
    back-and-forth conversation (slot-filling, OTP flows, confirmations, etc.)
    without re-sending previous context.

    **Supported intents:**
    - Balance inquiry, account info, mini statement
    - Fund transfer (with favourites resolution + OTP)
    - Card block / unblock (with OTP)
    - Loan eligibility
    - Complaint logging
    - OTP verification (standalone)
    - Greetings / out-of-scope
    """
    user_text = body.message.strip()
    if not user_text:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    # Build the turn state from previous conversation state
    turn_state = fresh_state(user_text, prev=session.agent_state)
    turn_state["authenticated"] = True

    try:
        result = session.graph.invoke(turn_state)
    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent encountered an error: {e}")

    session.agent_state = result
    reply = result.get("response", "")

    logger.info(
        f"[converse] intent={result.get('current_intent') or result.get('confirm_intent', '?')!r} "
        f"phase={result.get('phase')} | '{user_text[:50]}' → '{reply[:60]}'"
    )

    return ConversationResponse(
        reply=reply,
        intent=result.get("current_intent") or result.get("confirm_intent"),
        slots=result.get("current_slots") or None,
        phase=result.get("phase"),
        intent_queue=result.get("intent_queue") or None,
        history=result.get("messages") or None,
        awaiting_queue_confirm=result.get("awaiting_queue_confirm") or False,
    )

# ─────────────────────────────────────────────────────────────────────────────
# Routes — Health
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"], summary="Health check")
async def health():
    """Returns server status and active session count."""
    return {
        "status": "ok",
        "active_sessions": len(sessions),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({"message": "Voice Banking Sahayak API. See /docs for usage."})

# ─────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
