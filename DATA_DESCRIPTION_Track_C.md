# GIBL AI/ML Hackathon 2026 — Track C
## Multilingual Voice Banking Sahayak
# Data Description & Technical Reference Manual

---

> **Version:** 1.0
> **Domain:** Conversational AI | NLU | Multilingual NLP | Dialogue Management

---

## Table of Contents

1. [Dataset Overview](#1-dataset-overview)
2. [Why This Track Is Different](#2-why-this-track-is-different)
3. [Entity Relationship & Data Model](#3-entity-relationship--data-model)
4. [Table-by-Table Data Dictionary](#4-table-by-table-data-dictionary)
   - 4.1 nlu_intent_corpus
   - 4.2 conversation_sessions
   - 4.3 dialogue_turns
   - 4.4 action_logs
   - 4.5 stt_metadata
   - 4.6 tts_metadata
   - 4.7 entity_annotations
   - 4.8 language_detection_corpus
   - 4.9 nlu_evaluation_benchmark (JSON)
   - 4.10 sample_dialogues (JSON)
5. [Noise & Data Quality Reference](#5-noise--data-quality-reference)
6. [NepGlish — The Core Challenge](#6-nepglish--the-core-challenge)
7. [Intent Taxonomy & Entity Types](#7-intent-taxonomy--entity-types)
8. [Audio Dataset Strategy](#8-audio-dataset-strategy)
9. [Data Formats & Conventions](#9-data-formats--conventions)
10. [Evaluation Metrics Reference](#10-evaluation-metrics-reference)

---

## 1. Dataset Overview

### 1.1 Purpose

This dataset supports building a multilingual voice banking assistant — the **Voice
Banking Sahayak** — that allows Nepali bank customers to access banking services by
speaking naturally in **English**, **Nepali**, or **NepGlish** (code-switched
Nepali-English, the way most urban Nepalis actually speak).

The Sahayak must:
1. Transcribe spoken input (STT — not evaluated here, audio not included)
2. Understand intent and extract entities in NepGlish (NLU — primary task)
3. Maintain multi-turn conversation context
4. Execute banking actions via authenticated API calls
5. Respond naturally in the same language the user spoke (TTS — not evaluated here)

### 1.2 Scale Summary

| File | Rows / Records | Format | Size (raw) |
|---|---|---|---|
| nlu_intent_corpus.csv | 423 | CSV | 76 KB |
| conversation_sessions.csv | 50,000 | CSV | 8.0 MB |
| dialogue_turns.csv | 300,000 | CSV | 84 MB |
| action_logs.csv | 80,000 | CSV | 14 MB |
| stt_metadata.csv | 50,000 | CSV | 13 MB |
| tts_metadata.csv | 50,000 | CSV | 15 MB |
| entity_annotations.csv | 15,000 | CSV | 1.7 MB |
| language_detection_corpus.csv | 8,000 | CSV | 712 KB |
| nlu_evaluation_benchmark.json | 50 | JSON | 28 KB |
| sample_dialogues.json | 7 | JSON | 8 KB |

### 1.3 Key Design Decisions

- **No audio files are included.** STT and TTS are represented by metadata stubs only.
  See §8 for the audio collection strategy and how to extend the dataset.
- **NLU is the primary evaluable task.** Intent classification and entity extraction
  on NepGlish input is where models are scored.
- **NepGlish has no standard grammar.** The code-switching follows organic patterns
  from Nepali urban speech. There is no formal grammar rule — participants must handle
  arbitrary mid-sentence switches.
- **ASR errors are injected** into `nlu_intent_corpus.asr_text` to simulate realistic
  STT output. Models should be tested on `asr_text`, not `original_text`.
- **Multi-turn context** is essential — several intents (card_block, fund_transfer)
  require safety confirmation across multiple turns before executing.

---

## 2. Why This Track Is Different

Tracks A, B, and D all work with structured tabular data. Track C is fundamentally
different and harder in three ways:

### 2.1 Linguistic complexity
Standard NLU models are trained on English or Nepali separately. NepGlish requires a
model that handles both in the same sentence, with arbitrary switch points:

> *"Mero debit card harayo, please taratari block garna milcha? Last 3 transactions
> pani dekhaunus — aaja morning ma koi le use garyo jasto lagcha."*

There is no labeled NepGlish corpus in public domain. This dataset is one of the first
attempts to provide labeled NepGlish banking utterances.

### 2.2 Safety-critical action execution
Unlike a search or Q&A assistant, the Sahayak executes real banking operations. A missed
intent or hallucinated entity can result in:
- Wrong amount transferred
- Wrong card blocked
- Complaint logged for the wrong transaction

The dataset includes `safety_confirmation_required` and `safety_confirmed` flags
in `dialogue_turns` to model the confirmation flow that must precede destructive actions.

### 2.3 Graceful degradation
When a banking API fails mid-conversation (action_logs with `success = False`),
the assistant must:
1. Acknowledge the failure in natural NepGlish
2. Not lose conversation context
3. Offer an alternative (e.g. retry, escalate to human agent)

`action_logs.graceful_degradation` flags whether the system handled this correctly.

---

## 3. Entity Relationship & Data Model

```
conversation_sessions (1)
    │
    ├──── (1:0..N) dialogue_turns         [each turn in the conversation]
    │         ├── slots_json              [extracted entities per turn]
    │         └── action_triggered        [banking API called, if any]
    │
    ├──── (1:0..N) action_logs            [detailed banking API call records]
    │
    ├──── (1:0..1) stt_metadata           [audio metadata stub per session]
    │         (audio_available = False — schema only)
    │
    └──── (1:0..N) tts_metadata           [one TTS record per system response]
               (audio_available = False — schema only)

nlu_intent_corpus (standalone)
    └── used to TRAIN the NLU model
              ↓
    evaluated against nlu_evaluation_benchmark.json

entity_annotations (standalone)
    └── used to TRAIN the entity extraction model

language_detection_corpus (standalone)
    └── used to TRAIN the language identification model
```

**Primary session key:** `session_id` (format: `SESS-YYYYMMDD-XXXXXXXX`)

**Primary turn key:** `turn_id` (format: `TRN-XXXXXXXXXXXXXXXXXX`)

---

## 4. Table-by-Table Data Dictionary

---

### 4.1 `nlu_intent_corpus.csv`

**Description:** The primary NLU training dataset. Every row is one labeled utterance
with its intent, language mix, and both the original clean text and the ASR-corrupted
version. **Always train on `asr_text`, evaluate on `asr_text`** — real voice input
will have ASR errors. Use `original_text` only for analysis.

| Column | Type | Nullable | Valid Values / Format | Description |
|---|---|---|---|---|
| `utt_id` | STRING | No | `UTT-XXXXXXXX` | Unique utterance identifier. |
| `original_text` | STRING | No | NepGlish / Nepali / English text | Clean ground-truth utterance as a human would write it. May contain Devanagari script. |
| `asr_text` | STRING | No | Text with possible errors | Simulated ASR output with injected errors. **Use this for training and evaluation.** Errors include: character substitutions, word drops, transliteration inconsistencies. |
| `has_asr_error` | BOOL | No | `True`, `False` | True if `asr_text` differs from `original_text`. ~13% of rows. |
| `english_translation` | STRING | No | English text | Ground-truth English meaning of the utterance. Use for cross-lingual evaluation. |
| `intent` | ENUM | No | See §7 intent taxonomy | Ground truth intent label. 10 intent classes. |
| `language_mix` | ENUM | No | `nepali`, `nepglish`, `english` | Language composition classification. |
| `confidence` | FLOAT | No | 0.0–1.0 | Annotator confidence in the label. Original utterances: 0.88–0.99. Augmented: 0.72–0.97. |
| `annotator` | STRING | No | `annotator_NN` | Annotator who labeled this utterance. |
| `is_augmented` | BOOL | No | `True`, `False` | True if this row was generated by prefix/suffix augmentation. Augmented rows are lower confidence. |
| `source` | ENUM | No | `human_collected`, `augmented` | Data provenance. |

**Note on Devanagari:** Some `original_text` values contain Devanagari script (Nepali)
alongside Roman script. Ensure your data pipeline uses UTF-8 encoding.

```python
import pandas as pd
nlu = pd.read_csv("structured/nlu_intent_corpus.csv", encoding="utf-8")
# Always filter by confidence for training
train_set = nlu[nlu["confidence"] >= 0.80]
```

---

### 4.2 `conversation_sessions.csv`

**Description:** One row per voice banking session. A session begins when a customer
connects and ends when the call terminates or times out. Contains session-level
aggregates: total turns, average NLU confidence, ASR WER, outcome, and CSAT.

| Column | Type | Nullable | Valid Values / Format | Description |
|---|---|---|---|---|
| `session_id` | STRING | No | `SESS-YYYYMMDD-XXXXXXXX` | **Primary key.** Unique session identifier. |
| `start_time` | DATETIME | No | `YYYY-MM-DD HH:MM:SS.mmm` | Session start in UTC+5:45. |
| `end_time` | DATETIME | No | `YYYY-MM-DD HH:MM:SS.mmm` | Session end. |
| `duration_sec` | INT | No | Positive integer | Total session duration in seconds. |
| `channel` | ENUM | No | `phone_ivr`, `mobile_app_voice`, `web_chat_voice`, `branch_kiosk` | Origination channel. **Noise:** `phone_ivr` has 40% higher ASR WER than `mobile_app_voice`. |
| `locale` | STRING | No | `ne_NP`, `en_US`, `mixed` | Device/session locale setting. |
| `primary_language` | ENUM | No | `nepali`, `english` | Dominant language for the session. |
| `language_switches` | INT | No | 0–6 | How many times the user switched language mid-session. Values > 3 are associated with 2.4× higher fallback rate. |
| `account_id` | STRING | No | `ACC-NNNNNNN` | Linked bank account. |
| `branch` | STRING | No | Branch name | Nearest branch or call origin branch. |
| `total_turns` | INT | No | 1–14 | Total dialogue turns in the session. |
| `intents_detected` | INT | No | 1–5 | Unique intents successfully classified. |
| `successful_actions` | INT | No | 0–3 | Banking API calls that returned HTTP 200. |
| `fallback_count` | INT | No | 0–3 | Turns where NLU fell back (confidence < threshold). |
| `asr_word_error_rate` | FLOAT | No | 0.0–0.35 | Session-level average ASR WER. |
| `nlu_confidence_avg` | FLOAT | No | 0.55–0.98 | Average NLU intent confidence across turns. |
| `outcome` | ENUM | No | `completed`, `abandoned`, `transferred_agent`, `error`, `timed_out` | How the session ended. Distribution: completed 55%, abandoned 18%, transferred_agent 12%, error 8%, timed_out 7%. |
| `csat_score` | INT | Yes | 1–5 or empty | Customer satisfaction score. Only present for `completed` sessions. |
| `agent_escalated` | BOOL | No | `True`, `False` | True if transferred to a human agent. |
| `session_notes` | STRING | Yes | Free text or empty | Optional analyst notes. ~98% empty. |

---

### 4.3 `dialogue_turns.csv`

**Description:** One row per dialogue turn (one user utterance + one system response).
This is the largest table. Contains the NLU output, extracted slots, action triggered,
and system response for each turn. The `slots_json` field stores named entities
extracted from the user utterance as a JSON string.

| Column | Type | Nullable | Valid Values / Format | Description |
|---|---|---|---|---|
| `turn_id` | STRING | No | `TRN-XXXXXXXXXXXXXXXXXX` | Unique turn identifier. |
| `session_id` | STRING | No | FK to conversation_sessions | Session this turn belongs to. |
| `turn_number` | INT | No | 1–14 | Position of this turn in the session (1-indexed). |
| `timestamp` | DATETIME | No | `YYYY-MM-DD HH:MM:SS.mmm` | Turn timestamp. |
| `speaker` | ENUM | No | `user`, `system` | Who produced this turn. |
| `raw_asr_text` | STRING | No | Text string | Raw ASR output before normalization. Contains possible errors. |
| `normalized_text` | STRING | No | Text string | Text after normalization: number words to digits, removing filler words, standardizing Devanagari. |
| `detected_language` | ENUM | No | `nepali`, `nepglish`, `english` | Language detected for this turn. |
| `asr_confidence` | FLOAT | No | 0.45–0.99 | ASR model confidence for this utterance. Below 0.65 = likely transcription errors. |
| `intent` | ENUM | No | See §7 or `out_of_scope` | Predicted intent. `out_of_scope` for fallback turns. |
| `intent_confidence` | FLOAT | No | 0.10–0.99 | NLU model confidence in the intent prediction. Threshold for action: 0.70. |
| `slots_json` | STRING | No | JSON object string | Extracted entity slots as JSON. See examples in §4.3.1. |
| `is_fallback` | BOOL | No | `True`, `False` | True when `intent_confidence < 0.70` and system asked for clarification. |
| `action_triggered` | STRING | Yes | API action name or empty | Banking API called for this turn. Empty if no action taken. |
| `action_success` | BOOL | No | `True`, `False` | Whether the triggered action returned a success response. |
| `response_text` | STRING | No | NepGlish / Nepali / English text | System response in the user's detected language. |
| `response_language` | ENUM | No | `nepali`, `nepglish`, `english` | Language of the system response. |
| `latency_ms` | INT | No | 200–2800 | End-to-end latency for this turn in milliseconds. |
| `safety_confirmation_required` | BOOL | No | `True`, `False` | True for destructive actions (card_block, fund_transfer) requiring explicit user confirmation. |
| `safety_confirmed` | BOOL | No | `True`, `False` | True if the user confirmed the action. A confirmed destructive action that is then not executed is a safety failure. |

**4.3.1 slots_json examples:**

```json
// balance_inquiry
{"account_type": "savings"}

// card_block
{"card_type": "debit"}

// fund_transfer
{"amount": 5000, "recipient_account": "ACC-1234567"}

// mini_statement
{"count": 5, "period": "last week"}

// loan_inquiry
{"loan_type": "personal", "amount": 200000}

// greeting/out_of_scope
{}
```

---

### 4.4 `action_logs.csv`

**Description:** Detailed log of every banking API call made by the Action Agent.
One row per API call. Multiple calls may exist per session (e.g. OTP send, then
OTP verify, then card block). The `is_mid_conv_failure` flag identifies calls that
failed after the conversation was already in progress — the hardest graceful
degradation scenario.

| Column | Type | Nullable | Valid Values / Format | Description |
|---|---|---|---|---|
| `action_log_id` | STRING | No | `ACT-XXXXXXXXXXXXXXXXXX` | Unique action record. |
| `session_id` | STRING | No | FK to conversation_sessions | Calling session. |
| `timestamp` | DATETIME | No | `YYYY-MM-DD HH:MM:SS.mmm` | When the API was called. |
| `action_name` | STRING | No | Action name string | Human-readable action name. |
| `api_endpoint` | STRING | No | URL path string | Banking API endpoint called. |
| `http_method` | ENUM | No | `GET`, `POST` | HTTP method. |
| `http_status_code` | INT | No | 200, 400, 401, 403, 404, 429, 500 | HTTP response code. 200 = success. |
| `success` | BOOL | No | `True`, `False` | True only when `http_status_code = 200`. |
| `error_message` | STRING | Yes | Error description or empty | Human-readable error for non-200 responses. |
| `latency_ms` | INT | No | 80–3200 | API call latency in milliseconds. |
| `request_size_bytes` | INT | No | 100–2000 | Size of the API request payload. |
| `response_size_bytes` | INT | No | 50–5000 | Size of the API response. |
| `account_id` | STRING | No | `ACC-NNNNNNN` | Account the action was performed on. |
| `requires_otp` | BOOL | No | `True`, `False` | True for card_block, transfer_confirm, card_unblock. |
| `otp_verified` | BOOL | No | `True`, `False` | True if OTP was successfully verified before the call. |
| `is_mid_conv_failure` | BOOL | No | `True`, `False` | True if this failure occurred after at least one successful prior turn in the session. |
| `retry_count` | INT | No | 0–3 | Number of retry attempts. Non-zero only for failed calls. |
| `graceful_degradation` | BOOL | No | `True`, `False` | True if the system correctly handled the failure (acknowledged, maintained context, offered alternative). Only meaningful when `success = False`. |

**API endpoint reference:**

| action_name | endpoint | method | OTP required |
|---|---|---|---|
| balance_api | /api/v2/account/balance | GET | No |
| statement_api | /api/v2/account/statement | GET | No |
| block_card_api | /api/v2/card/block | POST | Yes |
| unblock_card_api | /api/v2/card/unblock | POST | Yes |
| transfer_initiate | /api/v2/transfer/initiate | POST | No |
| transfer_confirm | /api/v2/transfer/confirm | POST | Yes |
| complaint_create | /api/v2/complaint/create | POST | No |
| loan_eligibility | /api/v2/loan/eligibility | GET | No |
| account_details | /api/v2/account/details | GET | No |
| otp_send | /api/v2/otp/send | POST | No |
| otp_verify | /api/v2/otp/verify | POST | No |

---

### 4.5 `stt_metadata.csv`

**Description:** Audio metadata stubs — one record per voice utterance. **Audio files
are not included in this dataset.** `audio_available = False` for all rows. This table
defines the schema, noise characteristics, and model performance statistics for the
STT pipeline, so participants can plan their ASR integration without audio.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `audio_stub_id` | STRING | No | Unique stub identifier. Format: `STT-YYYYMMDD-XXXXXXXX`. |
| `session_id` | STRING | No | FK to conversation_sessions. |
| `timestamp` | DATETIME | No | Utterance timestamp. |
| `audio_duration_sec` | FLOAT | No | Duration of the audio clip in seconds. |
| `sample_rate_hz` | INT | No | Audio sample rate. Values: 8000 (phone), 16000 (standard), 22050, 44100. |
| `channel_count` | INT | No | Always 1 (mono). |
| `encoding` | ENUM | No | `wav`, `opus`, `mp3`, `webm`. |
| `audio_file_path` | STRING | No | Placeholder path. All begin with `audio/NOT_INCLUDED/`. |
| `language_code` | ENUM | No | `ne_NP`, `en_US`, `mixed`. |
| `detected_accent` | STRING | No | Speaker accent. Values: `Kathmandu_Nepali`, `Pokhara_Nepali`, `Terai_Nepali`, `Hill_Nepali`, `Indian_accent_Nepali`, `British_English`, `American_English`, `NepGlish_mixed`. |
| `noise_type` | ENUM | No | `clean`, `street_noise`, `bazar_noise`, `phone_static`, `traffic`, `wind`, `cafe`. |
| `snr_db` | FLOAT | No | Signal-to-noise ratio in dB. Values < 5 cause significant WER degradation. |
| `word_count_spoken` | INT | No | Number of words spoken in this utterance. |
| `asr_word_error_rate` | FLOAT | No | ASR word error rate for this utterance. Correlated with `snr_db` and `noise_type`. |
| `asr_char_error_rate` | FLOAT | No | ASR character error rate. Typically ~0.7× WER. |
| `asr_model_used` | STRING | No | Which ASR model produced the transcription. |
| `asr_latency_ms` | INT | No | ASR inference time in milliseconds. |
| `code_switch_count` | INT | No | Number of language switches detected in this utterance. |
| `nepglish_detected` | BOOL | No | True if code-switching was detected. |
| `audio_available` | BOOL | No | Always `False` in this dataset. |
| `note` | STRING | No | `"Audio file not included in this dataset. Schema only."` |

---

### 4.6 `tts_metadata.csv`

**Description:** Text-to-speech metadata stubs — one record per system response.
**Audio files are not included.** Defines the TTS pipeline schema and quality metrics.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `tts_stub_id` | STRING | No | Unique stub. Format: `TTS-YYYYMMDD-XXXXXXXX`. |
| `session_id` | STRING | No | FK to conversation_sessions. |
| `timestamp` | DATETIME | No | When the TTS response was generated. |
| `input_text` | STRING | No | Text string sent to TTS engine. |
| `input_language` | ENUM | No | `ne_NP`, `en_US`, `mixed`. |
| `char_count` | INT | No | Character count of `input_text`. |
| `word_count` | INT | No | Word count of `input_text`. |
| `tts_model` | STRING | No | TTS model used. Values: `coqui-ne-v2`, `google-cloud-ne`, `custom-nepglish-v1`. |
| `voice_id` | STRING | No | Speaker voice used. Values: `female_nepali_standard`, `male_nepali_standard`, `female_nepali_warm`, `male_english_neutral`, `female_nepglish_blend`. |
| `speech_rate` | FLOAT | No | Speaking rate multiplier (1.0 = normal). 0.85–1.15 range. |
| `audio_duration_sec` | FLOAT | No | Duration of the synthesized audio. |
| `audio_file_path` | STRING | No | Placeholder path. All begin with `audio/NOT_INCLUDED/`. |
| `tts_latency_ms` | INT | No | TTS inference time in milliseconds. |
| `mos_score` | FLOAT | No | Mean Opinion Score (naturalness) 1.0–5.0. Higher = more natural. Bank's threshold: ≥ 3.5. |
| `formality` | ENUM | No | `formal`, `semi_formal`, `informal`. Adjusted to match user's register. |
| `audio_available` | BOOL | No | Always `False` in this dataset. |

---

### 4.7 `entity_annotations.csv`

**Description:** Named entity recognition (NER) training data. One row per entity
occurrence, with character-level span annotations. Use to train the entity extraction
component of the NLU pipeline.

| Column | Type | Nullable | Valid Values / Format | Description |
|---|---|---|---|---|
| `annotation_id` | STRING | No | `ENT-XXXXXXXX` | Unique annotation identifier. |
| `utterance` | STRING | No | NepGlish / Nepali / English text | The utterance containing the entity. |
| `entity_type` | ENUM | No | See §7 entity types | Named entity type. |
| `entity_value` | STRING | No | Entity surface form | The actual entity text as it appears in the utterance. |
| `start_char` | INT | No | Non-negative integer | Character offset of entity start in `utterance`. -1 if substring match failed. |
| `end_char` | INT | No | Non-negative integer | Character offset of entity end. -1 if start failed. |
| `normalized_value` | STRING | No | Normalized form | Standardized entity value (e.g. `5 hajar` → `5000`, `ek lakh` → `100000`). |
| `language` | ENUM | No | `nepali`, `nepglish`, `english` | Language of the containing utterance. |
| `confidence` | FLOAT | No | 0.0–1.0 | Annotator confidence. |
| `annotator` | STRING | No | `annotator_NN` | Who annotated this. |
| `is_augmented` | BOOL | No | `True`, `False` | Augmented row or original. |

---

### 4.8 `language_detection_corpus.csv`

**Description:** Labeled corpus for training the language identification component.
Every row is a text sample with its true language label. Includes pure Nepali (Devanagari
script), pure English (Roman script), and NepGlish (mixed script, both in same sentence).

| Column | Type | Nullable | Valid Values / Format | Description |
|---|---|---|---|---|
| `sample_id` | STRING | No | `LD-XXXXXXXX` | Unique sample identifier. |
| `text` | STRING | No | Text in any language | Sample text for language identification. |
| `true_language` | ENUM | No | `nepali`, `nepglish`, `english` | Ground truth language label. |
| `has_devanagari` | BOOL | No | `True`, `False` | True if text contains Devanagari Unicode characters (U+0900–U+097F). |
| `has_latin` | BOOL | No | `True`, `False` | True if text contains ASCII alphabetic characters. |
| `word_count` | INT | No | Positive integer | Number of whitespace-separated tokens. |
| `code_switch_count` | INT | No | Non-negative integer | Number of script transitions (Devanagari ↔ Roman) in the text. |
| `annotator` | STRING | No | `annotator_NN` | Annotator who labeled this. |

---

### 4.9 `nlu_evaluation_benchmark.json`

**Description:** A gold-standard evaluation set of 50 test cases (5 per intent). This
is the held-out benchmark — **do not use for training**. Use it to measure your NLU
model's intent classification accuracy and cross-lingual performance.

```json
{
  "metadata": {
    "version": "1.0",
    "total_test_cases": 50,
    "description": "Gold-standard NLU evaluation set. Labels are ground truth."
  },
  "test_cases": [
    {
      "test_id": "BM-A1B2C3D4",
      "utterance": "Mero account ko balance kati cha?",
      "expected_intent": "balance_inquiry",
      "expected_lang": "nepali",
      "difficulty": "easy",
      "contains_devanagari": false,
      "is_code_switched": true
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `test_id` | STRING | Unique test case ID. |
| `utterance` | STRING | The input text to classify. |
| `expected_intent` | STRING | Ground truth intent. |
| `expected_lang` | STRING | Ground truth language mix. |
| `difficulty` | ENUM | `easy`, `medium`, `hard`. |
| `contains_devanagari` | BOOL | True if the text has Devanagari characters. |
| `is_code_switched` | BOOL | True if NepGlish mixing is present. |

---

### 4.10 `sample_dialogues.json` (in `conversation_samples/`)

**Description:** 7 fully worked example multi-turn conversations showing realistic
NepGlish banking dialogues. Use for qualitative evaluation, LLM fine-tuning, and
understanding the expected system behavior.

Dialogue scenarios included:
1. Card block — NepGlish, full OTP confirmation flow
2. Balance + mini statement — English, clean
3. Fund transfer — Nepali, entity extraction
4. ASR error handling — NepGlish, fallback + clarification
5. Complaint with human escalation — NepGlish
6. OTP retry flow — NepGlish, mid-conversation OTP failure
7. Loan inquiry — Nepali, multi-turn information gathering

---

## 5. Noise & Data Quality Reference

| Issue | Rate | Affected File | Recommended Handling |
|---|---|---|---|
| ASR character substitutions | 13% | nlu_intent_corpus (asr_text) | Train on `asr_text`, not `original_text`. Build robustness to common substitution patterns. |
| ASR word drops | ~3% | nlu_intent_corpus (asr_text) | N-gram overlap and intent keywords are more robust than exact string matching. |
| NLU fallback turns | 8% | dialogue_turns | Model should ask for clarification; do not guess below confidence threshold 0.70. |
| Action API failures | ~7% | action_logs | Test graceful degradation: does the system maintain context and offer retry? |
| Sessions abandoned mid-conversation | 18% | conversation_sessions | Incomplete sessions are valid training data for partial intent recognition. |
| Off-topic (out_of_scope) utterances | ~5% | dialogue_turns | Must be detected and handled without crashing the conversation flow. |
| OTP failures and retries | ~12% | action_logs | Multi-path OTP retry flow must be modeled in dialogue state. |
| Mid-conversation tool failures | ~30% of failed actions | action_logs | Hardest case: system must recover mid-dialogue without losing state. |
| Phone IVR channel WER 40% higher | — | stt_metadata | Segment by channel when reporting WER benchmarks. |
| Bazar/street noise (SNR < 5 dB) | ~15% of audio stubs | stt_metadata | WER jumps from 12% average to 31% in noisy conditions. |

### Hidden Patterns

| # | Pattern | How to find it | Impact |
|---|---|---|---|
| 1 | Sessions with `language_switches > 3` have 2.4× higher `fallback_count` | Groupby on conversation_sessions | NepGlish model degrades with complexity |
| 2 | Bazar/street noise causes WER to jump from 12% to 31% | stt_metadata: snr_db vs asr_word_error_rate | Key reason to invest in noise-robust ASR |
| 3 | `card_block` has 80% `safety_confirmation_required` — highest of all intents | dialogue_turns groupby intent | Safety design insight |
| 4 | OTP retry sessions in action_logs correlate with SIM-swap fraud in Track B | Join action_logs.session_id → account_id → Track B otp_logs | Cross-track signal |
| 5 | Nepali-only utterances have 15% higher NLU confidence than NepGlish on baseline models | nlu_intent_corpus: language_mix vs confidence | Quantifies NepGlish difficulty |
| 6 | `phone_ivr` channel has 40% higher WER than `mobile_app_voice` | stt_metadata: channel vs asr_word_error_rate | Channel-specific model tuning needed |
| 7 | `mid_conv_failure=True` + `graceful_degradation=False` → CSAT score = 1 | action_logs join conversation_sessions | Primary driver of poor experience |

---

## 6. NepGlish — The Core Challenge

### What is NepGlish?
NepGlish is the informal code-switched register spoken by urban Nepalis, particularly
in Kathmandu, Pokhara, and diaspora communities. It switches between Nepali grammar
and English vocabulary mid-sentence, without a formal grammar rule.

### Why it is hard for NLP
1. **No standard orthography.** Nepali words are written in Roman transliteration
   inconsistently: `garnus` / `garnu` / `garnuhos` are all valid spellings of the same
   word in Roman script.
2. **No public corpus.** Standard NLP datasets for Nepali exist (IndicNLP, AI4Bharat)
   but none cover code-switched banking speech.
3. **Grammar from both languages.** The verb often comes from Nepali; the noun from
   English: *"Balance check garnus please"* = Nepali verb + English noun.
4. **Devanagari mixed with Roman.** Some users write Devanagari in the same message:
   *"मेरो card block garnus"* — Devanagari `मेरो` (mero = my), then Roman.

### Code-switching patterns in the dataset

| Pattern | Example | Frequency |
|---|---|---|
| English noun + Nepali verb | `Balance check garnus` | ~40% of NepGlish |
| Nepali sentence + English filler | `Mero account ko balance kati cha please?` | ~25% |
| English phrase + Nepali confirmation | `Block my card, please... hain confirm garnus` | ~20% |
| Devanagari + Roman in same utterance | `मेरो card harayo, block garnus` | ~10% |
| Full sentence switch between turns | User speaks Nepali one turn, English next | ~5% |

### Recommended modeling approach
1. **Use a multilingual base model.** mBERT, XLM-RoBERTa, or IndicBERT handle both
   scripts and transfer well to NepGlish with fine-tuning.
2. **Transliterate Devanagari to Roman** as a preprocessing step. The `normalized_text`
   field in `dialogue_turns` applies this.
3. **Intent classification is more robust than NER** for NepGlish — intents can often
   be inferred from keywords even with garbled ASR. Entity extraction is harder.
4. **Confidence thresholds matter.** Set the fallback threshold at 0.70 for NepGlish
   (vs 0.80 for English) to reduce false fallbacks on genuine but ambiguous NepGlish.

---

## 7. Intent Taxonomy & Entity Types

### Intent Classes (10)

| Intent | Description | Example utterance | Requires confirmation? |
|---|---|---|---|
| `balance_inquiry` | Check account balance | `Mero account ko balance kati cha?` | No |
| `card_block` | Block a lost or stolen card | `Card harayo, block garnus` | **Yes — destructive** |
| `mini_statement` | View recent transactions | `Last 5 transactions dekhaunus` | No |
| `fund_transfer` | Transfer money | `5000 rupees transfer garnu cha` | **Yes — destructive** |
| `complaint_log` | Log a banking complaint | `Transaction fail bhayo complaint darj garnu cha` | No |
| `loan_inquiry` | Ask about loan products | `Personal loan ko interest kati cha?` | No |
| `account_info` | Get account details | `Mero account number ke ho?` | No |
| `greeting_farewell` | Session opening/closing | `Namaste` / `Dhanyabad, bye` | No |
| `otp_verification` | OTP related issues | `OTP aayena mero phone ma` | No |
| `card_unblock` | Unblock or replace card | `Card unblock garnus please` | **Yes — action** |

### Entity Types (10)

| Entity type | Description | NepGlish examples |
|---|---|---|
| `AMOUNT` | Monetary amount | `5000`, `5 hajar`, `ek lakh`, `50 hajar rupees` |
| `ACCOUNT_TYPE` | Type of bank account | `savings`, `current`, `FD`, `savings account` |
| `CARD_TYPE` | Card type | `debit`, `credit`, `ATM`, `Visa` |
| `TRANSFER_RECIPIENT` | Transfer destination | `mero daju`, `mero saathi`, `wife`, `aamaako account` |
| `LOAN_TYPE` | Loan product type | `personal`, `home`, `agricultural`, `vehicle` |
| `TIME_PERIOD` | Reference time period | `last 5`, `last month`, `last week`, `aaja` |
| `PHONE_NUMBER` | Phone number | `9841234567` |
| `COUNT` | Numerical count | `5`, `10`, `last 5` |
| `BENEFICIARY_NAME` | Person's name | `Ramesh Sharma`, `Sita Thapa` |
| `ACCOUNT_NUMBER` | Bank account number | `ACC-1234567` |

### Amount normalization rules for NepGlish

| Spoken form | Normalized value |
|---|---|
| `ek hajar` / `1 hajar` | `1000` |
| `paach hajar` / `5 hajar` / `5000` | `5000` |
| `das hajar` | `10000` |
| `ek lakh` / `1 lakh` | `100000` |
| `paach lakh` | `500000` |
| `ek karod` | `10000000` |

---

## 8. Audio Dataset Strategy

Audio files are **not included** in this dataset. This section explains why, what
you need to know about the audio pipeline, and how to extend the dataset if needed.

### Why audio is not included
1. Audio requires massive storage (50,000 utterances × avg 4s × 16kHz = ~6 GB raw)
2. Real voice recordings would require consent and PII scrubbing
3. Text-level NLU, dialogue management, and action execution can be built and
   evaluated without audio

### What the stt_metadata stubs tell you
Every `stt_metadata` row records the acoustic conditions that would have produced
the corresponding `dialogue_turns.asr_text`. The key fields for system design:

- `noise_type` and `snr_db` → which ASR model configuration to use
- `asr_word_error_rate` → baseline WER your NLU must tolerate
- `detected_accent` → which accent profile the ASR must handle
- `asr_model_used` → recommended model for each condition

### Recommended ASR models for NepGlish

| Condition | Recommended model | Expected WER |
|---|---|---|
| Clean Nepali | openai/whisper-large-v3 (fine-tuned on ne) | 8–12% |
| Noisy Nepali (bazar/street) | Custom noise-robust fine-tune on whisper | 22–35% |
| NepGlish code-switched | ai4bharat/indicwhisper + English fallback | 15–25% |
| Phone IVR (8kHz) | Whisper medium + phone noise augmentation | 20–30% |

### How to collect audio for this dataset
1. Recruit 200+ speakers covering all `detected_accent` values
2. Record each utterance in `nlu_intent_corpus.original_text` in the corresponding
   `noise_type` condition
3. Align audio files to `stt_metadata` using `audio_stub_id`
4. Update `audio_available = True` and populate `audio_file_path`

---

## 9. Data Formats & Conventions

| Aspect | Convention | Example |
|---|---|---|
| Session ID | `SESS-YYYYMMDD-XXXXXXXX` | `SESS-20260531-A9F3C1AB` |
| Turn ID | `TRN-XXXXXXXXXXXXXXXXXX` | `TRN-4F3A21B9C0D2E1F0A5` |
| Action Log ID | `ACT-XXXXXXXXXXXXXXXXXX` | `ACT-B3D2E1F04F3A21B9C0` |
| STT Stub ID | `STT-YYYYMMDD-XXXXXXXX` | `STT-20260531-B3D2E1F0` |
| TTS Stub ID | `TTS-YYYYMMDD-XXXXXXXX` | `TTS-20260531-C4E3F2G1` |
| Timestamps | `YYYY-MM-DD HH:MM:SS.mmm` UTC+5:45 | `2026-05-31 14:23:07.481` |
| Boolean | `True` / `False` | `True` |
| NULL handling | Empty cell in CSV | — |
| slots_json | JSON string in CSV cell | `{"amount": 5000, "recipient_account": "ACC-1234567"}` |
| Text encoding | UTF-8 throughout | Handles Devanagari + Roman |
| Devanagari Unicode range | U+0900 – U+097F | `मेरो` = U+092E U+0947 U+0930 U+094B |

### Loading with UTF-8 encoding

```python
import pandas as pd, json

# Always specify encoding for Nepali text
nlu    = pd.read_csv("structured/nlu_intent_corpus.csv", encoding="utf-8")
turns  = pd.read_csv("structured/dialogue_turns.csv",    encoding="utf-8")
lang   = pd.read_csv("structured/language_detection_corpus.csv", encoding="utf-8")

# Parse slots_json column
turns["slots"] = turns["slots_json"].apply(lambda x: json.loads(x) if x else {})

# Filter NepGlish only
nepglish = nlu[nlu["language_mix"] == "nepglish"]
```

### Joining sessions to turns and actions

```python
sessions = pd.read_csv("structured/conversation_sessions.csv", encoding="utf-8")
turns    = pd.read_csv("structured/dialogue_turns.csv",        encoding="utf-8")
actions  = pd.read_csv("structured/action_logs.csv",           encoding="utf-8")

# Full session view
sess_turns   = sessions.merge(turns,   on="session_id", how="left")
sess_actions = sessions.merge(actions, on="session_id", how="left")
```

---

## 10. Evaluation Metrics Reference

### 10.1 NLU Intent Classification

| Metric | Formula | Target | Notes |
|---|---|---|---|
| Intent Accuracy | Correct / Total | > 0.82 | On `nlu_evaluation_benchmark.json` |
| Macro F1 | Mean F1 across all 10 intents | > 0.78 | Handles class imbalance |
| NepGlish subset accuracy | Correct on `is_code_switched=True` | > 0.75 | Harder subset — key differentiator |
| Fallback precision | True fallbacks / flagged fallbacks | > 0.70 | Avoid over-triggering fallback |

### 10.2 Entity Extraction

| Metric | Target | Notes |
|---|---|---|
| Slot F1 (micro) | > 0.80 | Per entity type micro-average |
| Amount normalization accuracy | > 0.85 | `5 hajar` → `5000` etc. |
| NepGlish entity F1 | > 0.72 | Harder due to mixed script |

### 10.3 Dialogue Management

| Metric | Target | Notes |
|---|---|---|
| Task completion rate | > 0.72 | % of sessions where user goal was met |
| Safety confirmation accuracy | = 1.00 | No destructive action without confirmation |
| Graceful degradation rate | > 0.85 | % of API failures handled without conversation break |
| Average turns to completion | < 5 | Fewer turns = more efficient dialogue |

### 10.4 Bonus Criteria

| Criterion | Bonus | Evidence Required |
|---|---|---|
| Multi-turn context retention (refer back to earlier turns) | +5% | Evaluation dialogue with back-reference query |
| NepGlish entity normalization (`ek lakh` → `100000`) | +5% | entity_annotations accuracy on AMOUNT type |
| Graceful degradation on all 3 API failure modes | +5% | action_logs test set: 400/500/429 errors all handled |
| Devanagari + Roman mixed input handling | +3% | Test cases with Devanagari in nlu_evaluation_benchmark |
| Cross-track: OTP retry pattern from Track B detected | +2% | Correct handling of sim_swap_suspected scenario |

### 10.5 Submission Format

Submit a JSON file named `submission_[team_name].json` with this structure:

```json
{
  "nlu_predictions": [
    {
      "utt_id": "BM-A1B2C3D4",
      "predicted_intent": "balance_inquiry",
      "intent_confidence": 0.94,
      "predicted_language": "nepali",
      "extracted_slots": {"account_type": "savings"}
    }
  ],
  "dialogue_metrics": {
    "task_completion_rate": 0.76,
    "avg_turns_to_completion": 4.2,
    "graceful_degradation_rate": 0.88
  }
}
```

---

*This document is part of the GIBL AI/ML Hackathon 2026 — Track C dataset package.*
*Generated by the GIBL Hackathon Technical Committee, June 2026.*
