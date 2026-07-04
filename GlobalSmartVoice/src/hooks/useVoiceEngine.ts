import React, { useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useApp, VoiceState } from './useAppContext';
import { processQuery, detectLang, ConfirmAction } from '../utils/nlu';
import { apiRequest, ApiError } from '../api/client';

interface ConverseResponse {
  text: string;
  audio?: string; // optional — server may still send it but we now use on-device TTS
  mock?: boolean;
}

export function useVoiceEngine() {
  const {
    lang, persona, speed, vstate, setVstate,
    pushMsg, setCard, setConfirm, setSuccess,
    setUserText, setMicNote, userText,
    setShowOtpSheet, setPendingAction,
    setConfirm: storeConfirm,
    setCardBlocked,
    ttsEnabled,
  } = useApp();

  const stopPlaybackRef = useRef<(() => void) | null>(null);

  const stopAll = useCallback(() => {
    try { Speech.stop(); } catch (_) {}
    stopPlaybackRef.current?.();
    stopPlaybackRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, l: string) => {
      const done = () => setVstate('idle');
      setVstate('speaking');
      const langMap: Record<string, string> = { ne: 'ne-NP', rom: 'hi-IN', en: 'en-IN', auto: 'en-IN' };
      const speechLang = langMap[l] || 'en-IN';
      Speech.speak(text, {
        language: speechLang,
        pitch: persona === 'Asha' ? 1.12 : 0.85,
        rate: speed,
        onDone: done,
        onError: done,
        onStopped: done,
      });
    },
    [persona, speed, setVstate]
  );

  const finish = useCallback(
    (c: ConfirmAction) => {
      if (c.type === 'block') setCardBlocked(true);
      pushMsg('bot', c.done.speak);
      setConfirm(null);
      setShowOtpSheet(false);
      setSuccess({ title: c.done.title, sub: c.done.sub });
      if (ttsEnabled) speak(c.done.speak, c.lang);
      else setVstate('idle');
    },
    [ttsEnabled, pushMsg, setConfirm, setSuccess, setShowOtpSheet, setCardBlocked, speak, setVstate]
  );

  const respond = useCallback(
    async (text: string) => {
      const L =
        lang === 'auto'
          ? detectLang(text)
          : lang === 'rom'
          ? detectLang(text) === 'ne' ? 'ne' : 'rom'
          : lang;

      try {
        const result = await apiRequest<ConverseResponse>('/voice/converse', {
          method: 'POST',
          body: { text },
        });
        pushMsg('bot', result.text);
        if (ttsEnabled) {
          // On-device TTS via expo-speech (server no longer synthesises audio)
          speak(result.text, L);
        } else {
          setVstate('idle');
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Something went wrong reaching the assistant. Please try again.';
        pushMsg('bot', message);
        if (ttsEnabled) speak(message, L);
        else setVstate('idle');
      }
    },
    [lang, ttsEnabled, pushMsg, setVstate, speak]
  );

  const process = useCallback(
    (text: string) => {
      pushMsg('user', text);
      setUserText('');
      setVstate('thinking');
      setCard(null);
      setConfirm(null);
      setSuccess(null);
      setMicNote('');
      respond(text);
    },
    [pushMsg, setUserText, setVstate, setCard, setConfirm, setSuccess, setMicNote, respond]
  );

  const cancelAction = useCallback(
    (currentConfirm: ConfirmAction | null) => {
      if (!currentConfirm) return;
      const { reply } = processQuery('cancel', currentConfirm.lang);
      const cancelText =
        currentConfirm.lang === 'ne'
          ? 'हुन्छ, रद्द गरियो। केही भएन।'
          : currentConfirm.lang === 'rom'
          ? 'Hunchha, cancel bhayo. Kehi bhayena.'
          : 'Okay, cancelled. Nothing was done.';
      pushMsg('bot', cancelText);
      setConfirm(null);
      speak(cancelText, currentConfirm.lang);
    },
    [pushMsg, setConfirm, speak]
  );

  const confirmAction = useCallback(
    (currentConfirm: ConfirmAction | null) => {
      if (!currentConfirm) return;
      if (currentConfirm.needsOtp) {
        setPendingAction(currentConfirm);
        setShowOtpSheet(true);
      } else {
        finish(currentConfirm);
      }
    },
    [setPendingAction, setShowOtpSheet, finish]
  );

  return { process, speak, stopAll, finish, cancelAction, confirmAction };
}
