import React, { createContext, useContext, useState, useCallback } from 'react';
import { DarkTheme, LightTheme, Theme } from '../constants/colors';
import { ConfirmAction } from '../utils/nlu';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type Lang = 'auto' | 'en' | 'ne' | 'rom';
export type Persona = 'Asha' | 'Kiran';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

interface AppState {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;

  tab: 'home' | 'accounts' | 'cards' | 'hub';
  setTab: (tab: AppState['tab']) => void;

  masked: boolean;
  toggleMask: () => void;
  cardBlocked: boolean;
  setCardBlocked: (v: boolean) => void;

  voiceOpen: boolean;
  openVoice: () => void;
  closeVoice: () => void;

  vstate: VoiceState;
  setVstate: (s: VoiceState) => void;

  lang: Lang;
  setLang: (l: Lang) => void;

  persona: Persona;
  setPersona: (p: Persona) => void;

  speed: number;
  setSpeed: (s: number) => void;

  messages: Message[];
  pushMsg: (role: 'user' | 'bot', text: string) => void;
  clearMessages: () => void;

  card: 'bal' | 'atm' | null;
  setCard: (c: AppState['card']) => void;

  confirm: ConfirmAction | null;
  setConfirm: (c: ConfirmAction | null) => void;

  success: { title: string; sub: string } | null;
  setSuccess: (s: AppState['success']) => void;

  showOtpSheet: boolean;
  setShowOtpSheet: (v: boolean) => void;

  pendingAction: ConfirmAction | null;
  setPendingAction: (a: ConfirmAction | null) => void;

  userText: string;
  setUserText: (t: string) => void;

  micNote: string;
  setMicNote: (n: string) => void;

  historyOpen: boolean;
  setHistoryOpen: (v: boolean) => void;

  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;

  langMenuOpen: boolean;
  setLangMenuOpen: (v: boolean) => void;

  keyboardOpen: boolean;
  setKeyboardOpen: (v: boolean) => void;

  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [tab, setTab] = useState<AppState['tab']>('home');
  const [masked, setMasked] = useState(true);
  const [cardBlocked, setCardBlocked] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [vstate, setVstate] = useState<VoiceState>('idle');
  const [lang, setLang] = useState<Lang>('auto');
  const [persona, setPersona] = useState<Persona>('Asha');
  const [speed, setSpeed] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [card, setCard] = useState<AppState['card']>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [success, setSuccess] = useState<AppState['success']>(null);
  const [showOtpSheet, setShowOtpSheet] = useState(false);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);
  const [userText, setUserText] = useState('');
  const [micNote, setMicNote] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const theme = isDark ? DarkTheme : LightTheme;

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);
  const toggleMask = useCallback(() => setMasked((m) => !m), []);
  const openVoice = useCallback(() => {
    setVoiceOpen(true);
    setVstate('idle');
    setUserText('');
    setMessages([]);
    setCard(null);
    setConfirm(null);
    setSuccess(null);
    setMicNote('');
    setSettingsOpen(false);
  }, []);
  const closeVoice = useCallback(() => {
    setVoiceOpen(false);
    setVstate('idle');
    setShowOtpSheet(false);
    setSettingsOpen(false);
  }, []);
  const pushMsg = useCallback((role: 'user' | 'bot', text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + role, role, text },
    ]);
  }, []);
  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <AppContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        tab,
        setTab,
        masked,
        toggleMask,
        cardBlocked,
        setCardBlocked,
        voiceOpen,
        openVoice,
        closeVoice,
        vstate,
        setVstate,
        lang,
        setLang,
        persona,
        setPersona,
        speed,
        setSpeed,
        messages,
        pushMsg,
        clearMessages,
        card,
        setCard,
        confirm,
        setConfirm,
        success,
        setSuccess,
        showOtpSheet,
        setShowOtpSheet,
        pendingAction,
        setPendingAction,
        userText,
        setUserText,
        micNote,
        setMicNote,
        historyOpen,
        setHistoryOpen,
        settingsOpen,
        setSettingsOpen,
        langMenuOpen,
        setLangMenuOpen,
        keyboardOpen,
        setKeyboardOpen,
        ttsEnabled,
        setTtsEnabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
