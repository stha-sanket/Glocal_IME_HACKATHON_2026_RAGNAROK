"""
Voice Banking NLU classifier — language detection + intent classification + entity extraction.
Input: one line of text (English / Nepali / NepGlish).
Output: one JSON object. Nothing else. Think mode disabled.
Usage:
    python nlu.py                      # interactive loop
    python nlu.py "Mero balance kati cha?"   # single utterance, one-shot
"""
import json
import re
import sys

import requests

from config import (
    OLLAMA_HOST, MODEL_NAME, REQUEST_TIMEOUT_SEC, INTENTS, INTENTS_Description,
    ENTITY_TYPES, AMOUNT_WORDS, _NUM_WORD_TO_DIGIT,
)

INTENT_DESCRIPTIONS = "\n".join(
    f"- {intent}: {desc}" for intent, desc in INTENTS_Description.items()
)

SYSTEM_PROMPT = """
You classify one banking customer utterance.
The customer may speak English, Nepali (Devanagari or Roman transliteration), or NepGlish \
(code-switched Nepali-English in the SAME sentence). If the sentence mixes English words \
and Nepali words together, it is "nepglish" — NOT "nepali". Only label something "nepali" \
if it is entirely Nepali with no English words mixed in.

IMPORTANT: a single utterance can contain MORE THAN ONE banking request, often joined by \
words like "ani" (and then), "ra" (and), "pachi" (after that), "and", "then". When this \
happens, you must return ONE separate entry per request, in the order they were spoken. \
Do not merge them into a single intent, and do not drop any of them.

Step 1 — detect the language once for the whole utterance:
- nepali
- english
- nepglish

Step 2 — split the utterance into its separate banking requests (usually just one, \
sometimes more), and for EACH one choose exactly ONE intent from the following taxonomy:
Available intents:
{intents}

Intent descriptions:
{intent_descriptions}

If a segment doesn't match any of these, use "out_of_scope" for that segment.

Step 3 — for EACH intent segment, extract any entities present into its own \
extracted_slots, using only these keys: {entities}. Only include a key if that entity is \
actually present in that segment — never invent values, and don't attach an entity to the \
wrong intent segment. Normalize spoken amounts to plain integers ("5 hajar" / "paach hajar" \
-> 5000, "ek lakh" -> 100000, "das hajar" -> 10000, "ek karod" -> 10000000). If no entities \
are present in a segment, its extracted_slots must be {{}}.

confidence must be a realistic, calibrated float per intent — do not default to 1.0. \
Reserve 0.9+ for unambiguous requests; use lower values (0.5-0.8) when a segment is noisy, \
ambiguous, or code-switched in a way that could confuse classification.

Examples:
Utterance: "Last 5 transactions dekhaunus mero savings account ko"
Output: {{"language": "nepglish", "intents": [{{"intent": "mini_statement", "confidence": 0.88, "extracted_slots": {{"count": 5, "account_type": "savings"}}}}]}}

Utterance: "malai mero latest 5 transaction send gara ani mero card block gardeu"
Output: {{"language": "nepglish", "intents": [{{"intent": "mini_statement", "confidence": 0.88, "extracted_slots": {{"count": 5}}}}, {{"intent": "card_block", "confidence": 0.9, "extracted_slots": {{}}}}]}}

Utterance: "Mero account number 1234567890 ko balance k cha ra last 3 transaction pani dekhaunus"
Output: {{"language": "nepglish", "intents": [{{"intent": "balance_inquiry", "confidence": 0.9, "extracted_slots": {{"account_number": "1234567890"}}}}, {{"intent": "mini_statement", "confidence": 0.85, "extracted_slots": {{"count": 3}}}}]}}

Reply ONLY with this JSON, nothing else — no explanation, no markdown fences:
{{"language":"<nepali|english|nepglish>",
"intents":[{{"intent":"<intent>","confidence":0.0,"extracted_slots":{{...}}}}, ...]}}
""".format(
    intents=", ".join(INTENTS),
    intent_descriptions=INTENT_DESCRIPTIONS,
    entities=", ".join(ENTITY_TYPES),
)

_AMOUNT_WORD_RE = re.compile(
    r"\b(ek|1|do|2|teen|3|char|4|paach|pach|5|chha|cha|6|saat|7|aath|8|nau|9|das|10)\s*"
    r"(hajar|lakh|karod)\b", re.IGNORECASE
)
_COUNT_RE = re.compile(
    r"\b(?:last|pichhillo|previous)\s+(\d{1,3})\b|"
    r"\b(\d{1,3})\s+(?:transactions?|txn)\b", re.IGNORECASE
)
_PHONE_RE = re.compile(r"\b(9\d{9}|\d{10})\b")
_ACCOUNT_NUM_RE = re.compile(r"\b(\d{8,16})\b")
# Captures 1-2 words right before "lai" (Nepali "to <person>") as a recipient candidate
_RECIPIENT_LAI_RE = re.compile(
    r"\b((?:mero\s+)?\w+)\s+lai\b", re.IGNORECASE
)
# Stem-based (not exact-word) matching so common ASR typos like "currect" for
# "current" still match, since the stem "curr" is a substring either way.
_ACCOUNT_TYPE_STEMS = {"fixed deposit": "fixed deposit", "saving": "savings",
                        "sav": "savings", "curr": "current", "fd": "fixed deposit"}
_CARD_TYPE_STEMS = {"debit": "debit", "credit": "credit", "atm": "atm"}
_LOAN_TYPE_STEMS = {"personal": "personal", "vehicle": "vehicle", "auto": "vehicle",
                     "agricultural": "agricultural", "agri": "agricultural",
                     "education": "education", "business": "business", "home": "home"}

# Capitalized proper-noun heuristic for BENEFICIARY_NAME (e.g. "Ram", "Sita").
# Skips the first word (sentence-initial capitalization isn't a reliable name
# signal) and a stoplist of common banking terms that might get capitalized.
_NAME_CANDIDATE_RE = re.compile(r"^[A-Z][a-z]{2,}$")
_NAME_STOPLIST = {
    "Balance", "Transfer", "Card", "Account", "Loan", "Otp", "Atm", "Please",
    "Hello", "Hi", "Namaste", "Bank", "Statement", "Amount", "Deposit",
}


def _extract_keyword(text: str, stem_map: dict):
    lowered = text.lower()
    # Check longer stems first so "fixed deposit" wins over the shorter "fd" etc.
    for stem in sorted(stem_map, key=len, reverse=True):
        if stem in lowered:
            return stem_map[stem]
    return None


def _extract_beneficiary_name(text: str):
    words = text.split()
    for i, w in enumerate(words):
        if i == 0:
            continue  # skip first word — sentence-initial caps aren't a name signal
        clean = re.sub(r"[^A-Za-z]", "", w)
        if _NAME_CANDIDATE_RE.match(clean) and clean not in _NAME_STOPLIST:
            return clean
    return None


def _find_unclaimed_number(text: str, slots: dict):
    """Finds a single bare number in the text not already claimed by another
    slot (account_number, phone_number, count). Used to catch cases where the
    model hallucinates a multiplier on a plain number (e.g. '10' -> 10000)."""
    claimed = {str(slots[k]) for k in ("account_number", "phone_number", "count") if k in slots}
    numbers = re.findall(r"\d+", text)
    candidates = [n for n in numbers if n not in claimed]
    if len(candidates) == 1:
        return int(candidates[0])
    return None


def _normalize_amount_text(text: str):
    """Only matches explicit spoken-amount word patterns (e.g. 'chha lakh', '5 hajar').
    Deliberately does NOT fall back to bare digit-guessing — that risks mislabeling
    account/phone digits elsewhere in the sentence as an amount."""
    match = _AMOUNT_WORD_RE.search(text)
    if match:
        num_word, unit = match.group(1).lower(), match.group(2).lower()
        return _NUM_WORD_TO_DIGIT.get(num_word, 1) * AMOUNT_WORDS[unit]
    return None


def _extract_count(text: str):
    match = _COUNT_RE.search(text)
    if match:
        return int(match.group(1) or match.group(2))
    return None


def _extract_phone(text: str):
    match = _PHONE_RE.search(text)
    return match.group(1) if match else None


def _extract_account_number(text: str):
    match = _ACCOUNT_NUM_RE.search(text)
    return match.group(1) if match else None


def _extract_recipient(text: str):
    match = _RECIPIENT_LAI_RE.search(text)
    if match:
        candidate = match.group(1).strip()
        # Strip a leading "mero" (="my") from the noun itself, keep it as separate context
        return candidate
    return None


def _postprocess_slots(text: str, intent: str, slots: dict) -> dict:
    """Applies all deterministic regex safety nets to one intent segment's slots.
    Called once per detected intent, since a multi-intent utterance can have
    different entities attached to different segments."""
    slots = dict(slots or {})

    # Amount only makes sense for fund_transfer — restrict so it doesn't leak
    # into an unrelated intent segment from the same multi-intent utterance.
    if intent == "fund_transfer":
        text_amount = _normalize_amount_text(text)
        if text_amount is not None:
            slots["amount"] = text_amount
        elif "amount" in slots:
            literal = _find_unclaimed_number(text, slots)
            if literal is not None:
                slots["amount"] = literal
            elif isinstance(slots["amount"], str):
                digits = re.sub(r"\D", "", slots["amount"])
                slots["amount"] = int(digits) if digits else slots["amount"]

    # Count only makes sense for mini_statement — same cross-contamination guard.
    if intent == "mini_statement":
        if "count" not in slots:
            count_val = _extract_count(text)
            if count_val is not None:
                slots["count"] = count_val
        elif isinstance(slots["count"], str) and slots["count"].strip().isdigit():
            slots["count"] = int(slots["count"].strip())

    if intent == "otp_verification" and "phone_number" not in slots:
        phone_val = _extract_phone(text)
        if phone_val is not None:
            slots["phone_number"] = phone_val

    if intent in ("balance_inquiry", "account_info", "fund_transfer") \
            and "account_number" not in slots and "account number" in text.lower():
        acct_val = _extract_account_number(text)
        if acct_val is not None:
            slots["account_number"] = acct_val

    if "recipient" not in slots and intent == "fund_transfer":
        recipient_val = _extract_recipient(text)
        if recipient_val is not None:
            slots["recipient"] = recipient_val

    if "account_type" not in slots and intent in ("balance_inquiry", "account_info", "mini_statement"):
        acct_type_val = _extract_keyword(text, _ACCOUNT_TYPE_STEMS)
        if acct_type_val is not None:
            slots["account_type"] = acct_type_val

    if "card_type" not in slots and intent in ("card_block", "card_unblock"):
        card_type_val = _extract_keyword(text, _CARD_TYPE_STEMS)
        if card_type_val is not None:
            slots["card_type"] = card_type_val

    if "loan_type" not in slots and intent == "loan_inquiry":
        loan_type_val = _extract_keyword(text, _LOAN_TYPE_STEMS)
        if loan_type_val is not None:
            slots["loan_type"] = loan_type_val

    # Beneficiary name is relevant to money-movement or money-related-complaint
    # intents — not card/loan/greeting/otp segments in the same utterance.
    if "beneficiary_name" not in slots and intent in ("fund_transfer", "balance_inquiry", "complaint_log", "account_info"):
        name_val = _extract_beneficiary_name(text)
        if name_val is not None:
            slots["beneficiary_name"] = name_val

    return slots


def classify(text: str, history: list = None) -> dict:
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        for msg in history:
            msgs.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
    msgs.append({"role": "user", "content": text})

    payload = {
        "model": MODEL_NAME,
        "messages": msgs,
        "stream": False,
        "think": False,          # <-- disables thinking/reasoning mode
        "format": "json",
        "options": {"temperature": 0.1},
    }
    try:
        resp = requests.post(f"{OLLAMA_HOST}/api/chat", json=payload, timeout=REQUEST_TIMEOUT_SEC)
        resp.raise_for_status()
    except requests.exceptions.ConnectionError:
        return {"error": f"Cannot reach Ollama at {OLLAMA_HOST}. Is `ollama serve` running?"}
    except requests.exceptions.ReadTimeout:
        return {"error": f"Ollama took longer than {REQUEST_TIMEOUT_SEC}s to respond. "
                          f"Try `ollama run {MODEL_NAME}` once in another terminal first "
                          f"(warms the model into memory), or raise SAHAYAK_TIMEOUT."}
    except requests.exceptions.HTTPError:
        return {"error": f"Ollama HTTP error: {resp.text}"}

    raw = resp.json().get("message", {}).get("content", "")
    parsed = _parse_json(raw)
    if parsed is None:
        return {"error": "Model did not return valid JSON.", "raw_output": raw}

    language = parsed.get("language", "english")
    if language not in ("nepali", "english", "nepglish"):
        language = "english"

    # Accept either the new {"intents": [...]} shape or an older flat
    # {"intent": ..., "confidence": ..., "extracted_slots": ...} shape from a
    # model that ignores the schema — wrap the latter into a one-item list.
    raw_intents = parsed.get("intents")
    if not isinstance(raw_intents, list) or not raw_intents:
        if "intent" in parsed:
            raw_intents = [{
                "intent": parsed.get("intent"),
                "confidence": parsed.get("confidence", 0.0),
                "extracted_slots": parsed.get("extracted_slots", {}),
            }]
        else:
            raw_intents = [{"intent": "out_of_scope", "confidence": 0.0, "extracted_slots": {}}]

    intents_out = []
    for item in raw_intents:
        intent = item.get("intent")
        if intent not in INTENTS:
            intent = "out_of_scope"
        confidence = float(item.get("confidence", 0.0) or 0.0)
        slots = _postprocess_slots(text, intent, item.get("extracted_slots", {}))
        intents_out.append({
            "intent": intent,
            "confidence": round(confidence, 3),
            "extracted_slots": slots,
        })

    return {"language": language, "intents": intents_out}


def _parse_json(raw: str):
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end + 1])
            except json.JSONDecodeError:
                return None
        return None


def main():
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        print(json.dumps(classify(text), ensure_ascii=False, indent=2))
        return

    print(f"Connected to {OLLAMA_HOST} | model={MODEL_NAME} | think=False")
    print("Type a message and press enter. Ctrl+C to quit.\n")
    while True:
        try:
            text = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not text:
            continue
        result = classify(text)
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()