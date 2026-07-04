# Voice Authentication — Run Sequence

Follow these steps IN ORDER. Do not skip step 2 — it's what prevents the
"score doesn't match" chaos.

## Prerequisites (one-time)

1. Install ffmpeg (not a python package, a system program):
   - Mac:     `brew install ffmpeg`
   - Ubuntu:  `sudo apt install ffmpeg`
   - Windows: download from ffmpeg.org, add to PATH

2. Install python packages:
   ```bash
   cd backend
   pip install -r requirements.txt --break-system-packages
   ```
   (drop `--break-system-packages` on Mac/Windows if pip complains about it)

## Step 2 — Sanity-check the matching logic BEFORE running any server

1. Record 3 short clips (3-5 sec each) with any voice memo app on your
   phone/laptop. Export as .wav (or .mp3 — ffmpeg handles conversion):
   - `sample1.wav` — you, saying anything
   - `sample2.wav` — you again, saying something different
   - `other.wav`   — someone else, or a clearly different voice

2. Put them in the `backend/` folder and run:
   ```bash
   python3 test_pipeline.py sample1.wav sample2.wav other.wav
   ```

3. Read the output. You want to see a clear GAP between the "same person"
   score and the "different person" score (e.g. 0.95 vs 0.60). The script
   will suggest a `MATCH_THRESHOLD` value — copy that number into
   `main.py` (the `MATCH_THRESHOLD = ...` line) before moving on.

   If the gap is small or you get a warning about short/quiet clips,
   re-record longer (4+ sec), clearer samples and try again. Don't move
   to step 3 until this looks right — everything downstream depends on it.

## Step 3 — Run the backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Leave this running in its own terminal. Confirm it's up by visiting
`http://localhost:8000` in a browser — you should see a small JSON status message.

## Step 4 — Run the frontend

Just open `frontend/index.html` directly in your browser (double-click it).
No server needed for the frontend itself — it's a static file that calls
your backend at `http://localhost:8000`.

1. Go to the **Enroll** tab, type a client ID (e.g. `demo_client_001`),
   record 2 samples, click "Create voiceprint."
2. Go to the **Verify** tab, use the SAME client ID, record yourself
   saying the challenge phrase, click "Verify identity."
3. Try it again with someone else's voice using the same client ID —
   it should be denied.

## When you're ready to integrate this into a real app

Replace the plain-text `client_id` field with whatever identity your
real login/session system already provides — don't let a user type in
an arbitrary ID to check against (that defeats the purpose of
authentication). Everything else — the endpoints, the matching logic,
the database — can stay the same; only where `client_id` comes from changes.

## Debug endpoints (remove or protect before any real deployment)

- `GET /clients` — lists all enrolled client_ids
- `DELETE /clients/{client_id}` — wipes one client's voiceprint, useful
  for re-testing enrollment without restarting the server
