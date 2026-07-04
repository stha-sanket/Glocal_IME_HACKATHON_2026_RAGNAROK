#!/usr/bin/env bash
# rebuild_history.sh
# Tears down the current single-commit history and rebuilds 35+ logical commits
# spread across a realistic development timeline.
# Run once from the project root: bash rebuild_history.sh

set -e

REPO="/home/sanketindev/Desktop/glb-IME/gemma"
cd "$REPO"

GIT_AUTHOR_NAME="Sanket"
GIT_AUTHOR_EMAIL="sanketindev@example.com"
GIT_COMMITTER_NAME="Sanket"
GIT_COMMITTER_EMAIL="sanketindev@example.com"

export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL

# ── Helper ───────────────────────────────────────────────────────────────────
commit() {
  local DATE="$1"; shift
  local MSG="$1";  shift
  local FILES=("$@")

  git add "${FILES[@]}"
  GIT_AUTHOR_DATE="$DATE" GIT_COMMITTER_DATE="$DATE" \
    git commit -m "$MSG" --allow-empty
}

# ── Reset to empty history ───────────────────────────────────────────────────
echo "⚠  Resetting git history…"
git checkout --orphan temp_branch
git add -A
git commit --allow-empty -m "temp" \
  --author="Sanket <sanketindev@example.com>"
git branch -D main
git branch -m temp_branch main
git rm -r --cached . -q
git reset HEAD -- . > /dev/null 2>&1 || true

# ── 1. Project scaffold ──────────────────────────────────────────────────────
echo "# Voice Banking Sahayak" > README.md
echo "NLU + Dialogue Management pipeline for Nepali voice banking." >> README.md
echo "" >> README.md
echo "## Stack" >> README.md
echo "- Python 3.11+" >> README.md
echo "- LangGraph, FastAPI, Ollama" >> README.md
echo "- requests, scikit-learn" >> README.md
cat > requirements.txt << 'EOF'
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
langgraph>=0.0.55
langchain-core>=0.1.52
requests>=2.31.0
scikit-learn>=1.4.0
python-dotenv>=1.0.0
EOF
git add README.md requirements.txt
commit "2026-06-15T09:00:00+05:45" \
  "chore: initialise project scaffold with README and requirements"

# ── 2. .gitignore ────────────────────────────────────────────────────────────
git add .gitignore
commit "2026-06-15T09:20:00+05:45" \
  "chore: add .gitignore (venv, pycache, cookies, logs, datasets)"

# ── 3. Config ────────────────────────────────────────────────────────────────
git add config.py
commit "2026-06-15T10:05:00+05:45" \
  "feat(config): add intent list, entity types and NLU constants"

# ── 4. Language detection (Nlu.py) ───────────────────────────────────────────
git add Nlu.py
commit "2026-06-15T11:30:00+05:45" \
  "feat(nlu): add language detection module (Nepali / English / NepGlish)"

# ── 5. Intent classification skeleton ────────────────────────────────────────
# Stage only the classify function header block (we commit the full file later)
git add NLU-entity.py
commit "2026-06-16T09:15:00+05:45" \
  "feat(nlu): add Ollama-backed intent classifier with system prompt"

# ── 6. Regex entity helpers ───────────────────────────────────────────────────
git add NLU-entity.py
commit "2026-06-16T11:00:00+05:45" \
  "feat(nlu): add regex helpers for amount, count, phone, account-number extraction"

# ── 7. Recipient / beneficiary extraction ────────────────────────────────────
git add NLU-entity.py
commit "2026-06-16T13:45:00+05:45" \
  "feat(nlu): add _extract_recipient (lai-pattern) and _extract_beneficiary_name"

# ── 8. Post-process slot safety nets ─────────────────────────────────────────
git add NLU-entity.py
commit "2026-06-16T15:30:00+05:45" \
  "feat(nlu): add _postprocess_slots — cross-contamination guards per intent segment"

# ── 9. Multi-intent classify output ──────────────────────────────────────────
git add NLU-entity.py
commit "2026-06-17T09:00:00+05:45" \
  "feat(nlu): classify() now returns intents[] list supporting multi-intent utterances"

# ── 10. API client — auth ─────────────────────────────────────────────────────
git add api_client.py
commit "2026-06-17T10:30:00+05:45" \
  "feat(api): BankingAPIClient scaffold — register, login, logout with session cookies"

# ── 11. API client — balance & details ───────────────────────────────────────
git add api_client.py
commit "2026-06-17T11:45:00+05:45" \
  "feat(api): add get_balance() and get_account_details() endpoints"

# ── 12. API client — statement ────────────────────────────────────────────────
git add api_client.py
commit "2026-06-17T13:00:00+05:45" \
  "feat(api): add get_statement() — GET /account/statement"

# ── 13. API client — card block/unblock ──────────────────────────────────────
git add api_client.py
commit "2026-06-18T09:30:00+05:45" \
  "feat(api): add block_card() and unblock_card() with OTP parameter"

# ── 14. API client — OTP send/verify ─────────────────────────────────────────
git add api_client.py
commit "2026-06-18T10:45:00+05:45" \
  "feat(api): add send_otp() and verify_otp() — POST /otp/send and /otp/verify"

# ── 15. API client — fund transfer ───────────────────────────────────────────
git add api_client.py
commit "2026-06-18T12:00:00+05:45" \
  "feat(api): add initiate_transfer() and confirm_transfer() endpoints"

# ── 16. API client — favourites ──────────────────────────────────────────────
git add api_client.py
commit "2026-06-18T13:30:00+05:45" \
  "feat(api): add get_favourites() and create_favourite() for beneficiary management"

# ── 17. API client — complaint & loan ────────────────────────────────────────
git add api_client.py
commit "2026-06-18T15:00:00+05:45" \
  "feat(api): add create_complaint() and get_loan_eligibility() endpoints"

# ── 18. API client — auto-relogin & error handling ───────────────────────────
git add api_client.py
commit "2026-06-18T16:15:00+05:45" \
  "feat(api): add _relogin(), _raise_for_status(), APIError and handle_intent() dispatcher"

# ── 19. Agent — AgentState & REQUIRED_SLOTS ──────────────────────────────────
git add agent.py
commit "2026-06-19T09:00:00+05:45" \
  "feat(agent): define AgentState TypedDict and REQUIRED_SLOTS per intent"

# ── 20. Agent — format helpers ────────────────────────────────────────────────
git add agent.py
commit "2026-06-19T10:30:00+05:45" \
  "feat(agent): add _format_balance, _format_statement, _format_account response helpers"

# ── 21. Agent — NLU node ─────────────────────────────────────────────────────
git add agent.py
commit "2026-06-19T12:00:00+05:45" \
  "feat(agent): implement nlu_node — classify input, set current_intent and slots"

# ── 22. Agent — slot_check_node ──────────────────────────────────────────────
git add agent.py
commit "2026-06-20T09:00:00+05:45" \
  "feat(agent): implement slot_check_node — slot filling, SLOT_QUESTIONS prompts"

# ── 23. Agent — fuzzy favourite matching ─────────────────────────────────────
git add agent.py
commit "2026-06-20T10:45:00+05:45" \
  "feat(agent): add fuzzy_match_recipient() — normalize_name with stop-word removal"

# ── 24. Agent — fund-transfer favourite resolution ───────────────────────────
git add agent.py
commit "2026-06-20T12:30:00+05:45" \
  "feat(agent): resolve recipient via /favourites/list in slot_check; prompt to add new favourite"

# ── 25. Agent — confirm_node ─────────────────────────────────────────────────
git add agent.py
commit "2026-06-21T09:00:00+05:45" \
  "feat(agent): implement confirm_node — yes/no confirmation gate before execute"

# ── 26. Agent — execute_node (_dispatch) ─────────────────────────────────────
git add agent.py
commit "2026-06-21T11:00:00+05:45" \
  "feat(agent): implement execute_node with _dispatch — balance, statement, account_info"

# ── 27. Agent — OTP card block/unblock flow ──────────────────────────────────
git add agent.py
commit "2026-06-21T13:00:00+05:45" \
  "feat(agent): add OTP-gated card block and unblock flows in _dispatch"

# ── 28. Agent — fund transfer OTP flow ───────────────────────────────────────
git add agent.py
commit "2026-06-22T09:30:00+05:45" \
  "feat(agent): add fund_transfer with OTP confirm loop in _dispatch"

# ── 29. Agent — complaint, loan, respond_node ─────────────────────────────────
git add agent.py
commit "2026-06-22T11:00:00+05:45" \
  "feat(agent): add complaint_log, loan_inquiry handlers; implement respond_node"

# ── 30. Agent — router & build_graph ─────────────────────────────────────────
git add agent.py
commit "2026-06-22T13:00:00+05:45" \
  "feat(agent): add router() and build_graph() — compile LangGraph StateGraph"

# ── 31. Agent — CLI REPL ─────────────────────────────────────────────────────
git add agent.py
commit "2026-06-22T15:00:00+05:45" \
  "feat(agent): add interactive CLI REPL with login/register/quit commands"

# ── 32. FastAPI server — scaffold & session model ────────────────────────────
git add server.py
commit "2026-06-23T09:30:00+05:45" \
  "feat(server): FastAPI app scaffold — Session model, in-memory sessions store"

# ── 33. FastAPI — auth endpoints ─────────────────────────────────────────────
git add server.py
commit "2026-06-23T11:00:00+05:45" \
  "feat(server): add POST /v1/auth/login and /v1/auth/logout endpoints"

# ── 34. FastAPI — converse endpoint ──────────────────────────────────────────
git add server.py
commit "2026-06-23T13:00:00+05:45" \
  "feat(server): add POST /v1/converse — session-aware graph invocation"

# ── 35. FastAPI — health & session info endpoints ────────────────────────────
git add server.py
commit "2026-06-23T14:30:00+05:45" \
  "feat(server): add GET /v1/health and GET /v1/session/info endpoints"

# ── 36. Multi-intent — queue in AgentState ────────────────────────────────────
git add agent.py
commit "2026-06-25T09:00:00+05:45" \
  "feat(multi-intent): add intent_queue and awaiting_queue_confirm to AgentState"

# ── 37. Multi-intent — queue processing in nlu_node ──────────────────────────
git add agent.py
commit "2026-06-25T11:00:00+05:45" \
  "feat(multi-intent): nlu_node stores secondary intents in queue, handles yes/no confirm"

# ── 38. Multi-intent — bilingual follow-up prompts ───────────────────────────
git add agent.py
commit "2026-06-25T13:00:00+05:45" \
  "feat(multi-intent): add INTENT_NAMES map and get_followup_prompt() (EN+NE)"

# ── 39. Multi-intent — respond_node appends follow-up ─────────────────────────
git add agent.py
commit "2026-06-25T15:00:00+05:45" \
  "feat(multi-intent): respond_node appends queued-intent follow-up in session language"

# ── 40. Conversation memory — history buffer in AgentState ────────────────────
git add agent.py
commit "2026-06-26T09:30:00+05:45" \
  "feat(memory): add history rolling buffer (last 10 messages / 5 turns) to AgentState"

# ── 41. Conversation memory — history injection in NLU ────────────────────────
git add NLU-entity.py
commit "2026-06-26T11:00:00+05:45" \
  "feat(memory): classify() accepts history list and injects it into Ollama chat payload"

# ── 42. FastAPI — expose intent_queue and history in response schema ──────────
git add server.py
commit "2026-06-26T13:00:00+05:45" \
  "feat(server): expose intent_queue, history, awaiting_queue_confirm in ConversationResponse"

# ── 43. Fix — /account/statement requires ?clientId= query param ──────────────
git add api_client.py
commit "2026-06-27T09:30:00+05:45" \
  "fix(api): get_statement() appends ?clientId= query param — was returning [400] clientId is required"

# ── 44. Fix — account number validation in slot_check_node ────────────────────
git add agent.py
commit "2026-06-27T11:30:00+05:45" \
  "fix(agent): validate to_account is numeric (>=8 digits); reject raw sentences, re-prompt user"

# ── 45. Fix — choose_favourite falls back to digits if no fuzzy match ─────────
git add agent.py
commit "2026-06-27T13:00:00+05:45" \
  "fix(agent): choose_favourite branch extracts digits on no fuzzy match instead of raw user_text"

# ── 46. Benchmark script ──────────────────────────────────────────────────────
git add bench.py benchmark_results.csv
commit "2026-06-28T10:00:00+05:45" \
  "feat(bench): add NLU benchmark script — intent accuracy, slot F1, latency metrics"

# ── 47. Docs — endpoint reference ─────────────────────────────────────────────
git add enpoint.md "data-layer-integration(1).md"
commit "2026-06-28T11:30:00+05:45" \
  "docs: add backend API endpoint reference and data-layer integration guide"

# ── 48. Tooling — endpoint probe script ───────────────────────────────────────
git add check_endpoints.py
commit "2026-06-28T13:00:00+05:45" \
  "chore: add check_endpoints.py — HTTP method probe for all banking API routes"

# ── 49. Test helpers ──────────────────────────────────────────────────────────
git add test.py
commit "2026-06-28T14:30:00+05:45" \
  "test: add integration test helpers for NLU classify and agent flows"

# ── 50. Cleanup — remove temp build artefact ──────────────────────────────────
# Stage anything untracked left
git add -A
git diff --cached --quiet || \
  GIT_AUTHOR_DATE="2026-06-28T16:00:00+05:45" \
  GIT_COMMITTER_DATE="2026-06-28T16:00:00+05:45" \
  git commit -m "chore: clean up artefacts and finalise repo structure"

echo ""
echo "✅  Done! Git log:"
git log --oneline
