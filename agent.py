"""
Voice Banking Sahayak — Agentic Dialogue System
================================================
Uses LangGraph for stateful, multi-turn banking conversations.

Architecture:
  user_input → [nlu_node] → [slot_check_node] → [confirm_node] → [execute_node] → [respond_node]
                                  ↑_______________↓ (slot filling loop)

Features:
  - Calls NLU-entity.py's classify() directly (no duplication)
  - Logs every NLU JSON output to nlu_log.txt
  - Confirmation gate for: balance_inquiry, card_block, card_unblock,
    fund_transfer (transfer/confirm step)
  - Missing slot tracking + follow-up questions for fund_transfer, complaint,
    otp_verification, loan_inquiry
  - Graceful API failure degradation with friendly Nepali-English messages
  - Session-based BankingAPIClient (auto re-auth)

Run:
    source venv/bin/activate
    python agent.py
"""

import json
import re
import sys
import datetime
from pathlib import Path
from typing import Annotated, TypedDict, Literal

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# ── Local imports (same package) ─────────────────────────────────────────────
from api_client import BankingAPIClient, APIError
from config import INTENTS, ENTITY_TYPES

# ── Import classify from NLU-entity.py (hyphen-safe dynamic import) ──────────
import importlib.util as _ilu, os as _os
_nlu_path = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "NLU-entity.py")
_spec = _ilu.spec_from_file_location("nlu_entity", _nlu_path)
_nlu_mod = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_nlu_mod)
classify = _nlu_mod.classify


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
NLU_LOG_FILE = Path(__file__).parent / "nlu_log.txt"

# Intents that need a user confirmation before API call
CONFIRMATION_INTENTS = {
    "balance_inquiry",
    "card_block",
    "card_unblock",
    "fund_transfer",   # also needs confirm_transfer after initiate
}

# Required slots per intent (agent will ask for missing ones)
# fund_transfer: recipient = nickname/name of recipient, amount = NPR amount
REQUIRED_SLOTS: dict[str, list[str]] = {
    "fund_transfer":    ["recipient", "amount"],
    "complaint_log":    ["description"],
    "otp_verification": ["phone_number"],
    "loan_inquiry":     ["loan_type"],
    "card_block":       [],
    "card_unblock":     [],
    "balance_inquiry":  [],
    "mini_statement":   [],
    "account_info":     [],
    "greeting_farewell":[],
    "out_of_scope":     [],
}

# Human-friendly slot questions — bilingual
SLOT_QUESTIONS = {
    "recipient": {
        "english": "Who would you like to transfer money to? (e.g. Sunway ko bhai)",
        "nepali":  "Kasai lai transfer garne? (e.g. Sunway ko bhai)",
    },
    "to_account": {
        "english": "What is the recipient's account number? (e.g. 13273039260361)",
        "nepali":  "Paisa pathaunay account number ke ho? (e.g. 13273039260361)",
    },
    "amount": {
        "english": "How much would you like to transfer? (NPR, e.g. 5000)",
        "nepali":  "Kati paisa transfer garne? (NPR ma btaunu, e.g. 5000)",
    },
    "description": {
        "english": "Please briefly describe your complaint.",
        "nepali":  "Complaint ko bare ma brief ma describe garnu hos.",
    },
    "phone_number": {
        "english": "What is your phone number? (e.g. 9800000000)",
        "nepali":  "Tapai ko phone number ke ho? (e.g. 9800000000)",
    },
    "loan_type": {
        "english": "What type of loan? (personal / home / vehicle / education / business / agricultural)",
        "nepali":  "Kun type ko loan? (personal / home / vehicle / education / business / agricultural)",
    },
    "otp": {
        "english": "Please enter the OTP sent to your registered phone.",
        "nepali":  "Phone ma aaeko OTP code enter garnu hos.",
    },
}

# Confirmation prompts — bilingual
CONFIRM_PROMPTS = {
    "balance_inquiry": {
        "english": "Do you want to check your current balance? (yes/no)",
        "nepali":  "Tapai ko current balance check garne? (yes/no)",
    },
    "card_block": {
        "english": "Are you sure you want to block your card? This can be reversed by unblocking. (yes/no)",
        "nepali":  "Tapai ko card block garne? Yo action reverse garna sakixa (unblock garera). Continue? (yes/no)",
    },
    "card_unblock": {
        "english": "Do you want to unblock your card? (yes/no)",
        "nepali":  "Tapai ko blocked card unblock garne? (yes/no)",
    },
    "fund_transfer": {
        "english": "Transfer NPR {amount} to {recipient_nickname}? (yes/no)",
        "nepali":  "NPR {amount} {recipient_nickname} lai transfer garne? (yes/no)",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Graph State
# ─────────────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: list[dict]
    user_text: str
    detected_language: str          # "english", "nepali", "nepglish"
    nlu_result: dict
    current_intent: str
    current_slots: dict
    confidence: float
    missing_slots: list[str]
    next_slot_to_ask: str | None
    awaiting_confirmation: bool
    confirm_intent: str | None
    confirm_slots: dict
    pending_transfer_id: str | None
    pending_card_action: str | None  # "block" or "unblock" — set when awaiting OTP for card ops
    awaiting_otp: bool
    response: str
    authenticated: bool
    intent_queue: list[dict]
    awaiting_queue_confirm: bool
    phase: Literal["nlu", "slot_fill", "confirm", "execute", "respond", "done"]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _log_nlu(user_text: str, nlu_result: dict):
    """Append NLU JSON output to nlu_log.txt."""
    with open(NLU_LOG_FILE, "a", encoding="utf-8") as f:
        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "user_text": user_text,
            "nlu_result": nlu_result,
        }
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _friendly_error(intent: str, error: str, lang: str = "nepali") -> str:
    if lang == "english":
        return (
            f"Sorry, the '{intent}' service is currently unavailable.\n"
            f"Please contact your branch or try again later.\n"
            f"(Technical: {error})"
        )
    return (
        f"Maafi garnu hola, '{intent}' ko lagi ahile service available chaina.\n"
        f"Kripaya branch ma contact garnu hos athawa pachhi try garnu hos.\n"
        f"(Technical: {error})"
    )


def _format_balance(data: dict, lang: str = "nepali") -> str:
    bal = data.get("balance", "N/A")
    cur = data.get("currency", "NPR")
    if not isinstance(bal, (int, float)):
        return f"Balance: {bal} {cur}"
    return (f"Your current balance: {cur} {bal:,}" if lang == "english"
            else f"Tapai ko mohat balance: {cur} {bal:,}")


def _format_statement(data: dict, lang: str = "nepali") -> str:
    stmts = data.get("statements", [])
    if not stmts:
        return ("No recent transactions found." if lang == "english"
                else "Kono recent transactions felauna sakiena।")
    header = "Your recent transactions:" if lang == "english" else "Tapai ko recent transactions:"
    lines = [header]
    for t in stmts:
        amt = t.get("amount", 0)
        sign = "+" if amt >= 0 else ""
        lines.append(f"  [{t.get('date','')[:10]}] {sign}{amt} NPR — {t.get('description','')}")
    return "\n".join(lines)


def _format_account(data: dict, lang: str = "nepali") -> str:
    blocked = 'Yes ⚠️' if data.get('isCardBlocked') else 'No ✅'
    return (
        f"Account Number : {data.get('accountNumber', 'N/A')}\n"
        f"Name           : {data.get('name', 'N/A')}\n"
        f"Email          : {data.get('email', 'N/A')}\n"
        f"Card Blocked   : {blocked}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# LangGraph Nodes
# ─────────────────────────────────────────────────────────────────────────────

INTENT_NAMES = {
    "balance_inquiry": {"en": "check your balance", "ne": "balance check garne"},
    "account_info": {"en": "view your account details", "ne": "account details herne"},
    "mini_statement": {"en": "view your mini statement", "ne": "mini statement herne"},
    "card_block": {"en": "block your card", "ne": "card block garne"},
    "card_unblock": {"en": "unblock your card", "ne": "card unblock garne"},
    "complaint_log": {"en": "register a complaint", "ne": "complaint register garne"},
    "loan_inquiry": {"en": "check your loan eligibility", "ne": "loan eligibility check garne"},
    "fund_transfer": {"en": "transfer funds", "ne": "fund transfer garne"},
    "otp_verification": {"en": "verify OTP", "ne": "OTP verify garne"},
}

def get_followup_prompt(intent: str, lang: str = "nepali") -> str:
    en = (lang == "english")
    names = INTENT_NAMES.get(intent)
    if not names:
        return (f"I noticed you also wanted to proceed with {intent}. Shall we do that? (yes/no)" if en
                else f"Maile tapai ko {intent} ko request pani dekhe. Tesko lagi agadi badhne? (yes/no)")
    
    desc_en = names["en"]
    desc_ne = names["ne"]
    return (f"I noticed you also wanted to {desc_en}. Would you like to proceed with that? (yes/no)" if en
            else f"Maile tapai ko {desc_ne} ko request pani dekhe. Tesko lagi agadi badhne? (yes/no)")


def nlu_node(state: AgentState) -> AgentState:
    """
    Run NLU on user text. If awaiting confirmation/slot-fill/OTP, short-circuit.
    Always logs NLU JSON to nlu_log.txt.
    """
    user_text = state["user_text"].strip()

    # Mid-confirmation: skip NLU
    if state.get("awaiting_confirmation"):
        messages = list(state.get("messages", []))
        messages.append({"role": "user", "content": user_text})
        messages = messages[-10:]
        return {**state, "messages": messages, "phase": "confirm"}

    # Mid-slot-filling (including OTP entry): raw text IS the slot value
    if state.get("next_slot_to_ask"):
        messages = list(state.get("messages", []))
        messages.append({"role": "user", "content": user_text})
        messages = messages[-10:]
        return {**state, "messages": messages, "phase": "slot_fill"}

    # Mid-queue-confirmation
    if state.get("awaiting_queue_confirm"):
        lang = state.get("detected_language", "nepali")
        en = (lang == "english")
        yes_words = {"yes", "y", "ha", "haa", "ho", "ok", "okay", "confirm", "gara", "gardeu", "proceed"}
        no_words  = {"no", "n", "hoina", "nai", "cancel", "band", "ngarnu", "stop", "chaina"}
        
        user_lower = user_text.lower().strip()
        user_words = set(re.sub(r'[^a-zA-Z0-9\s]', ' ', user_lower).split())
        
        if any(w in user_words for w in yes_words) or user_lower in yes_words:
            queue = state.get("intent_queue", [])
            if queue:
                next_item = queue[0]
                remaining_queue = queue[1:]
                
                messages = list(state.get("messages", []))
                messages.append({"role": "user", "content": user_text})
                messages = messages[-10:]
                
                return {
                    **state,
                    "messages": messages,
                    "intent_queue": remaining_queue,
                    "current_intent": next_item["intent"],
                    "current_slots": next_item.get("extracted_slots", {}),
                    "confidence": next_item.get("confidence", 0.0),
                    "awaiting_queue_confirm": False,
                    "phase": "slot_fill",
                }
            else:
                return {
                    **state,
                    "awaiting_queue_confirm": False,
                    "phase": "nlu",
                }
        elif any(w in user_words for w in no_words) or user_lower in no_words:
            cancel_msg = ("Alright, let know if you need anything else." if en
                          else "Thik cha, arko kei help chahiyo bhane bhannu hos।")
            
            messages = list(state.get("messages", []))
            messages.append({"role": "user", "content": user_text})
            messages = messages[-10:]
            
            return {
                **state,
                "messages": messages,
                "intent_queue": [],
                "awaiting_queue_confirm": False,
                "response": cancel_msg,
                "phase": "respond",
            }

    # Run NLU
    history = state.get("messages", [])
    result = classify(user_text, history=history)
    _log_nlu(user_text, result)

    if "error" in result:
        return {
            **state,
            "nlu_result": result,
            "response": f"NLU error: {result['error']}",
            "phase": "respond",
        }

    intents = result.get("intents", [])
    if not intents:
        if state.get("awaiting_queue_confirm"):
            lang = state.get("detected_language", "nepali")
            en = (lang == "english")
            unclear = ("Please reply with 'yes' or 'no' to proceed, or ask a new question." if en
                       else "Kripaya aghi badhna 'yes' athawa 'no' vannu hos, athawa naya request garnu hos।")
            return {
                **state,
                "response": unclear,
                "phase": "respond",
            }
        return {
            **state,
            "nlu_result": result,
            "response": "Maafi garnu hola, tapai le ke bhannu bhayo bujhina. Pheri bhannu hos.",
            "phase": "respond",
        }

    # Take the highest-confidence intent
    primary = max(intents, key=lambda x: x.get("confidence", 0))

    # Low-confidence fallback — ask for clarification rather than guessing
    if primary.get("confidence", 0) < 0.45:
        if state.get("awaiting_queue_confirm"):
            lang = state.get("detected_language", "nepali")
            en = (lang == "english")
            unclear = ("Please reply with 'yes' or 'no' to proceed, or ask a new question." if en
                       else "Kripaya aghi badhna 'yes' athawa 'no' vannu hos, athawa naya request garnu hos।")
            return {
                **state,
                "response": unclear,
                "phase": "respond",
            }
        return {
            **state,
            "nlu_result": result,
            "response": "Tapai le ke bhannu bhayo ramro sanga bujhina. Kripaya banking request clear sanga bhannu hos.",
            "phase": "respond",
        }

    messages = list(state.get("messages", []))
    messages.append({"role": "user", "content": user_text})
    messages = messages[-10:]

    lang = result.get("language", "nepali")
    
    # Process multiple intents preserving original order
    primary_item = intents[0]
    queued_items = intents[1:]

    return {
        **state,
        "messages":          messages,
        "nlu_result":        result,
        "detected_language": lang,
        "current_intent":    primary_item["intent"],
        "current_slots":     primary_item.get("extracted_slots", {}),
        "confidence":        primary_item.get("confidence", 0.0),
        "intent_queue":      queued_items,
        "awaiting_queue_confirm": False,
        "phase":             "slot_fill",
    }


def normalize_name(name: str) -> set:
    if not name:
        return set()
    name = re.sub(r'[^a-zA-Z0-9\s]', ' ', name.lower())
    words = name.split()
    stop_words = {"dai", "didi", "bhai", "bahini", "buwa", "aama", "kaka", "kaki", "mama", "maiju", "uncle", "aunty", "ji", "ko", "lai", "laai", "to"}
    return {w for w in words if w not in stop_words}

def fuzzy_match_recipient(recipient: str, favourites: list) -> list:
    rec_words = normalize_name(recipient)
    if not rec_words:
        return []
    matches = []
    # Try exact match first
    for fav in favourites:
        nick = fav.get("nickname", "").lower().strip()
        if nick == recipient.lower().strip():
            return [fav]
    
    # Try subset/superset or overlap match
    for fav in favourites:
        fav_words = normalize_name(fav.get("nickname", ""))
        if not fav_words:
            continue
        if rec_words.issubset(fav_words) or fav_words.issubset(rec_words):
            matches.append(fav)
        elif len(rec_words.intersection(fav_words)) > 0:
            matches.append(fav)
    return matches

def slot_check_node(state: AgentState, client: BankingAPIClient) -> AgentState:
    intent = state.get("current_intent", "")
    slots = dict(state.get("current_slots", {}))
    user_text = state["user_text"].strip()
    lang = state.get("detected_language", "nepali")
    en = (lang == "english")
    key = "english" if en else "nepali"

    asked = state.get("next_slot_to_ask")

    if asked == "new_favourite_account":
        recipient_name = slots.get("recipient", "Recipient")
        digits = re.sub(r"\D", "", user_text)
        if digits and len(digits) >= 8:
            try:
                res = client.create_favourite(nickname=recipient_name, account_number=digits)
                fav_data = res.get("favourite", {})
                slots["to_account"] = fav_data.get("accountNumber", digits)
                slots["recipient_nickname"] = fav_data.get("nickname", recipient_name)
                state = {**state, "current_slots": slots, "next_slot_to_ask": None}
            except Exception:
                slots["to_account"] = digits
                slots["recipient_nickname"] = recipient_name
                state = {**state, "current_slots": slots, "next_slot_to_ask": None}
        else:
            question = (
                f"That does not look like a valid account number. Please provide a valid numeric account number for '{recipient_name}':" if en else
                f"Yo account number valid jasto lagena। Kripaya '{recipient_name}' ko lagi numeric account number btaunu hos:"
            )
            return {
                **state,
                "current_slots": slots,
                "missing_slots": ["to_account"],
                "next_slot_to_ask": "new_favourite_account",
                "response": question,
                "phase": "respond",
            }
    
    elif asked == "choose_favourite":
        try:
            favs_res = client.get_favourites()
            favourites = favs_res.get("favourites", [])
            matches = fuzzy_match_recipient(user_text, favourites)
            if matches:
                chosen = matches[0]
                slots["to_account"] = chosen.get("accountNumber")
                slots["recipient_nickname"] = chosen.get("nickname")
                state = {**state, "current_slots": slots, "next_slot_to_ask": None}
            else:
                digits = re.sub(r"\D", "", user_text)
                if digits and len(digits) >= 8:
                    slots["to_account"] = digits
                    slots["recipient_nickname"] = slots.get("recipient", "Recipient")
                    state = {**state, "current_slots": slots, "next_slot_to_ask": None}
                else:
                    names_str = ", ".join(f"'{f.get('nickname')}'" for f in favourites[:3])
                    question = (
                        f"Please choose a favourite or enter a valid account number. Favourites: {names_str}" if en else
                        f"Kripaya favourite chhantuhos ya sahi account number btaunu hos। Favourites: {names_str}"
                    )
                    return {
                        **state,
                        "current_slots": slots,
                        "missing_slots": ["to_account"],
                        "next_slot_to_ask": "choose_favourite",
                        "response": question,
                        "phase": "respond",
                    }
        except Exception:
            digits = re.sub(r"\D", "", user_text)
            if digits and len(digits) >= 8:
                slots["to_account"] = digits
                slots["recipient_nickname"] = slots.get("recipient", "Recipient")
                state = {**state, "current_slots": slots, "next_slot_to_ask": None}
            else:
                question = (
                    f"Please enter a valid destination account number (digits only):" if en else
                    f"Kripaya pathaune account number btaunu hos (numbers मात्र):"
                )
                return {
                    **state,
                    "current_slots": slots,
                    "missing_slots": ["to_account"],
                    "next_slot_to_ask": "choose_favourite",
                    "response": question,
                    "phase": "respond",
                }

    elif asked:
        if asked == "to_account":
            digits = re.sub(r"\D", "", user_text)
            if digits and len(digits) >= 8:
                slots[asked] = digits
                state = {**state, "current_slots": slots, "next_slot_to_ask": None}
            else:
                question = (
                    f"Please enter a valid destination account number (digits only):" if en else
                    f"Kripaya pathaune account number btaunu hos (numbers मात्र):"
                )
                return {
                    **state,
                    "current_slots": slots,
                    "missing_slots": ["to_account"],
                    "next_slot_to_ask": "to_account",
                    "response": question,
                    "phase": "respond",
                }
        else:
            slots[asked] = user_text
            state = {**state, "current_slots": slots, "next_slot_to_ask": None}

    required = REQUIRED_SLOTS.get(intent, [])
    missing = [s for s in required if not slots.get(s)]

    if missing:
        next_slot = missing[0]
        q_map = SLOT_QUESTIONS.get(next_slot)
        question = (q_map[key] if q_map else
                    (f"Please provide: {next_slot}" if key == "english"
                     else f"'{next_slot}' ko value btaunu hos"))
        return {
            **state,
            "current_slots": slots,
            "missing_slots": missing,
            "next_slot_to_ask": next_slot,
            "response": question,
            "phase": "respond",
        }

    # Custom logic to resolve recipient to_account for fund_transfer
    if intent == "fund_transfer" and not slots.get("to_account"):
        recipient_name = slots.get("recipient")
        try:
            favs_res = client.get_favourites()
            favourites = favs_res.get("favourites", [])
            matches = fuzzy_match_recipient(recipient_name, favourites)
            
            if len(matches) == 1:
                slots["to_account"] = matches[0].get("accountNumber")
                slots["recipient_nickname"] = matches[0].get("nickname")
            elif len(matches) > 1:
                names_str = ", ".join(f"'{m.get('nickname')}'" for m in matches)
                question = (
                    f"I found multiple matches: {names_str}. Which one do you mean?" if en else
                    f"Tapai ko list ma multiple matches bhetie: {names_str}। Kun chai ho kripaya btaunu hos?"
                )
                return {
                    **state,
                    "current_slots": slots,
                    "missing_slots": ["recipient"],
                    "next_slot_to_ask": "choose_favourite",
                    "response": question,
                    "phase": "respond",
                }
            else:
                question = (
                    f"'{recipient_name}' is not in your favourites. To add them as a new favourite, please tell me their account number:" if en else
                    f"'{recipient_name}' tapai ko favourite list ma chaina। Naya favourite thapna kripaya account number btaunu hos:"
                )
                return {
                    **state,
                    "current_slots": slots,
                    "missing_slots": ["to_account"],
                    "next_slot_to_ask": "new_favourite_account",
                    "response": question,
                    "phase": "respond",
                }
        except Exception as e:
            question = (
                f"Error retrieving favourites: {e}. Please enter the destination account number:" if en else
                f"Favourites load garna sakiena: {e}। Kripaya destination account number btaunu hos:"
            )
            return {
                **state,
                "current_slots": slots,
                "missing_slots": ["to_account"],
                "next_slot_to_ask": "new_favourite_account",
                "response": question,
                "phase": "respond",
            }

    if state.get("awaiting_otp") or "otp" in slots:
        return {
            **state,
            "current_slots": slots,
            "missing_slots": [],
            "next_slot_to_ask": None,
            "phase": "execute",
        }

    return {
        **state,
        "current_slots": slots,
        "missing_slots": [],
        "next_slot_to_ask": None,
        "phase": "confirm" if intent in CONFIRMATION_INTENTS else "execute",
    }


def confirm_node(state: AgentState) -> AgentState:
    intent = state.get("current_intent", "")
    slots = state.get("current_slots", {})
    user_text = state["user_text"].strip().lower()
    lang = state.get("detected_language", "nepali")
    en = (lang == "english")
    key = "english" if en else "nepali"

    if state.get("awaiting_confirmation"):
        yes_words = {"yes", "y", "ha", "haa", "ho", "ok", "okay", "confirm", "gara", "gardeu", "proceed"}
        no_words  = {"no", "n", "hoina", "nai", "cancel", "band", "ngarnu", "stop", "chaina"}

        if any(w in user_text for w in yes_words):
            return {**state, "awaiting_confirmation": False, "confirm_intent": None, "phase": "execute"}
        elif any(w in user_text for w in no_words):
            cancel_msg = ("Alright, action cancelled. Anything else I can help with?"
                          if en else "Thik cha, action cancel gariyो। Arko kei help chahiyo?")
            return {
                **state,
                "awaiting_confirmation": False,
                "confirm_intent": None,
                "current_intent": "",
                "response": cancel_msg,
                "phase": "respond",
            }
        else:
            unclear = "Please reply with 'yes' or 'no'." if en else "Kripaya 'yes' athawa 'no' vannu hos।"
            return {**state, "response": unclear, "phase": "respond"}

    # First call — emit prompt
    prompt_map = CONFIRM_PROMPTS.get(intent)
    if prompt_map:
        template = prompt_map.get(key, prompt_map["nepali"])
        slots_copy = dict(slots)
        if "recipient_nickname" not in slots_copy:
            slots_copy["recipient_nickname"] = slots_copy.get("to_account", slots_copy.get("recipient", ""))
        prompt = template.format(**slots_copy)
    else:
        prompt = (f"Proceed with '{intent}'? (yes/no)" if en
                  else f"'{intent}' continue garne? (yes/no)")
    return {
        **state,
        "awaiting_confirmation": True,
        "confirm_intent": intent,
        "confirm_slots": slots,
        "response": prompt,
        "phase": "respond",
    }


def execute_node(state: AgentState, client: BankingAPIClient) -> AgentState:
    """
    Call the appropriate API based on current_intent + current_slots.
    Handles graceful degradation on APIError or any exception.
    """
    intent = state.get("current_intent", "")
    slots  = state.get("current_slots", {})

    if not state.get("authenticated"):
        return {
            **state,
            "response": "Pahile login garnu hos. (Authentication required)",
            "phase": "respond",
        }

    # Mutable copy so _dispatch can set pending_transfer_id / awaiting_otp
    mutable = dict(state)

    lang = state.get("detected_language", "nepali")
    try:
        response_text = _dispatch(intent, slots, mutable, client, lang)
        clear_intent = not mutable.get("awaiting_otp")
        return {
            **mutable,
            "response": response_text,
            "current_intent": "" if clear_intent else intent,
            "current_slots":  {} if clear_intent else slots,
            "phase": "respond",
        }
    except APIError as e:
        return {**state, "response": _friendly_error(intent, str(e), lang), "phase": "respond"}
    except Exception as e:
        return {**state, "response": _friendly_error(intent, f"Unexpected error: {e}", lang), "phase": "respond"}


def _dispatch(intent: str, slots: dict, state: AgentState, client: BankingAPIClient, lang: str = "nepali") -> str:
    en = (lang == "english")

    if intent == "balance_inquiry":
        data = client.get_balance()
        return _format_balance(data, lang)

    elif intent == "account_info":
        data = client.get_account_details()
        return _format_account(data, lang)

    elif intent == "mini_statement":
        data = client.get_statement()
        return _format_statement(data, lang)

    elif intent == "card_block":
        if state.get("awaiting_otp") and state.get("pending_card_action") == "block":
            otp = slots.get("otp", "").strip()
            if not otp:
                return "❗ Please enter the OTP code." if en else "❗ OTP code enter garnu hos।"
            try:
                verify = client.verify_otp(otp=otp)
                verified = verify.get("verified", False)
            except Exception:
                verified = False
            if not verified:
                state["awaiting_otp"] = False
                state["pending_card_action"] = None
                return ("❌ Invalid OTP. Card block cancelled. Please try again." if en
                        else "❌ OTP galat thiyo। Card block cancel gariyो। Pheri try garnu hos।")
            data = client.block_card(otp=otp)
            state["awaiting_otp"] = False
            state["pending_card_action"] = None
            msg = data.get('message', '')
            return f"✅ {msg}" if en else f"✅ Card block gariyो। {msg}"
        # First call — send OTP and wait
        client.send_otp()
        state["awaiting_otp"] = True
        state["pending_card_action"] = "block"
        state["next_slot_to_ask"] = "otp"
        return ("OTP sent to your registered email to confirm card block — please enter it:" if en
                else "Card block confirm garna OTP tapai ko registered email ma pathaiyo — OTP enter garnu hos:")

    elif intent == "card_unblock":
        if state.get("awaiting_otp") and state.get("pending_card_action") == "unblock":
            otp = slots.get("otp", "").strip()
            if not otp:
                return "❗ Please enter the OTP code." if en else "❗ OTP code enter garnu hos।"
            try:
                verify = client.verify_otp(otp=otp)
                verified = verify.get("verified", False)
            except Exception:
                verified = False
            if not verified:
                state["awaiting_otp"] = False
                state["pending_card_action"] = None
                return ("❌ Invalid OTP. Card unblock cancelled. Please try again." if en
                        else "❌ OTP galat thiyo। Card unblock cancel gariyो। Pheri try garnu hos।")
            data = client.unblock_card(otp=otp)
            state["awaiting_otp"] = False
            state["pending_card_action"] = None
            msg = data.get('message', '')
            return f"✅ {msg}" if en else f"✅ Card unblock gariyो। {msg}"
        # First call — send OTP and wait
        client.send_otp()
        state["awaiting_otp"] = True
        state["pending_card_action"] = "unblock"
        state["next_slot_to_ask"] = "otp"
        return ("OTP sent to your registered email to confirm card unblock — please enter it:" if en
                else "Card unblock confirm garna OTP tapai ko registered email ma pathaiyo — OTP enter garnu hos:")

    elif intent == "fund_transfer":
        pending_txn = state.get("pending_transfer_id")
        if state.get("awaiting_otp") and pending_txn:
            otp = slots.get("otp", "").strip()
            if not otp:
                return "❗ Please enter the OTP code." if en else "❗ OTP code enter garnu hos।"
            confirm = client.confirm_transfer(transaction_id=pending_txn, otp=otp)
            state["pending_transfer_id"] = None
            state["awaiting_otp"] = False
            amt = int(slots.get('amount', 0))
            dest = slots.get('recipient_nickname') or slots.get('to_account', '')
            return (f"✅ Transfer successful! NPR {amt:,} sent to {dest}.\n{confirm.get('message','')}" if en
                    else f"✅ Transfer safal! {dest} lai NPR {amt:,} pathaiyo।\n{confirm.get('message','')}")

        result = client.initiate_transfer(
            to_account=str(slots.get("to_account", "")),
            amount=int(slots.get("amount", 0)),
        )
        txn_id = result.get("transactionId")
        if txn_id:
            # If server returned a nickname (matched favourite), use it
            server_nick = result.get("nickname")
            if server_nick:
                state["current_slots"] = {**slots, "recipient_nickname": server_nick}
            state["pending_transfer_id"] = txn_id
            state["awaiting_otp"] = True
            state["next_slot_to_ask"] = "otp"
            return (f"Transfer initiated (ID: {txn_id}). OTP sent to your registered email — please enter it:"
                    if en else
                    f"Transfer initiate gariyो (ID: {txn_id}).\nTapai ko registered email ma OTP pathaiyo — OTP code enter garnu hos:")
        # Transfer initiation failure
        msg = result.get("message", str(result))
        return (f"Transfer failed: {msg}" if en else f"Transfer huna sakena: {msg}")

    elif intent == "complaint_log":
        data = client.create_complaint(
            description=slots.get("description", "General complaint"),
            subject=slots.get("subject"),
            category=slots.get("category", "general"),
        )
        ref = data.get('ticketId', data.get('complaint_id', 'N/A'))  # API returns ticketId
        msg = data.get('message', '')
        return (f"✅ Complaint registered. Ticket ID: {ref}" if en
                else f"✅ Complaint darta gariyो। Ticket ID: {ref}")

    elif intent == "loan_inquiry":
        data = client.get_loan_eligibility(loan_type=slots.get("loan_type", "personal"))
        if "error" in data:
            return _friendly_error(intent, data["error"], lang)
        eligible = data.get('eligible', False)
        max_amt = data.get('maxAmount', 0)
        status = ("✅ Eligible" if en else "✅ Eligible (Yogya)") if eligible else ("❌ Not eligible" if en else "❌ Eligible haina")
        return (f"Loan Eligibility:\n  Status: {status}\n  Max Amount: NPR {max_amt:,}" if en
                else f"Loan Eligibility:\n  Status: {status}\n  Adhikatam Rakam: NPR {max_amt:,}")

    elif intent == "otp_verification":
        data = client.send_otp()
        msg = data.get('message', '')
        return (f"✅ OTP sent to your registered email. {msg}" if en
                else f"✅ OTP tapai ko registered email ma pathaiyo। {msg}")

    elif intent == "greeting_farewell":
        return ("Hello! I'm your Voice Banking Sahayak. How can I help you?" if en
                else "Namaste! Ma tapai ko Voice Banking Sahayak hun। Kaise madad garau?")

    elif intent == "out_of_scope":
        return ("Sorry, I can only help with banking-related questions." if en
                else "Maafi garnu hola, yo banking-related question haina। Kripaya banking ko baare ma sodhnu hos।")

    return (f"Action for '{intent}' is not available yet." if en
            else f"'{intent}' ko lagi kaam ahile available chaina।")


def respond_node(state: AgentState) -> AgentState:
    """Print the response and finalize the turn."""
    queue = state.get("intent_queue", [])
    mutable = dict(state)
    
    if queue and not mutable.get("awaiting_otp") and not mutable.get("awaiting_confirmation") and not mutable.get("next_slot_to_ask"):
        # We only ask for follow-up if the current intent successfully completed
        if not mutable.get("current_intent"):
            next_item = queue[0]
            next_intent = next_item["intent"]
            lang = mutable.get("detected_language", "nepali")
            followup = get_followup_prompt(next_intent, lang)
            # Append followup to the response
            resp = mutable.get("response", "")
            if resp:
                mutable["response"] = resp + "\n\n" + followup
            else:
                mutable["response"] = followup
            mutable["awaiting_queue_confirm"] = True

    # Save bot response to chat history
    bot_resp = mutable.get("response", "")
    if bot_resp:
        messages = list(mutable.get("messages", []))
        messages.append({"role": "assistant", "content": bot_resp})
        mutable["messages"] = messages[-10:]

    return {**mutable, "phase": "done"}


# ─────────────────────────────────────────────────────────────────────────────
# Graph Router
# ─────────────────────────────────────────────────────────────────────────────

def router(state: AgentState) -> str:
    phase = state.get("phase", "nlu")
    if phase == "nlu":         return "nlu"
    if phase == "slot_fill":   return "slot_check"
    if phase == "confirm":     return "confirm"
    if phase == "execute":     return "execute"
    if phase == "respond":     return "respond"
    return END


# ─────────────────────────────────────────────────────────────────────────────
# Build Graph
# ─────────────────────────────────────────────────────────────────────────────

def build_graph(client: BankingAPIClient) -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("nlu",        nlu_node)
    graph.add_node("slot_check", lambda s: slot_check_node(s, client))
    graph.add_node("confirm",    confirm_node)
    graph.add_node("execute",    lambda s: execute_node(s, client))
    graph.add_node("respond",    respond_node)

    graph.set_entry_point("nlu")

    graph.add_conditional_edges("nlu",        router, {
        "slot_check": "slot_check",
        "confirm":    "confirm",
        "respond":    "respond",
    })
    graph.add_conditional_edges("slot_check", router, {
        "confirm":  "confirm",
        "execute":  "execute",
        "respond":  "respond",
    })
    graph.add_conditional_edges("confirm",    router, {
        "execute":  "execute",
        "respond":  "respond",
    })
    graph.add_edge("execute", "respond")
    graph.add_edge("respond", END)

    return graph.compile()


# ─────────────────────────────────────────────────────────────────────────────
# Initial State Factory
# ─────────────────────────────────────────────────────────────────────────────

def fresh_state(user_text: str, prev: dict | None = None) -> AgentState:
    base: AgentState = {
        "messages":              [],
        "user_text":             user_text,
        "detected_language":     "nepali",
        "nlu_result":            {},
        "current_intent":        "",
        "current_slots":         {},
        "confidence":            0.0,
        "missing_slots":         [],
        "next_slot_to_ask":      None,
        "awaiting_confirmation":  False,
        "confirm_intent":         None,
        "confirm_slots":          {},
        "pending_transfer_id":    None,
        "pending_card_action":    None,
        "awaiting_otp":           False,
        "response":               "",
        "authenticated":          False,
        "intent_queue":           [],
        "awaiting_queue_confirm": False,
        "phase":                  "nlu",
    }
    if prev:
        carry = [
            "authenticated", "awaiting_confirmation", "confirm_intent",
            "confirm_slots", "current_intent", "current_slots",
            "missing_slots", "next_slot_to_ask", "pending_transfer_id",
            "pending_card_action", "awaiting_otp", "detected_language",
            "intent_queue", "awaiting_queue_confirm", "messages",
        ]
        for k in carry:
            base[k] = prev.get(k, base[k])
    base["user_text"] = user_text
    base["phase"] = "nlu"
    return base


# ─────────────────────────────────────────────────────────────────────────────
# REPL / Main Loop
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Voice Banking Sahayak — Agentic Mode (LangGraph)")
    print("=" * 60)

    # ── Auth ────────────────────────────────────────────────────────
    client = BankingAPIClient()
    print("\nLogin garna:  login <email> <password>")
    print("Register garn: register <name> <email> <password>")
    print("Type 'quit' to exit.\n")

    app = build_graph(client)
    state: AgentState | None = None
    authenticated = False

    while True:
        try:
            raw = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not raw:
            continue
        if raw.lower() in ("quit", "exit", "bye"):
            print("Bot: Dhanyabad! Pheri bhetaula. 🙏")
            break

        # ── Built-in commands ────────────────────────────────────────
        if raw.lower().startswith("login "):
            parts = raw.split()
            if len(parts) < 3:
                print("Bot: Usage: login <email> <password>")
                continue
            try:
                info = client.login(parts[1], parts[2])
                authenticated = True
                print(f"Bot: ✅ Login successful! Welcome, {info.get('name')}.")
                print(f"     Account: {info.get('accountNumber')}")
            except APIError as e:
                print(f"Bot: ❌ Login failed: {e}")
            continue

        if raw.lower().startswith("register "):
            parts = raw.split(maxsplit=3)
            if len(parts) < 4:
                print("Bot: Usage: register <name> <email> <password>")
                continue
            try:
                res = client.register(name=parts[1], email=parts[2], password=parts[3])
                print(f"Bot: ✅ Registered! {res.get('message', '')} Ab login garnu hos.")
            except APIError as e:
                print(f"Bot: ❌ Registration failed: {e}")
            continue

        # ── NLU + Agent turn ─────────────────────────────────────────
        turn_state = fresh_state(raw, prev=state)
        turn_state["authenticated"] = authenticated

        result = app.invoke(turn_state)
        state = result   # persist across turns

        response = result.get("response", "")
        if response:
            print(f"Bot: {response}")
        print()


if __name__ == "__main__":
    main()
