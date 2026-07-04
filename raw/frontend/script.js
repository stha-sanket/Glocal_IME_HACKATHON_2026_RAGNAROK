const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("tts-form");
const input = document.getElementById("user-input");
const btn = document.getElementById("speak-btn");
const player = document.getElementById("player");
const statusDiv = document.getElementById("status");

function setStatus(msg) {
  statusDiv.textContent = msg;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  btn.disabled = true;
  setStatus("Generating audio blob...");

  try {
    const res = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    player.src = audioUrl;
    player.play();
    
    setStatus("Playing audio...");
  } catch (err) {
    console.error(err);
    setStatus("Error generating audio.");
  } finally {
    btn.disabled = false;
  }
});
