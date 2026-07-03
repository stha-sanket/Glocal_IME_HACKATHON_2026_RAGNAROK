"""
nepglish_lid.py
================
Language identification for English / Nepali / Nepglish (code-mixed) text.

Handles:
  - Nepali written in Devanagari script         ("म बैंक जान्छु")
  - Nepali written in Romanized script          ("ma bank janchu")
  - English                                      ("I am going to the bank")
  - Nepglish / code-mixed                        ("ma tomorrow bank janxu paisa nikalna")

Design (word-level -> sentence-level aggregation):
  1. Tokenize the sentence.
  2. Tag every token as NE / EN / OTHER (numbers, punctuation, emoji, URLs...)
       - Devanagari unicode range          -> NE   (script is unambiguous)
       - Romanized Nepali lexicon/suffixes -> NE
       - English dictionary (wordfreq)     -> EN
       - Unknown latin-script token        -> scored with a lightweight
         character n-gram model trained on the two lexicons, so even OOV
         words get a reasonable guess instead of being thrown away.
  3. Aggregate word tags into a sentence-level label using ratios, so a
     single loanword ("bank", "internet") doesn't flip a Nepali sentence
     into "Nepglish".

No internet access / training data required to run out of the box.
Only external dependency: `wordfreq` (pip install wordfreq) for the
English lexicon. Everything else is pure stdlib + the bundled Nepali
lexicon below.

This file is also directly useful for your hackathon's *data augmentation*
problem: see `weak_label_corpus()` at the bottom, which lets you run this
heuristic labeller over a big pile of raw, unlabeled NepGlish text to
bootstrap a much larger (weakly-labeled) training set than your current
~27 unique sentences, which you can then hand-correct or use as-is to
train/fine-tune a proper ML classifier.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from typing import Literal

try:
    from wordfreq import zipf_frequency
    _HAS_WORDFREQ = True
except ImportError:  # graceful degradation if wordfreq isn't installed
    _HAS_WORDFREQ = False


# --------------------------------------------------------------------------
# 1. Romanized Nepali lexicon
# --------------------------------------------------------------------------
# Curated, high-frequency, closed+open class words. Closed-class words
# (pronouns, postpositions, particles, copulas) are the single strongest
# signal for romanized Nepali because they have no English homographs and
# appear in almost every Nepali sentence regardless of domain.

NE_PRONOUNS = {
    "ma", "hami", "hamiharu", "timi", "timiharu", "tapai", "tapain", "tapaiharu",
    "u", "uni", "uniharu", "yo", "tyo", "yiniharu", "tiniharu", "yaha", "tyaha",
    "mero", "mera", "meri", "hamro", "hamra", "timro", "timra", "tapaiko",
    "usko", "uniko", "unko", "yesko", "tesko", "aphno", "aफ्नो",
}

NE_POSTPOSITIONS_PARTICLES = {
    "ma", "lai", "laai", "ko", "ki", "ka", "kaa", "dekhi", "samma", "sanga",
    "sangai", "bata", "bhanda", "ra", "tara", "ani", "ta", "ni", "pani",
    "matra", "chai", "nai", "jasto", "jasari", "jastai", "haru", "harule",
    "haruko", "harulai", "le", "hai", "hola", "vayo", "bhayo",
}

NE_VERBS_AUX = {
    "cha", "chha", "chhu", "chu", "chhau", "chhan", "chhin", "chhainan",
    "chaina", "chhaina", "chhaina", "hunchha", "huncha", "huncha", "hunxa",
    "hunxaina", "vaeko", "bhayeko", "bhako", "vako", "garne", "garchu",
    "garchhu", "garcha", "garxa", "garxu", "garnu", "garne", "gareko",
    "garya", "garyo", "gardai", "gardaicha", "gardai xa", "bhannu", "bhanyo",
    "bhandai", "bhanera", "khana", "khanu", "khayo", "khanchu", "khanxu",
    "khanxa", "janu", "jane", "jaane", "jancha", "janxa", "jancha", "janchu",
    "janxu", "gayo", "geko", "aune", "aunu", "aayo", "aaucha", "aauxa",
    "aaudai", "dinu", "dine", "dinchhu", "dinxu", "diyo", "linu", "line",
    "linchhu", "linxu", "liyo", "sakcha", "sakxa", "sakincha", "parcha",
    "parxa", "paryo", "lagcha", "lagxa", "lagyo",
}

NE_QUESTION_WORDS = {
    "k", "ke", "kina", "kasari", "kahile", "kaha", "kahaa", "kati", "kun",
    "kasto", "kasari", "ko", "kohi",
}

NE_COMMON = {
    "namaste", "dhanyabad", "malai", "timilai", "hajur", "thik", "thikai",
    "ramro", "ramailo", "sanchai", "sancho", "bholi", "aja", "hijo",
    "ahile", "pheri", "sabai", "dherai", "thorai", "ekdam", "sadhai",
    "kehi", "kunai", "arko", "yesari", "tesari", "vitra", "bhitra",
    "bahira", "maathi", "muni", "agadi", "pachadi", "najik", "tada",
    "sathi", "didi", "bhai", "dai", "bahini", "aama", "buba", "ghar",
    "kaam", "manche", "manxe", "manis", "kura", "kuro", "samasya",
    "problem", "paisa", "rupaiya", "rupiya", "rakam", "khata", "byaj",
    "rasid", "nagad", "sahi", "galat", "sajilo", "gaaro", "garo",
    "chito", "chaadai", "bistarai", "aile", "yestai", "testai",
    "lagi", "vannu", "vaneko", "vaneki", "bhaneko", "vane", "bhane",
    "vayera", "bhayera", "sakincha", "vayo", "vairaheko", "bhairaheko",
}

# Common Nepali morphological suffixes, romanized. Even for a totally
# unseen root word, these endings are a strong tell that the token is
# Nepali (verb conjugations & case markers). Checked with a minimum
# stem length so we don't false-positive on short English words
# (e.g. "cochha" no, but not flagging "cha" from "chapter").
NE_SUFFIXES = (
    "chha", "cha", "chu", "chhu", "chau", "chhau", "chan", "chhan",
    "yo", "eko", "eki", "eka", "dai", "digo", "nchha", "ncha", "nu",
    "ne", "haru", "laai", "lai", "sanga", "bata", "dekhi", "samma",
    "koi", "hola",
)

NE_LEXICON = (
    NE_PRONOUNS | NE_POSTPOSITIONS_PARTICLES | NE_VERBS_AUX
    | NE_QUESTION_WORDS | NE_COMMON
)


# --------------------------------------------------------------------------
# 2. Character n-gram fallback model (for OOV latin-script tokens)
# --------------------------------------------------------------------------
# Trained on-the-fly from the lexicon above vs. a seed list of common
# English words, so unseen tokens still get scored via phonotactic
# similarity instead of being ignored outright. This is a tiny, dependency
# -free Naive-Bayes-style bigram model -- not meant to replace a real
# trained classifier, just to make the rule-based tagger more robust.

_EN_SEED_WORDS = [
    "the", "is", "are", "and", "to", "you", "for", "have", "will", "with",
    "this", "that", "your", "account", "bank", "balance", "transfer",
    "money", "please", "thank", "want", "need", "check", "send", "receive",
    "today", "tomorrow", "yesterday", "help", "service", "customer", "card",
    "payment", "deposit", "withdraw", "loan", "interest", "branch", "online",
    "mobile", "app", "login", "password", "otp", "number", "amount",
]


def _char_bigrams(word: str) -> list[str]:
    w = f"^{word}$"
    return [w[i:i + 2] for i in range(len(w) - 1)]


def _build_bigram_model(words: set[str] | list[str]) -> Counter:
    counts: Counter = Counter()
    for w in words:
        counts.update(_char_bigrams(w))
    total = sum(counts.values()) or 1
    return Counter({k: v / total for k, v in counts.items()})


_NE_BIGRAM_MODEL = _build_bigram_model(NE_LEXICON)
_EN_BIGRAM_MODEL = _build_bigram_model(_EN_SEED_WORDS)


def _bigram_score(word: str, model: Counter) -> float:
    bigrams = _char_bigrams(word.lower())
    if not bigrams:
        return 0.0
    return sum(model.get(b, 1e-5) for b in bigrams) / len(bigrams)


# --------------------------------------------------------------------------
# 3. Word-level tagging
# --------------------------------------------------------------------------

Tag = Literal["NE", "EN", "OTHER", "UNK"]

_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_TOKEN_RE = re.compile(r"[A-Za-z]+|[\u0900-\u097F]+|\d+(?:[.,]\d+)?|[^\sA-Za-z\u0900-\u097F\d]+")


def _is_devanagari(token: str) -> bool:
    return bool(_DEVANAGARI_RE.search(token))


def _is_number_or_punct(token: str) -> bool:
    return bool(re.fullmatch(r"\d+(?:[.,]\d+)?|[^\w\s]+", token))


def _has_ne_suffix(word: str, min_stem_len: int = 2) -> bool:
    w = word.lower()
    for suf in NE_SUFFIXES:
        if w.endswith(suf) and len(w) - len(suf) >= min_stem_len:
            return True
    return False


def tag_token(token: str) -> Tag:
    """Classify a single token as NE / EN / OTHER / UNK."""
    if _is_number_or_punct(token):
        return "OTHER"
    if _is_devanagari(token):
        return "NE"

    w = token.lower()

    if w in NE_LEXICON:
        return "NE"

    en_zipf = zipf_frequency(w, "en") if _HAS_WORDFREQ else 0.0
    is_english_word = en_zipf >= 2.0  # filters out junk/near-zero-freq matches

    if _has_ne_suffix(w) and not is_english_word:
        return "NE"

    if is_english_word:
        return "EN"

    # OOV latin-script token -> fall back to the bigram phonotactic model
    ne_score = _bigram_score(w, _NE_BIGRAM_MODEL)
    en_score = _bigram_score(w, _EN_BIGRAM_MODEL)
    if max(ne_score, en_score) < 1e-4:
        return "UNK"
    return "NE" if ne_score > en_score else "EN"


def tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text)


# --------------------------------------------------------------------------
# 4. Sentence-level classification
# --------------------------------------------------------------------------

Label = Literal["English", "Nepali", "Nepglish", "Unknown"]


@dataclass
class LIDResult:
    text: str
    label: Label
    ne_ratio: float
    en_ratio: float
    tokens: list[str] = field(default_factory=list)
    tags: list[Tag] = field(default_factory=list)

    def __repr__(self) -> str:
        return (f"LIDResult(label={self.label!r}, "
                f"ne_ratio={self.ne_ratio:.2f}, en_ratio={self.en_ratio:.2f})")


def identify(text: str, ne_threshold: float = 0.85, en_threshold: float = 0.85) -> LIDResult:
    """
    Classify `text` as English / Nepali / Nepglish.

    ne_threshold / en_threshold: fraction of meaningful (NE+EN) tokens that
    must belong to one language for the sentence to be labeled as that pure
    language rather than "Nepglish". Lower these (e.g. to 0.7) if you want
    a single stray loanword to still count as pure Nepali/English; raise
    them for a stricter code-mixing definition.
    """
    text = unicodedata.normalize("NFC", text.strip())
    tokens = tokenize(text)
    tags = [tag_token(t) for t in tokens]

    ne_count = tags.count("NE")
    en_count = tags.count("EN")
    meaningful = ne_count + en_count

    if meaningful == 0:
        return LIDResult(text, "Unknown", 0.0, 0.0, tokens, tags)

    ne_ratio = ne_count / meaningful
    en_ratio = en_count / meaningful

    if ne_ratio >= ne_threshold:
        label: Label = "Nepali"
    elif en_ratio >= en_threshold:
        label = "English"
    else:
        label = "Nepglish"

    return LIDResult(text, label, ne_ratio, en_ratio, tokens, tags)


# --------------------------------------------------------------------------
# 5. Data augmentation helper for your hackathon dataset
# --------------------------------------------------------------------------

def weak_label_corpus(sentences: list[str], **kwargs) -> list[dict]:
    """
    Run the heuristic labeller over a list of raw, unlabeled sentences and
    return weak labels + confidence signal (ne_ratio/en_ratio spread).

    Use this to bulk-label scraped/synthetic NepGlish text (e.g. from
    Facebook/Twitter Nepali comments, banking chat logs, or LLM-generated
    paraphrases of your 27 seed sentences) so you have a much bigger
    training set to fine-tune or distill into a small ML/LID model. Sort
    by `confidence` and spot-check the low-confidence ones by hand rather
    than reviewing everything.
    """
    out = []
    for s in sentences:
        r = identify(s, **kwargs)
        confidence = abs(r.ne_ratio - r.en_ratio)  # 1.0 = unambiguous, 0.0 = 50/50 mix
        out.append({
            "text": s,
            "label": r.label,
            "ne_ratio": round(r.ne_ratio, 3),
            "en_ratio": round(r.en_ratio, 3),
            "confidence": round(confidence, 3),
        })
    return out


if __name__ == "__main__":
    samples = [
       "mahh bholii bank tira aaudaii xu",
       "hlo sir mero acount lock vayo",
       "pls unlock my acnt",
       "pls my accnt blk"
        
    ]
    for s in samples:
        r = identify(s)
        print(f"{r.label:9s} | ne={r.ne_ratio:.2f} en={r.en_ratio:.2f} | {s}")
        print("   tags:", list(zip(r.tokens, r.tags)))
