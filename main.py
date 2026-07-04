
import json
import random
import sqlite3
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from resemblyzer import VoiceEncoder, preprocess_wav

# --------------------------------------------------------------------------
# ONE-TIME SETUP (runs when the server starts, not on every request)
# --------------------------------------------------------------------------

app = FastAPI(title="Voice Auth API")

# CORS = allows a webpage (the frontend) to call this API from a browser.
# "*" means "allow any origin" — fine for a hackathon demo, but in a real
# product you'd lock this down to your actual frontend's domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).parent / "voiceauth.db"

# We load the voice model ONCE here, not inside each request function.
# Loading it takes a moment; reusing the same loaded model for every
# request is what makes verification feel instant.
encoder = VoiceEncoder()

# --- These two numbers are the ones you should tune using test_pipeline.py ---

# Minimum seconds of detected speech we require. Same reasoning as the
# test script: anything shorter gives an unstable voiceprint, which is
# the #1 cause of inconsistent-looking scores.
MIN_SPEECH_SECONDS = 2.0

# The similarity score above which we call it a match. Don't guess this —
# run test_pipeline.py with your own voice vs someone else's and use the
# "suggested threshold" it prints out.
MATCH_THRESHOLD = 0.80

# Random phrases shown on the verify screen. Forcing the user to say a
# fresh, unpredictable phrase each time means a recorded/replayed clip of
# a PAST session can't be reused to fake a login (a basic anti-replay
# measure — not bulletproof, but stops the easiest attack).
CHALLENGE_PHRASES = [
    "seven falcon river", "orange marble thunder", "velvet compass north",
    "silver lantern eight", "quiet harbor three", "golden tiger echo",
]


def get_db():
    """
    Opens a connection to the SQLite database file, creating the table if
    it doesn't exist yet. We store the voiceprint as a JSON string because
    SQLite doesn't have a native "list of numbers" column type — this is
    the simplest way to store/retrieve a numpy array's worth of numbers.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS voiceprints (
            client_id TEXT PRIMARY KEY,
            embedding TEXT NOT NULL
        )"""
    )
    return conn


# --------------------------------------------------------------------------
# AUDIO PROCESSING HELPERS
# --------------------------------------------------------------------------

def convert_to_wav(raw_bytes: bytes) -> Path:
    """
    Browsers record audio as webm/opus, not wav. Resemblyzer needs wav.
    ffmpeg does this conversion. We use temp files because ffmpeg works
    with file paths, not raw bytes in memory.
    """
    in_file = tempfile.NamedTemporaryFile(suffix=".input", delete=False)
    in_file.write(raw_bytes)
    in_file.close()

    out_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name

    result = subprocess.run(
        ["ffmpeg", "-y", "-i", in_file.name, "-ar", "16000", "-ac", "1", out_path],
        capture_output=True,
    )
    if result.returncode != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read audio (is it a valid recording?): "
                    f"{result.stderr.decode(errors='ignore')[-200:]}",
        )
    return Path(out_path)


def audio_to_embedding(raw_bytes: bytes) -> tuple[np.ndarray, float]:
    """
    Full pipeline: raw browser audio -> wav -> trimmed speech -> voiceprint.
    Returns the voiceprint AND how many seconds of speech we found, so the
    caller can enforce the minimum-duration rule and tell the user why a
    request was rejected instead of just returning a confusing low score.
    """
    wav_path = convert_to_wav(raw_bytes)
    wav = preprocess_wav(wav_path)  # trims silence, normalizes volume, resamples
    speech_seconds = len(wav) / 16000

    if speech_seconds < MIN_SPEECH_SECONDS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only detected {speech_seconds:.1f}s of speech, need at least "
                f"{MIN_SPEECH_SECONDS}s. Please speak a bit longer and clearly, "
                f"in a quiet room."
            ),
        )

    embedding = encoder.embed_utterance(wav)
    return embedding, speech_seconds


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Same single line of math as the test script — kept identical on purpose."""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# --------------------------------------------------------------------------
# ENDPOINTS
# --------------------------------------------------------------------------

@app.get("/challenge")
def get_challenge():
    """Frontend calls this before recording a verify attempt, to get a fresh phrase."""
    return {"phrase": random.choice(CHALLENGE_PHRASES)}


@app.post("/enroll")
async def enroll(client_id: str = Form(...), files: list[UploadFile] = File(...)):
    """
    Registers a voiceprint for a client_id.

    WHY MULTIPLE FILES: a single recording can catch someone mid-cough, too
    close to the mic, whatever. Averaging 2-3 embeddings together smooths
    out that noise and gives a more stable "center point" for their voice.
    This is one of the biggest levers against inconsistent scores later —
    don't skip it by only recording once.
    """
    client_id = client_id.strip().lower()
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id is required.")
    if len(files) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least 2 recordings for a stable voiceprint.",
        )

    embeddings = []
    for f in files:
        raw = await f.read()
        embedding, _ = audio_to_embedding(raw)
        embeddings.append(embedding)

    # The averaged embedding IS the stored voiceprint.
    voiceprint = np.mean(embeddings, axis=0)

    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO voiceprints (client_id, embedding) VALUES (?, ?)",
        (client_id, json.dumps(voiceprint.tolist())),
    )
    conn.commit()
    conn.close()

    return {"status": "enrolled", "client_id": client_id, "samples_used": len(files)}


@app.post("/verify")
async def verify(client_id: str = Form(...), file: UploadFile = File(...)):
    """
    Compares a new recording against the stored voiceprint for client_id.
    Returns the raw similarity score too (not just true/false) so the
    frontend can show a confidence readout instead of a black-box result —
    that transparency is what makes it obvious WHY a login passed or failed,
    instead of it feeling like random chaos.
    """
    client_id = client_id.strip().lower()

    conn = get_db()
    row = conn.execute(
        "SELECT embedding FROM voiceprints WHERE client_id = ?", (client_id,)
    ).fetchone()
    conn.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"No voiceprint found for '{client_id}'. Enroll first.",
        )

    stored_embedding = np.array(json.loads(row[0]))

    raw = await file.read()
    attempt_embedding, speech_seconds = audio_to_embedding(raw)

    score = cosine_similarity(stored_embedding, attempt_embedding)
    match = score >= MATCH_THRESHOLD

    return {
        "match": match,
        "similarity": round(score, 4),
        "threshold": MATCH_THRESHOLD,
        "speech_seconds_detected": round(speech_seconds, 1),
    }


@app.get("/clients")
def list_clients():
    """Debug helper: see who's enrolled. Useful during testing, remove/protect in production."""
    conn = get_db()
    rows = conn.execute("SELECT client_id FROM voiceprints").fetchall()
    conn.close()
    return {"clients": [r[0] for r in rows]}


@app.delete("/clients/{client_id}")
def delete_client(client_id: str):
    """Debug helper: reset a client's enrollment during testing."""
    conn = get_db()
    conn.execute("DELETE FROM voiceprints WHERE client_id = ?", (client_id.strip().lower(),))
    conn.commit()
    conn.close()
    return {"status": "deleted", "client_id": client_id}


@app.get("/")
def root():
    return {"status": "ok", "message": "Voice Auth API is running."}
