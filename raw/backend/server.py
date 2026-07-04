"""
server.py - Bilingual TTS backend (English + Nepali) using Piper (local, offline).

Voices:
  English : en_US-ryan-medium      (MALE)
  Nepali  : ne_NP-chitwan-medium   (MALE)

Both voices are used for correct pronunciation, but audio from each chunk is
volume-normalized to the same RMS level before stitching, so the full output
sounds like one consistent accent.

Endpoints:
  GET  /voices  - health check
  POST /tts     - text to WAV audio blob (auto bilingual, normalized)
"""

import audioop
import io
import os
import re
import wave
import traceback
import urllib.request

from flask import Flask, request, Response, jsonify, send_from_directory
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
VOICES_DIR   = os.path.join(BASE_DIR, "voices")
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

# ---------------------------------------------------------------------------
# Voice model definitions
# ---------------------------------------------------------------------------
VOICES = {
    "en_US-ryan-medium": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium",
    },
    "ne_NP-chitwan-medium": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ne/ne_NP/chitwan/medium",
    },
}

# ---------------------------------------------------------------------------
# Download voice files if missing
# ---------------------------------------------------------------------------
def ensure_voice(name: str):
    os.makedirs(VOICES_DIR, exist_ok=True)
    base_url = VOICES[name]["url"]
    for ext in (".onnx", ".onnx.json"):
        path = os.path.join(VOICES_DIR, name + ext)
        if not os.path.exists(path):
            url = f"{base_url}/{name}{ext}"
            print(f"[setup] Downloading {name}{ext} ...")
            urllib.request.urlretrieve(url, path)
            print(f"[setup] Saved -> {path}")

# ---------------------------------------------------------------------------
# Load voices at startup
# ---------------------------------------------------------------------------
from piper import PiperVoice  # noqa: E402

loaded_voices: dict = {}

for vname in VOICES:
    print(f"[setup] Loading {vname} ...")
    ensure_voice(vname)
    loaded_voices[vname] = PiperVoice.load(
        os.path.join(VOICES_DIR, f"{vname}.onnx"),
        config_path=os.path.join(VOICES_DIR, f"{vname}.onnx.json"),
    )
    print(f"[setup] {vname} ready OK")

print("\n[setup] All voices loaded.\n")

# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------
DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")

ROMAN_NEP = {
    "namaste", "namaskar", "dhanyabad",
    "kasto", "kasari", "kaha", "kahile", "kina",
    "chha", "chhan", "cha",
    "timi", "tapai", "tapain", "hami",
    "mero", "timro", "hamro",
    "ho", "haina",
    "pani", "ra", "ma", "ko", "le", "lai", "bata",
    "hola", "haru",
    "ramro", "naramro", "thik",
    "aaja", "bholi", "hijo",
    "khana", "khayo",
    "garchu", "garchau", "garna", "garnu",
    "bhanne", "kura",
    "nepal", "nepali",
    "sakincha", "hudai", "chhu",
    "hajur", "dai", "didi", "bhai", "baini",
    "garne", "gareko", "bhayeko", "cha", "thiyo",
    "gardai", "gardina", "garnus",
}


def is_purely_english(text: str) -> bool:
    """Return True only if the text has NO Devanagari and NO romanized Nepali words."""
    if DEVANAGARI_RE.search(text):
        return False
    words = re.findall(r"[a-zA-Z]+", text)
    for w in words:
        if w.lower() in ROMAN_NEP:
            return False
    return True


# ---------------------------------------------------------------------------
# Audio normalization helper
# ---------------------------------------------------------------------------
TARGET_RMS = 4000  # target loudness (16-bit PCM scale: 0–32767)
SAMPLE_WIDTH = 2   # 16-bit = 2 bytes


def normalize_chunk(raw_pcm: bytes, sampwidth: int = SAMPLE_WIDTH) -> bytes:
    """Scale raw PCM frames so that RMS matches TARGET_RMS."""
    rms = audioop.rms(raw_pcm, sampwidth)
    if rms == 0:
        return raw_pcm
    factor = TARGET_RMS / rms
    # audioop.mul factor must be a float
    normalized = audioop.mul(raw_pcm, sampwidth, factor)
    return normalized


def make_silence(framerate: int, duration_ms: int = 80, sampwidth: int = SAMPLE_WIDTH) -> bytes:
    """Return silent PCM bytes for the given duration in milliseconds."""
    n_samples = int(framerate * duration_ms / 1000)
    return b"\x00" * n_samples * sampwidth


# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)


@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_assets(filename):
    return send_from_directory(FRONTEND_DIR, filename)


@app.route("/voices", methods=["GET"])
def voices_health():
    return jsonify({"status": "ok", "voices": list(loaded_voices.keys())})


@app.route("/tts", methods=["POST"])
def tts():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return Response("Missing 'text' field", status=400)

    # Choose voice: English model ONLY if the whole sentence is pure English.
    # Any Devanagari or Romanized Nepali word → use Nepali model for everything.
    if is_purely_english(text):
        vname = "en_US-ryan-medium"
    else:
        vname = "ne_NP-chitwan-medium"

    safe = text.encode("ascii", errors="replace").decode("ascii")
    print(f"[tts] voice={vname}  text={safe!r}")

    voice = loaded_voices[vname]
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        voice.synthesize_wav(text, wf)

    return Response(
        buf.getvalue(),
        mimetype="audio/wav",
        headers={"X-Voice-Used": vname},
    )


@app.errorhandler(Exception)
def handle_error(e):
    return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


if __name__ == "__main__":
    print("Open this in your browser: http://127.0.0.1:5000\n")
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=False)
