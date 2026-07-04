# Conversational AI + Piper TTS — Test Project

A minimal but complete frontend/backend split for testing Piper text-to-speech
inside a conversational-AI flow.

```
piper_tts_project/
├── backend/
│   ├── server.py         Flask API: /chat (stub AI reply) + /tts (Piper audio) + /voices (health check)
│   └── requirements.txt
└── frontend/
    ├── index.html        Chat UI
    ├── style.css
    └── script.js         Calls /chat then /tts, plays the returned audio blob
```

## How it works (the full round trip)

```
You type message
      │
      ▼
POST /chat  ──────► (stubbed AI reply — swap in your real LLM here)
      │
      ▼
AI reply text
      │
      ▼
POST /tts   ──────► Piper generates WAV bytes
      │
      ▼
Browser gets response.blob() → creates an Object URL → <audio> plays it
```

`/chat` and `/tts` are deliberately separate endpoints. Your real conversational
AI logic only ever needs to produce text; TTS is a separate concern layered on
top. This makes it easy to later swap the stub in `/chat` for a real call to
your LLM (OpenAI, Anthropic, a local model, etc.) without touching the audio
code at all.

## Setup

1. **Install backend dependencies:**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

   (If pip complains about an externally managed environment, use a
   virtualenv, or add `--break-system-packages`.)

2. **Run the backend:**

   ```bash
   python server.py
   ```

   First run downloads the voice model (~60MB) into `backend/voices/` —
   only happens once. You'll see:

   ```
   Open this in your browser: http://127.0.0.1:5000
   ```

3. **Open the app:**

   Just visit `http://127.0.0.1:5000` — the backend also serves the frontend
   files directly, so you don't need a separate static server.

   (Alternatively, you can open `frontend/index.html` directly by
   double-clicking it — CORS is already enabled on the backend, so it'll
   still be able to call `http://127.0.0.1:5000/chat` and `/tts` from a
   `file://` page.)

4. **Test it:**

   Type a message and hit Send. You should see:
   - your message appear as a chat bubble
   - a stubbed AI reply appear underneath
   - the reply spoken out loud through the `<audio>` player

## Where to plug in your real AI

Open `backend/server.py` and find the `chat()` function — replace the
stubbed `reply_text` line with your actual model call. Everything else
(the `/tts` endpoint, the frontend, the audio playback) stays the same.

## Troubleshooting

- **`ModuleNotFoundError: piper`** → `pip install piper-tts` inside the
  same environment you're running `python server.py` from.
- **Model download fails** (no internet / blocked host) → manually download
  `en_US-lessac-medium.onnx` and `en_US-lessac-medium.onnx.json` from
  https://github.com/rhasspy/piper/blob/master/VOICES.md and place them in
  `backend/voices/`.
- **No sound plays** → check the browser console (F12) for errors, and make
  sure your OS volume / browser tab isn't muted. Also check the `status`
  text under the audio player — it reports the byte size received.
- **CORS errors** → make sure `flask-cors` installed correctly and the
  backend is actually running (the `CORS(app)` line in `server.py` handles
  this automatically).
- **Port 5000 already in use** → change `port=5000` at the bottom of
  `server.py` and update `API_BASE` in `frontend/script.js` to match.
