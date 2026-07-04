from Nlu import classify

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


correct = 0
total = 0

for expected_intent, examples in INTENT_EXAMPLES.items():
    print(f"\n===== {expected_intent} =====")

    for text in examples:
        result = classify(text)

        predicted = result.get("intent", "ERROR")
        confidence = result.get("confidence", "-")

        ok = predicted == expected_intent

        if ok:
            correct += 1

        total += 1

        status = "✅" if ok else "❌"

        print(
            f"{status} {text}\n"
            f"   Expected : {expected_intent}\n"
            f"   Predicted: {predicted}\n"
            f"   Confidence: {confidence}\n"
        )

print("=" * 60)
print(f"Accuracy: {correct}/{total} = {correct/total:.2%}")