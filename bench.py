import json
import time
import requests
import pandas as pd
import re

from statistics import mean
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from tabulate import tabulate


OLLAMA_HOST = "http://localhost:11434"
REQUEST_TIMEOUT = 120


MODELS = [
    "qwen3.5:9b",
    "qwen2.5:latest",
    "dolphin3:8b",
    "llama3.2:3b",
    "mistral:7b",
    "llama3.1:8b",
    "gemma4:e2b",
    "qwen3.5:4b",
]


INTENT_EXAMPLES = {
    "balance_inquiry": [
        "Mero balance kati cha?",
        "Balance check gardinus.",
        "Account ma kati paisa cha?",
        "Available balance herna milcha?",
        "Balance bhanidinus."
    ],
    "card_block": [
        "Mero ATM card block gardinus.",
        "Card harayo, block garna paryo.",
        "Debit card lai turuntai block garnus.",
        "Mero card chori bhayo, block gardinus.",
        "Card use nahos bhanera block garna cha."
    ],
    "mini_statement": [
        "Mero last 5 transaction dekhaunu.",
        "Mini statement chaiyo.",
        "Recent transaction herna cha.",
        "Pachhillo transaction haru dekhaunu.",
        "Transaction history pathaidinus."
    ],
    "fund_transfer": [
        "Ram lai 5000 transfer garna cha.",
        "Paisa transfer gardinus.",
        "Yo account bata arko account ma paisa pathaunu.",
        "Fund transfer garna milcha?",
        "Mero account bata payment garna cha."
    ],
    "complaint_log": [
        "Mero complaint register gardinus.",
        "Bank ko service ko complaint cha.",
        "Transaction fail bhayo complaint garna cha.",
        "Yo issue report garna cha.",
        "Mero problem ko complaint file gardinus."
    ],
    "loan_inquiry": [
        "Loan ko interest kati cha?",
        "Home loan ko barema jankari chaiyo.",
        "Loan lina k garna parcha?",
        "Personal loan available cha?",
        "EMI calculate garna milcha?"
    ],
    "account_info": [
        "Mero account type k ho?",
        "Account kholna k k chaincha?",
        "KYC update kasari garne?",
        "Mero branch kun ho?",
        "Savings account ko feature k ho?"
    ],
    "greeting_farewell": [
        "Namaste.",
        "Hello.",
        "Dhanyabad.",
        "Bye bye.",
        "Sanchai hunuhuncha?"
    ],
    "otp_verification": [
        "OTP aayena.",
        "Verification code pathaidinus.",
        "OTP resend gardinus.",
        "Login ko OTP chaincha.",
        "Mero OTP kam garena."
    ],
    "card_unblock": [
        "Mero card unblock gardinus.",
        "Block bhayeko card feri chalauna cha.",
        "Card reactivate gardinus.",
        "ATM card enable gardinus.",
        "Card unlock garna cha."
    ],
    "out_of_scope": [
        "Aaja ko weather kasto cha?",
        "Cricket score kati cha?",
        "Pizza order garna cha.",
        "Movie recommend gardinus.",
        "Kathmandu bata Pokhara kati time lagcha?"
    ]
}


INTENTS = list(INTENT_EXAMPLES.keys())


INTENTS_DESCRIPTION = {
    "balance_inquiry": "Customer wants to know the current account balance or available balance.",
    
    "card_block": "Customer wants to block, freeze, or deactivate a debit or credit card because it is lost, stolen, or suspected to be compromised.",

    "mini_statement": "Customer wants recent transactions, transaction history, or a mini statement.",

    "fund_transfer": "Customer wants to transfer money, send funds, or make a bank transfer to another account.",

    "complaint_log": "Customer wants to report a banking issue, file a complaint, or report a problem with a banking service.",

    "loan_inquiry": "Customer asks about loans, loan eligibility, interest rates, EMI, repayment, or loan status.",

    "account_info": "Customer asks about account details such as account type, account opening, branch information, account number, KYC, or account features. Do NOT use this for balance requests.",

    "greeting_farewell": (
    "ONLY greetings, introductions, thanks, or farewells with no other request. "
    "Examples: 'Hello', 'Hi', 'Namaste', 'Good morning', 'Thank you', 'Bye'. "
    "Do NOT use this for weather, sports, movies, general knowledge, or any non-banking question."
),

    "otp_verification": "Customer asks about OTPs, verification codes, login authentication, or one-time passwords.",

    "card_unblock": "Customer wants to unblock, reactivate, or enable a previously blocked card.",

    "out_of_scope": (
    "Any request that is NOT related to banking. "
    "This includes weather, sports, movies, music, food, travel, programming, "
    "math, jokes, news, or any other non-banking topic."
),
}


intent_text = "\n".join(
    f"- {intent}: {INTENTS_DESCRIPTION[intent]}"
    for intent in INTENTS
)


SYSTEM_PROMPT = f"""
You are an expert banking intent classifier.

INTENTS:
{intent_text}

Rules:
1. Return ONLY valid JSON.
2. Choose exactly one intent.
3. If unclear → out_of_scope.
4. confidence must be 0.0–1.0.

Output:
{{
  "intent": "<intent>",
  "confidence": 0.95
}}
""".strip()


def safe_json_parse(text):
    text = text.strip()
    text = re.sub(r"^```json|```$", "", text)
    try:
        return json.loads(text)
    except:
        return None


def classify(model, text):
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        "stream": False,
        "think": False, 
        "format": "json",
        "options": {
            "temperature": 0.1,
        }
    }

    start = time.perf_counter()

    try:
        r = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json=payload,
            timeout=REQUEST_TIMEOUT
        )
    except Exception:
        return {
            "intent": "out_of_scope",
            "confidence": 0,
            "latency": 0,
            "tokens_sec": 0,
            "prompt_tokens": 0,
            "generated_tokens": 0,
            "json_ok": False,
        }

    elapsed = time.perf_counter() - start

    if r.status_code != 200:
        return {
            "intent": "out_of_scope",
            "confidence": 0,
            "latency": elapsed,
            "tokens_sec": 0,
            "prompt_tokens": 0,
            "generated_tokens": 0,
            "json_ok": False,
        }

    data = r.json()

    try:
        raw = data["message"]["content"]
    except KeyError:
        raw = "{}"

    parsed = safe_json_parse(raw)

    json_ok = True
    if not parsed:
        parsed = {"intent": "out_of_scope", "confidence": 0}
        json_ok = False

    if parsed.get("intent") not in INTENTS:
        parsed["intent"] = "out_of_scope"

    eval_duration = data.get("eval_duration", 0)
    eval_count = data.get("eval_count", 0)

    if eval_duration > 0 and eval_count > 0:
        tps = eval_count / (eval_duration / 1e9)
    else:
        tps = 0

    return {
        "intent": parsed["intent"],
        "confidence": parsed.get("confidence", 0),
        "latency": elapsed,
        "tokens_sec": tps,
        "prompt_tokens": data.get("prompt_eval_count", 0),
        "generated_tokens": eval_count,
        "json_ok": json_ok,
    }


summary = []

for model in MODELS:
    print("=" * 80)
    print(model)
    print("=" * 80)

    y_true = []
    y_pred = []
    confidences = []
    latencies = []
    speeds = []
    prompt_tokens = []
    generated_tokens = []

    json_success = 0
    total = 0

    for expected, examples in INTENT_EXAMPLES.items():
        for text in examples:

            result = classify(model, text)

            y_true.append(expected)
            y_pred.append(result["intent"])
            confidences.append(result["confidence"])
            latencies.append(result["latency"])
            speeds.append(result["tokens_sec"])
            prompt_tokens.append(result["prompt_tokens"])
            generated_tokens.append(result["generated_tokens"])

            total += 1
            if result["json_ok"]:
                json_success += 1

            ok = "✅" if result["intent"] == expected else "❌"

            print(
                f"{ok} {text}\n"
                f"Expected : {expected}\n"
                f"Predicted: {result['intent']}\n"
                f"Confidence: {result['confidence']}\n"
            )

    accuracy = accuracy_score(y_true, y_pred)

    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true,
        y_pred,
        average="weighted",
        zero_division=0,
    )

    row = {
        "Model": model,
        "Accuracy": round(accuracy, 4),
        "Precision": round(precision, 4),
        "Recall": round(recall, 4),
        "F1": round(f1, 4),
        "Avg Confidence": round(mean(confidences), 3),
        "Latency(s)": round(mean(latencies), 3),
        "Tokens/sec": round(mean(speeds), 2),
        "Prompt Tokens": round(mean(prompt_tokens), 1),
        "Generated Tokens": round(mean(generated_tokens), 1),
        "JSON Success %": round(json_success / total * 100, 2),
    }

    summary.append(row)


print("\n\nFINAL BENCHMARK\n")

df = pd.DataFrame(summary)

print(tabulate(df, headers="keys", tablefmt="github", showindex=False))

df.to_csv("benchmark_results.csv", index=False)

print("\nSaved benchmark_results.csv")