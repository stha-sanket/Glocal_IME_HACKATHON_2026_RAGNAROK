"""
Banking API Client for Voice Banking Sahayak
============================================
Handles authentication (register/login via session cookies + JWT)
and all protected banking endpoints.

Endpoints covered:
  GET  /account/balance
  GET  /account/details
  GET  /account/statement
  POST /card/block
  POST /card/unblock
  POST /complaint/create
  GET  /loan/eligibility
  POST /otp/send
  POST /otp/verify
  POST /transfer/initiate
  POST /transfer/confirm

Usage:
    from api_client import BankingAPIClient

    client = BankingAPIClient()
    client.login("test@example.com", "Test@1234")

    print(client.get_balance())
    print(client.initiate_transfer(recipient="Ram", amount=5000))
    print(client.confirm_transfer(transfer_id="txn_abc123"))
"""

import logging
import requests
from config import INTENTS  # reuse project config for intent validation

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
BASE_URL = "https://q4n8mbr4-3002.inc1.devtunnels.ms/api/v2"
DEFAULT_TIMEOUT = 10  # seconds

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Intent → API method mapping
# ─────────────────────────────────────────────
# Maps NLU intents (from config.INTENTS) to API client methods.
INTENT_TO_ACTION = {
    "balance_inquiry": "get_balance",
    "account_info":    "get_account_details",
    "mini_statement":  "get_statement",
    "card_block":      "block_card",
    "card_unblock":    "unblock_card",
    "complaint_log":   "create_complaint",
    "loan_inquiry":    "get_loan_eligibility",
    "otp_verification":"send_otp",
    "fund_transfer":   "initiate_transfer",
}


class APIError(Exception):
    """Raised when the API returns an unexpected error response."""
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"[{status_code}] {message}")


class BankingAPIClient:
    """
    Session-based client for the Voice Banking Sahayak backend API.

    Automatically:
    - Maintains session cookies (JWT token stored in `efc_token` cookie)
    - Retries login if session expires (401 on protected endpoint)
    - Maps NLU intents to API calls via `handle_intent()`
    """

    def __init__(self, base_url: str = BASE_URL, timeout: int = DEFAULT_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self._email: str | None = None
        self._password: str | None = None
        self.user_info: dict = {}
        self.user_id: str | None = None          # MongoDB _id — used as clientId
        self.is_authenticated: bool = False

    # ─────────────────────────────────────────
    # Auth
    # ─────────────────────────────────────────

    def register(self, name: str, email: str, password: str, account_number: str = "") -> dict:
        """
        Register a new user account.
        POST /auth/register  →  {"name", "email", "password", "accountNumber"}
        """
        logger.info(f"Registering user: {email}")
        payload = {"name": name, "email": email, "password": password}
        if account_number:
            payload["accountNumber"] = account_number
        resp = self.session.post(
            f"{self.base_url}/auth/register",
            json=payload,
            timeout=self.timeout,
        )
        self._raise_for_status(resp)
        data = resp.json()
        logger.info(f"Registration successful: {data}")
        return data

    def login(self, email: str, password: str) -> dict:
        """
        Login and persist the session (JWT cookie set automatically).
        POST /auth/login  →  {"email", "password"}
        Returns user info dict: {name, email, accountNumber}
        """
        logger.info(f"Logging in as: {email}")
        resp = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password},
            timeout=self.timeout,
        )
        self._raise_for_status(resp)
        data = resp.json()
        self.user_info = data.get("user", {})
        self.user_id = self.user_info.get("id")   # clientId for protected endpoints
        self._email = email
        self._password = password
        self.is_authenticated = True
        logger.info(f"Login successful. Account: {self.user_info.get('accountNumber')} | clientId: {self.user_id}")
        return self.user_info

    def authenticate_as_service(self, client_id: str, service_key: str) -> None:
        """
        Authenticate as the App Layer's trusted Data Layer service, acting on
        behalf of `client_id`, instead of logging in with a user's password.

        Only works against gibl-api routes wired for `requireServiceOrUser`
        (they trust `clientId` once `X-Service-Key` matches). Routes still on
        plain `requireAuth('user')` will 401 under this mode since there's no
        session cookie — call `login()` instead for those.
        """
        self.session.headers.update({"X-Service-Key": service_key})
        self.user_id = client_id
        self.is_authenticated = True
        logger.info(f"Authenticated as service for clientId: {client_id}")

    def logout(self):
        """Clear session cookies and reset auth state."""
        try:
            self.session.post(f"{self.base_url}/auth/logout", timeout=self.timeout)
        except Exception:
            pass
        self.session.cookies.clear()
        self.is_authenticated = False
        self.user_info = {}
        self.user_id = None
        logger.info("Logged out. Session cleared.")

    # ─────────────────────────────────────────
    # Protected Endpoints
    # ─────────────────────────────────────────

    def get_balance(self) -> dict:
        """
        GET /account/balance
        Returns: {"balance": 50000, "currency": "NPR"}
        Maps to intent: balance_inquiry
        """
        resp = self._get("/account/balance")
        return resp.json()

    def get_account_details(self) -> dict:
        """
        GET /account/details
        Returns: {"accountNumber", "name", "email", "isCardBlocked"}
        Maps to intent: account_info
        """
        resp = self._get("/account/details")
        return resp.json()

    def get_statement(self) -> dict:
        """
        GET /account/statement
        Returns: {"statements": [...transaction list...]}
        Maps to intent: mini_statement
        """
        resp = self._get("/account/statement")
        return resp.json()

    def block_card(self, otp: str = None) -> dict:
        """
        POST /card/block
        Payload: {"otp": str}  — OTP required by server
        Returns: {"message": "Card successfully blocked."}
        Maps to intent: card_block
        """
        payload = {}
        if otp:
            payload["otp"] = otp
        resp = self._post("/card/block", payload=payload)
        return resp.json()

    def unblock_card(self, otp: str = None) -> dict:
        """
        POST /card/unblock
        Payload: {"otp": str}  — OTP required by server
        Returns: {"message": "Card successfully unblocked."}
        Maps to intent: card_unblock
        """
        payload = {}
        if otp:
            payload["otp"] = otp
        resp = self._post("/card/unblock", payload=payload)
        return resp.json()

    def create_complaint(self, description: str, category: str = "general", subject: str = None) -> dict:
        """
        POST /complaint/create
        Payload: {"subject": str, "description": str}
        Maps to intent: complaint_log
        """
        subj = subject if subject else (f"{category.capitalize()} Issue" if category else "General Issue")
        resp = self._post("/complaint/create", payload={
            "subject": subj,
            "description": description,
        })
        return resp.json()

    def get_loan_eligibility(self, loan_type: str = "personal") -> dict:
        """
        GET /loan/eligibility
        Query params: clientId (user_id)
        Returns: {"eligible": bool, "maxAmount": number}
        Maps to intent: loan_inquiry
        """
        resp = self._get("/loan/eligibility")
        return resp.json()

    def send_otp(self, phone_number: str = None) -> dict:
        """
        POST /otp/send
        Payload: {"clientId": user_id}  — injected by _post
        Maps to intent: otp_verification
        """
        resp = self._post("/otp/send", payload={})
        return resp.json()

    def verify_otp(self, phone_number: str = None, otp: str = None) -> dict:
        """
        POST /otp/verify
        Payload: {"clientId": user_id, "otp": str}  — clientId injected by _post
        Returns: {"message": str, "verified": bool}
        """
        actual_otp = otp if otp is not None else phone_number
        resp = self._post("/otp/verify", payload={
            "otp": str(actual_otp),
        })
        return resp.json()

    def initiate_transfer(self, to_account: str, amount: int, note: str = "") -> dict:
        """
        POST /transfer/initiate
        Payload: {"accountNumber": str, "amount": int, "note"?: str}  — clientId injected by _post
        Maps to intent: fund_transfer
        Returns: {"message": str, "transactionId": str}
        """
        payload: dict = {
            "accountNumber": str(to_account),
            "amount": int(amount),
        }
        if note:
            payload["note"] = note
        resp = self._post("/transfer/initiate", payload=payload)
        return resp.json()

    def confirm_transfer(self, transaction_id: str, otp: str) -> dict:
        """
        POST /transfer/confirm
        Payload: {"transactionId": str, "otp": str}
        Called after OTP is verified from user.
        """
        resp = self._post("/transfer/confirm", payload={
            "transactionId": transaction_id,
            "otp": otp,
        })
        return resp.json()

    def get_favourites(self) -> dict:
        """
        GET /favourites/list  — clientId injected by _get as query param
        """
        resp = self._get("/favourites/list")
        return resp.json()

    def create_favourite(self, nickname: str, account_number: str) -> dict:
        """
        POST /favourites/create  — clientId injected by _post
        Payload: {"nickname": str, "accountNumber": str}
        """
        resp = self._post("/favourites/create", payload={
            "nickname": nickname,
            "accountNumber": str(account_number),
        })
        return resp.json()

    # ─────────────────────────────────────────
    # NLU Intent Handler
    # ─────────────────────────────────────────

    def handle_intent(self, intent: str, slots: dict = None) -> dict:
        """
        Dispatch an NLU intent to the appropriate API call.

        Args:
            intent: One of the intent strings from config.INTENTS
            slots:  Extracted entity slots (e.g. {"count": 5})

        Returns:
            API response dict, or {"error": "..."} if intent is not actionable.

        Example:
            client.handle_intent("balance_inquiry")
            client.handle_intent("card_block")
            client.handle_intent("mini_statement", slots={"count": 5})
        """
        if not self.is_authenticated:
            return {"error": "Not authenticated. Call login() first."}

        if intent not in INTENT_TO_ACTION:
            logger.info(f"Intent '{intent}' has no direct API action.")
            return {"info": f"Intent '{intent}' handled by dialogue manager, not API."}

        method_name = INTENT_TO_ACTION[intent]
        method = getattr(self, method_name)

        logger.info(f"Dispatching intent '{intent}' → {method_name}()")
        try:
            return method()
        except APIError as e:
            logger.error(f"API error for intent '{intent}': {e}")
            return {"error": str(e)}

    # ─────────────────────────────────────────
    # Internal Helpers
    # ─────────────────────────────────────────

    def _get(self, endpoint: str) -> requests.Response:
        """
        Internal GET helper.
        When authenticated as service (X-Service-Key mode), clientId is appended
        as a query parameter so requireServiceOrUser middleware can identify the user.
        """
        # Inject clientId for service-key calls (middleware reads from query string on GETs)
        is_service = bool(self.session.headers.get("X-Service-Key"))
        if is_service and self.user_id:
            sep = "&" if "?" in endpoint else "?"
            url = f"{self.base_url}{endpoint}{sep}clientId={self.user_id}"
        else:
            url = f"{self.base_url}{endpoint}"

        resp = self.session.get(url, timeout=self.timeout)
        if resp.status_code == 401 and not is_service:
            self._relogin()
            resp = self.session.get(url, timeout=self.timeout)
        self._raise_for_status(resp)
        return resp

    def _post(self, endpoint: str, payload: dict) -> requests.Response:
        """
        Internal POST helper.
        When authenticated as service (X-Service-Key mode), clientId is injected
        into the request body so requireServiceOrUser middleware can identify the user.
        """
        is_service = bool(self.session.headers.get("X-Service-Key"))
        if is_service and self.user_id:
            payload = {"clientId": self.user_id, **payload}

        url = f"{self.base_url}{endpoint}"
        resp = self.session.post(url, json=payload, timeout=self.timeout)
        if resp.status_code == 401 and not is_service:
            self._relogin()
            resp = self.session.post(url, json=payload, timeout=self.timeout)
        self._raise_for_status(resp)
        return resp

    def _relogin(self):
        """Auto re-authenticate if session expired."""
        if self._email and self._password:
            logger.warning("Session expired. Re-authenticating...")
            self.login(self._email, self._password)
        else:
            raise APIError(401, "Session expired and no credentials stored for re-login.")

    @staticmethod
    def _raise_for_status(resp: requests.Response):
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", resp.text)
            except Exception:
                msg = resp.text
            raise APIError(resp.status_code, msg)


# ─────────────────────────────────────────────
# Quick smoke test (run directly)
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import json

    client = BankingAPIClient()

    # ── Auth ──
    client.login("test@example.com", "Test@1234")
    print(f"\n👤 User: {client.user_info}")

    # ── Direct API calls ──
    print(f"\n💰 Balance:  {client.get_balance()}")
    print(f"📋 Details:  {client.get_account_details()}")
    stmt = client.get_statement()
    txns = stmt.get("statements", [])
    print(f"🧾 Statement: {len(txns)} transaction(s)")
    for t in txns[:3]:
        print(f"   {t}")

    # ── Intent-based dispatch (NLU integration) ──
    print("\n🤖 Intent Dispatch:")
    for intent in ["balance_inquiry", "account_info", "mini_statement", "card_block", "card_unblock", "fund_transfer"]:
        result = client.handle_intent(intent)
        print(f"  [{intent}] → {result}")
