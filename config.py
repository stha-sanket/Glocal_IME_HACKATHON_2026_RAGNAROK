"""
Minimal config for the NepGlish banking NLU classifier.
"""
import os
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.environ.get("SAHAYAK_MODEL", "gemma4:e2b")
REQUEST_TIMEOUT_SEC = int(os.environ.get("SAHAYAK_TIMEOUT", "180"))
INTENTS = [
    "balance_inquiry",
    "card_block",
    "mini_statement",
    "fund_transfer",
    "complaint_log",
    "loan_inquiry",
    "account_info",
    "greeting_farewell",
    "otp_verification",
    "card_unblock",
    "out_of_scope",
]
INTENTS_Description = {
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
ENTITY_TYPES = [
    "amount",            # AMOUNT
    "account_type",      # ACCOUNT_TYPE (savings, current...)
    "card_type",         # CARD_TYPE (debit, credit...)
    "recipient",         # TRANSFER_RECIPIENT
    "loan_type",         # LOAN_TYPE (personal, home, vehicle, agricultural...)
    "period",            # TIME_PERIOD (last week, this month...)
    "phone_number",      # PHONE_NUMBER
    "count",             # COUNT (e.g. "last 5 transactions")
    "beneficiary_name",  # BENEFICIARY_NAME
    "account_number",    # ACCOUNT_NUMBER
]
AMOUNT_WORDS = {"hajar": 1000, "lakh": 100000, "karod": 10000000}
_NUM_WORD_TO_DIGIT = {
    "ek": 1, "1": 1, "do": 2, "2": 2, "teen": 3, "3": 3, "char": 4, "4": 4,
    "paach": 5, "pach": 5, "5": 5, "chha": 6, "cha": 6, "6": 6, "saat": 7, "7": 7,
    "aath": 8, "8": 8, "nau": 9, "9": 9, "das": 10, "10": 10,
}