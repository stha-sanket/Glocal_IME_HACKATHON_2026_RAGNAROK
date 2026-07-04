# Data Layer Integration Guide

Audience: whoever is building the **Data Layer** (the FastAPI service that does language detection, intent classification, tool orchestration, and speech synthesis). This document is the contract between that service and the **Application Layer** (this repo, `gibl-api`).

---

## 1. Where the Data Layer sits in the pipeline

```
Client (mobile app)
  │  records audio
  ▼
POST /voice/stt           (App Layer — Whisper, offline STT)
  │  { text }
  ▼
Client
  │  sends transcribed text
  ▼
POST /voice/converse       (App Layer)  ──────────────►  POST {DATA_LAYER_URL}   (Data Layer)
                                                              │
                                results come back        classify language + intent
                            ◄─────────────────────────────    │
  { text, audio }                                          needs a banking action?
  │                                                            │
  ▼                                                            ▼
Client plays audio                                    POST {APP_URL}/otp/send, /transfer/initiate, ...
                                                        (tool endpoints on App Layer, called back
                                                         by the Data Layer as many times as needed)
                                                              │
                                                          repeat classify → call tool → ...
                                                          until the user's goal is done
                                                              │
                                                          synthesize speech (Data Layer's own TTS)
                                                              │
                                                          return { text, audio } to App Layer
```

Two HTTP directions, two different auth schemes:

| Direction | Who calls whom | Auth |
|---|---|---|
| **Inbound** | App Layer → Data Layer | App Layer sends `X-Service-Key`; Data Layer should verify it |
| **Callback** | Data Layer → App Layer tool endpoints | Data Layer sends `X-Service-Key` + `clientId` in body |

Both directions currently share **one secret**: `DATA_LAYER_SERVICE_SECRET`. Whoever owns the Data Layer needs this value — get it from the App team out of band (don't commit it to a public repo).

---

## 2. Inbound: App Layer → Data Layer

The App Layer's `POST /voice/converse` route forwards the user's text to whatever URL is configured in `DATA_LAYER_URL` on the App Layer's `.env`. **Tell the App team the real URL once your service is deployed** so they can point `DATA_LAYER_URL` at it.

### Request the App Layer sends you

```
POST {DATA_LAYER_URL}
Content-Type: application/json
X-Service-Key: <shared secret>

{
  "text": "block my card",
  "clientId": "665f1a2b3c4d5e6f7a8b9c0d"
}
```

| Field | Type | Notes |
|---|---|---|
| `text` | string | The user's utterance, already transcribed to plain text (English, Nepali, or romanized Nepali). |
| `clientId` | string | The authenticated user's ID in the App Layer's database (Mongo `_id`). Use this on every tool callback so the App Layer knows which account to act on. |

### Response we expect back

```json
{
  "text": "Your Visa debit card ending 4082 is now blocked.",
  "audio": "<base64-encoded WAV>"
}
```

| Field | Type | Notes |
|---|---|---|
| `text` | string | Final natural-language reply, after the whole tool-calling loop is done. |
| `audio` | string | Base64-encoded audio of `text` spoken aloud. WAV, any sample rate/mono is fine — the placeholder the App Layer falls back to is 8kHz mono 16-bit PCM, so anything at least that quality is a safe target. |

### Error handling (what happens if you're slow or down)

- No timeout is currently enforced on the App Layer side, but please respond quickly — a voice UI feels broken past a couple seconds. A few hundred ms to ~5s round trip is the target.
- If your service is unreachable or returns a non-2xx status, the App Layer does **not** retry — it falls back to a generic "unable to reach the assistant" reply with silent placeholder audio and returns that to the client. So failures are visible to the user, not silently swallowed.
- There's no request ID / idempotency key on this call today. If you need one for logging/tracing, ask the App team to add it — cheap to do on our side.

---

## 3. Callback: Data Layer → App Layer tool endpoints

This is how you actually **do** things — check a balance, send an OTP, block a card, etc. Call these like a normal REST API.

### Auth

Every tool call must include:

```
X-Service-Key: <shared secret>
```

And the request body must include `clientId` (the same value the App Layer sent you in step 2) — the App Layer trusts whichever `clientId` you pass, since it already authenticated you via the secret. **Do not let the end user's raw input flow into `clientId`** — it always comes from what the App Layer told you, never something the user typed.

Base URL: whatever `APP_URL` you're given for the current environment (e.g. `http://localhost:3002` locally).

### 3.1 Tools available today

#### `POST /otp/send`

Sends a one-time password to the user's registered email and stores its hash (5 min TTL) for later verification.

Request:
```json
{ "clientId": "665f1a2b3c4d5e6f7a8b9c0d" }
```

Response `200`:
```json
{ "message": "OTP sent to registered mobile/email." }
```

Errors: `401` if `clientId` missing or no such user, `403` if a real user's own token doesn't match the given `clientId` (not applicable to your service calls — you're always trusted for the `clientId` you pass).

#### `POST /otp/verify`

Checks a user-supplied OTP against the hash stored by `/otp/send`.

Request:
```json
{ "clientId": "665f1a2b3c4d5e6f7a8b9c0d", "otp": "482913" }
```

Response `200`:
```json
{ "message": "OTP verified successfully.", "verified": true }
```

Response `400` (wrong/expired code):
```json
{ "error": "Invalid OTP.", "verified": false }
```

#### `GET /favourites/list?clientId=...`

Lists a user's saved favourite (beneficiary) accounts. **A transfer can only target one of these** — there's no way to send money to an arbitrary account number anymore, so if the user names someone who isn't already a favourite, tell them to add it first (or call `/favourites/create` yourself if they gave you a nickname + account number in the same turn).

Users can also add favourites directly from the mobile app's Accounts tab (outside any voice session), so **don't assume this list is empty** just because it's the user's first voice interaction — always call this before asking the user to re-add someone they may have already saved.

Response `200`:
```json
{ "favourites": [{ "id": "665f...", "nickname": "Sanket dai", "accountNumber": "0123456789" }] }
```

**How to resolve a recipient named in speech:** when the user's text names a person (e.g. "send 2000 to sanket dai"), call this endpoint with the current `clientId` and match the recipient phrase from the text against the returned `nickname` values — not the other way around (don't try to guess a favourite from account numbers or IDs the user never said). Match case-insensitively and tolerate minor phrasing differences (romanized spelling, honorifics like "dai"/"didi", extra words) since STT output and casual speech won't match a saved nickname character-for-character. If nothing matches with reasonable confidence, don't guess — ask the user to clarify or offer to add the name as a new favourite via `/favourites/create`. If more than one favourite matches ambiguously, ask which one the user means rather than picking one.

#### `POST /favourites/create`

Registers a new favourite account for the user.

Request:
```json
{ "clientId": "665f1a2b3c4d5e6f7a8b9c0d", "nickname": "Sanket dai", "accountNumber": "0123456789" }
```

Response `200`:
```json
{ "message": "Favourite account added.", "favourite": { "id": "665f...", "nickname": "Sanket dai", "accountNumber": "0123456789" } }
```

#### `POST /transfer/initiate`

Initiates a transfer **to a saved favourite account** — not a raw account number. Resolve the recipient's name to a `favouriteAccountId` via `/favourites/list` first (fuzzy-match the nickname the user said, e.g. "sanket dai" → `Sanket dai`).

Request:
```json
{ "clientId": "665f1a2b3c4d5e6f7a8b9c0d", "amount": 2000, "favouriteAccountId": "665f..." }
```

Response `200`:
```json
{ "message": "Transfer initiated.", "transactionId": "TXN_...", "toAccount": "0123456789", "nickname": "Sanket dai" }
```

Response `404` if `favouriteAccountId` doesn't exist or doesn't belong to this `clientId`:
```json
{ "error": "Favourite account not found. Add it as a favourite before transferring." }
```

Follow with `/otp/send` → `/otp/verify` → `/transfer/confirm` (see below) before telling the user the transfer succeeded.

### 3.2 Tools NOT yet callable by you (still user-JWT-only — pending App-side work)

These exist and work for the mobile client (which authenticates with its own user session), but the App team hasn't yet extended them to accept the `X-Service-Key` + `clientId` pattern. **Don't build against these until we confirm they're switched over** — ping the App team once you actually need one, it's a small change per route (same pattern as the OTP routes above).

| Route | Method | Body / Query | Success response | Notes |
|---|---|---|---|---|
| `/account/balance` | GET | — (uses session) | `{ balance, currency }` | |
| `/account/details` | GET | — (uses session) | `{ id, accountNumber, name, email, isCardBlocked }` | |
| `/account/statement` | GET | — (uses session) | `{ statements: [{ id, date, amount, description }] }` | Currently returns mock/hardcoded data. |
| `/transfer/confirm` | POST | `{ transactionId, otp }` | `{ message, transactionId }` | **Stub** — doesn't yet check the OTP against the real Redis store the way `/otp/verify` does. Treat as unreliable until the App team wires it up. |
| `/card/block` | POST | — (uses session) | `{ message }` | |
| `/card/unblock` | POST | — (uses session) | `{ message }` | |
| `/loan/eligibility` | GET | `?clientId=...` (query, not body) | `{ eligible, maxAmount }` | Already takes `clientId` and has **no auth at all** right now — usable as-is, but flagged for the App team to lock down before this ships. |
| `/complaint/create` | POST | `{ subject, description }` | `{ message, ticketId }` | Also currently open (no auth), and doesn't associate the ticket with a `clientId` yet — mock only. |

---

## 4. What we expect your classification to do

Based on what the client app currently supports (see `GlobalSmartVoice/src/utils/nlu.ts` for the reference intents/phrasing it was prototyped against), the intents worth recognizing are:

- **Balance check** — "what's my balance", "मौज्दात कति छ" → `GET /account/balance`
- **Fund transfer** — "send 2000 to Sanket dai" → `GET /favourites/list` to resolve "Sanket dai" to a `favouriteAccountId` (it may already exist — the user can add favourites from the app UI too, not just by voice; only prompt them to add it via `/favourites/create` if it's genuinely missing) → `POST /transfer/initiate` → OTP loop → `POST /transfer/confirm`
- **Mobile top-up / recharge** — "recharge 200 to 98XXXXXXXX" → (no dedicated route yet — flag to App team if needed)
- **Card block / unblock** — "block my card" → `POST /otp/send` → wait for user's spoken/typed OTP → `POST /otp/verify` → `POST /card/block`
- **Loan eligibility** — "am I eligible for a loan" → `GET /loan/eligibility`
- **Complaint** — "I want to file a complaint" → `POST /complaint/create`
- **FAQ-style** (interest rates, branch hours, nearest ATM) — no backing route exists; answer from static copy on your side for now.

Languages to support: English, Nepali (Devanagari script), and romanized Nepali (Nepali written in Latin letters, e.g. "pathau", "kati chha"). The reply text you return should be in the same language/register the user used.

Any action that touches money or account security (transfer, card block) should go through the `/otp/send` → `/otp/verify` loop before calling the actual action endpoint — don't skip straight to the sensitive tool call.

---

## 5. Checklist before going live

- [ ] App team has your real Data Layer URL and set it as `DATA_LAYER_URL`.
- [ ] Both sides have the same `DATA_LAYER_SERVICE_SECRET` value, out of band (not in git).
- [ ] Your `/process`-equivalent endpoint returns `{ text, audio }` matching the shape in §2.
- [ ] Every tool callback sends `X-Service-Key` and a `clientId` sourced from what the App Layer told you — never from raw user text.
- [ ] You've confirmed which of the §3.2 "pending" routes you actually need, so the App team can extend `requireServiceOrUser` to them before you depend on them.
- [ ] Your transfer flow calls `/favourites/list` before assuming a recipient needs to be added — favourites can be created from the app UI directly, not just through you.
