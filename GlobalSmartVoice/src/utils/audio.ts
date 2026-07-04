import { File, Paths } from 'expo-file-system';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Hermes has no global atob/Buffer, so base64 is decoded by hand.
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const byteLength = Math.floor((clean.length * 6) / 8);
  const bytes = new Uint8Array(byteLength);

  let bitBuffer = 0;
  let bitCount = 0;
  let byteIndex = 0;

  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i]);
    if (value === -1) continue;
    bitBuffer = (bitBuffer << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes[byteIndex++] = (bitBuffer >> bitCount) & 0xff;
    }
  }

  return bytes;
}

function writeBase64ToCacheFile(base64: string, filename: string): string {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(base64ToUint8Array(base64));
  return file.uri;
}

/**
 * Writes a base64-encoded WAV blob to a temp file and plays it once.
 * Resolves when playback finishes (or immediately on playback error).
 * `onReady` (if given) receives a `stop()` callback so the caller can cut
 * playback short, e.g. when the user taps the mic again mid-reply.
 */
export function playBase64Wav(base64: string, onReady?: (stop: () => void) => void): Promise<void> {
  return new Promise((resolve) => {
    let player: AudioPlayer;
    try {
      const uri = writeBase64ToCacheFile(base64, `voice-reply-${Date.now()}.wav`);
      player = createAudioPlayer(uri);
    } catch (err) {
      console.error('[audio] failed to prepare playback:', err);
      resolve();
      return;
    }

    const finish = () => {
      clearTimeout(safetyTimer);
      subscription.remove();
      player.remove();
      resolve();
    };

    // Guards against a corrupt/stuck stream that never emits didJustFinish.
    const safetyTimer = setTimeout(finish, 30_000);

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) finish();
    });

    onReady?.(finish);
    player.play();
  });
}
