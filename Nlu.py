"""
Voice Banking NLU classifier — language detection + intent classification.

Input: one line of text (English / Nepali / NepGlish).
Output: one JSON object. Nothing else. Think mode disabled.

Usage:
    python nlu.py                      # interactive loop
    python nlu.py "Mero balance kati cha?"   # single utterance, one-shot
"""

import json
import sys

import requests

from config import OLLAMA_HOST, MODEL_NAME, REQUEST_TIMEOUT_SEC, INTENTS, INTENTS_Description

INTENT_DESCRIPTIONS = "\n".join(
    f"- {intent}: {desc}"
    for intent, desc in INTENTS_Description.items()
)

SYSTEM_PROMPT = """
You classify one banking customer utterance.

The customer may speak English, Nepali (Devanagari or Roman transliteration), or NepGlish.

Step 1 — detect the language:
- nepali
- english
- nepglish

Step 2 — choose exactly ONE intent from the following taxonomy:

Available intents:
{intents}

Intent descriptions:
{intent_descriptions}

If none match, return "out_of_scope".

Reply ONLY with this JSON:

{{"language":"<nepali|english|nepglish>",
"intent":"<intent>",
"confidence":0.0}}
""".format(
    intents=", ".join(INTENTS),
    intent_descriptions=INTENT_DESCRIPTIONS,
)


def classify(text: str) -> dict:
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
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
    except requests.exceptions.HTTPError as e:
        return {"error": f"Ollama HTTP error: {resp.text}"}

    raw = resp.json().get("message", {}).get("content", "")
    parsed = _parse_json(raw)
    if parsed is None:
        return {"error": "Model did not return valid JSON.", "raw_output": raw}

    # Guard against a hallucinated intent label outside the taxonomy
    if parsed.get("intent") not in INTENTS:
        parsed["intent"] = "out_of_scope"
    return parsed


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
        # One-shot mode: python nlu.py "some text"
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