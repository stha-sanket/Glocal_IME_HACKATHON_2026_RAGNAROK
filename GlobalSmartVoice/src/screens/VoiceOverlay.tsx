import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../hooks/useAppContext';
import { useVoiceEngine } from '../hooks/useVoiceEngine';
import { VoiceOrb } from '../components/VoiceOrb';
import { WaveformBars } from '../components/WaveformBars';
import { ConfirmCard, BalanceCard, AtmCard, SuccessCard } from '../components/ResultCards';
import { OtpSheet } from '../components/OtpSheet';
import { VOICE_CHIPS } from '../constants/data';
import { Lang } from '../hooks/useAppContext';

// Exact SVG icon helper matching the design's ic() helper
function Ic({ paths, size = 22, sw = 1.7, color = 'currentColor' }: {
  paths: string[]; size?: number; sw?: number; color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <Path key={i} d={d} />)}
    </Svg>
  );
}

// Icon path definitions from the design
const P = {
  globe:    ['M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  history:  ['M3 12a9 9 0 1 0 3-6.7', 'M3 5v5h5', 'M12 7v5l4 2'],
  sliders:  ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M2 14h4', 'M10 8h4', 'M18 16h4'],
  x:        ['M18 6L6 18', 'M6 6l12 12'],
  chevDown: ['M6 9l6 6 6-6'],
  keyboard: ['M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z', 'M6 10h.01', 'M9 10h.01', 'M12 10h.01', 'M15 10h.01', 'M18 10h.01', 'M6 14h12'],
  mic:      ['M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z', 'M19 10v1a7 7 0 0 1-14 0v-1', 'M12 18v4'],
  stop:     ['M7 7h10v10H7z'],
};

const LANG_OPTIONS: { label: string; k: Lang }[] = [
  { label: 'Auto', k: 'auto' },
  { label: 'English', k: 'en' },
  { label: 'नेपाली', k: 'ne' },
  { label: 'Rom. Nepali', k: 'rom' },
];

const LANG_LABELS: Record<Lang, string> = {
  auto: 'Auto', en: 'English', ne: 'नेपाली', rom: 'Rom. Nepali',
};

const STATE_LABELS: Record<string, string> = {
  idle: 'Tap the orb and speak',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
};

export default function VoiceOverlay() {
  const {
    theme, voiceOpen, closeVoice,
    vstate, setVstate,
    lang, setLang,
    persona, setPersona,
    speed, setSpeed,
    card, confirm, success, showOtpSheet,
    userText, micNote,
    historyOpen, setHistoryOpen,
    settingsOpen, setSettingsOpen,
    langMenuOpen, setLangMenuOpen,
    keyboardOpen, setKeyboardOpen,
    messages, isDark, toggleTheme,
  } = useApp();
  const { process, stopAll } = useVoiceEngine();
  const insets = useSafeAreaInsets();

  if (!voiceOpen) return null;

  const showOrb = !(card || confirm || success || showOtpSheet);

  const handleMic = () => {
    if (vstate === 'listening') { stopAll(); setVstate('idle'); return; }
    if (vstate === 'speaking') { stopAll(); setVstate('idle'); return; }
    setVstate('listening');
    // Demo: auto-process after 2s with placeholder text
    setTimeout(() => {
      process('Check my balance');
    }, 2000);
  };

  const say = (q: string) => { stopAll(); process(q); };

  return (
    <Modal visible={voiceOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeVoice}>
      <View style={[styles.overlay, { backgroundColor: theme.ov }]}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity style={[styles.langBtn, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => setLangMenuOpen(!langMenuOpen)}>
              <Ic paths={P.globe} size={16} sw={1.8} color={theme.ink} />
              <Text style={[styles.langBtnText, { color: theme.ink }]}>{LANG_LABELS[lang]}</Text>
            </TouchableOpacity>
            {langMenuOpen && (
              <View style={[styles.langMenu, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                {LANG_OPTIONS.map(o => (
                  <TouchableOpacity key={o.k} style={[styles.langRow, { backgroundColor: lang === o.k ? 'rgba(185,197,245,0.12)' : 'transparent' }]}
                    onPress={() => { setLang(o.k); setLangMenuOpen(false); }}>
                    <Text style={[styles.langRowText, { color: lang === o.k ? theme.cta : theme.ink, fontWeight: lang === o.k ? '700' : '500' }]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.topRight}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => { setHistoryOpen(true); setLangMenuOpen(false); }}>
                <Ic paths={P.history} size={18} sw={1.8} color={theme.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => setSettingsOpen(!settingsOpen)}>
                <Ic paths={P.sliders} size={18} sw={1.7} color={theme.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.tile }]} onPress={closeVoice}>
                <Ic paths={P.x} size={18} sw={2} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Stage ── */}
          <View style={styles.stage}>
            {showOrb && (
              <>
                <VoiceOrb onPress={handleMic} />
                <Text style={[styles.stateLabel, { color: theme.muted }]}>{STATE_LABELS[vstate]}</Text>
              </>
            )}
            {card === 'bal' && <BalanceCard />}
            {card === 'atm' && <AtmCard />}
            {confirm && !showOtpSheet && <ConfirmCard />}
            {showOtpSheet && <OtpSheet />}
            {success && <SuccessCard />}
            {vstate === 'listening' && !!userText && (
              <View style={[styles.interimBubble, { backgroundColor: theme.tile }]}>
                <Text style={{ fontSize: 14, color: theme.ink }}>{userText}</Text>
              </View>
            )}
          </View>

          {/* ── Bottom Controls ── */}
          <View style={[styles.bottomControls, { paddingBottom: Math.max(10, insets.bottom + 6) }]}>
            {keyboardOpen && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
                {VOICE_CHIPS.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => say(c.query)}>
                    <Text style={[styles.chipText, { color: theme.ink }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.controls}>
              <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: keyboardOpen ? theme.cta : theme.tile }]} onPress={() => setKeyboardOpen(!keyboardOpen)}>
                <Ic paths={P.keyboard} size={18} sw={1.7} color={keyboardOpen ? theme.ctaInk : theme.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.micBtn, {
                backgroundColor: vstate === 'listening' ? theme.red : undefined,
                shadowColor: '#8fa3ef',
              }]} onPress={handleMic} activeOpacity={0.85}>
                {vstate !== 'listening' && <View style={styles.micBtnGrad} />}
                <Ic paths={vstate === 'listening' ? P.stop : P.mic} size={26} sw={2} color={vstate === 'listening' ? '#fff' : '#121736'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: 'rgba(224,82,82,0.16)' }]} onPress={closeVoice}>
                <Ic paths={P.x} size={18} sw={2} color={theme.red} />
              </TouchableOpacity>
            </View>
            {!!micNote && <Text style={[styles.micNote, { color: theme.muted }]}>{micNote}</Text>}
          </View>

          {/* ── History Panel ── */}
          {historyOpen && (
            <View style={[styles.historyPanel, { backgroundColor: theme.ov }]}>
              <View style={[styles.historyHeader, { borderBottomColor: theme.line }]}>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]} onPress={() => setHistoryOpen(false)}>
                  <Ic paths={P.chevDown} size={20} sw={2} color={theme.ink} />
                </TouchableOpacity>
                <Text style={[styles.histTitle, { color: theme.ink }]}>Conversation history</Text>
                <View style={{ width: 38 }} />
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
                {messages.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.muted }]}>No conversation yet — tap the orb and speak.</Text>
                ) : messages.map(m => (
                  <View key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%' }}>
                    {m.role === 'bot' && <Text style={[styles.bubbleName, { color: theme.muted }]}>{persona}</Text>}
                    <View style={[styles.bubble, m.role === 'user'
                      ? { backgroundColor: theme.tile, borderTopRightRadius: 4 }
                      : { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1, borderTopLeftRadius: 4 }]}>
                      <Text style={{ fontSize: 14, color: theme.ink, lineHeight: 21 }}>{m.text}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Settings Sheet ── */}
          {settingsOpen && (
            <>
              <TouchableOpacity style={styles.settingsBg} onPress={() => setSettingsOpen(false)} activeOpacity={1} />
              <View style={[styles.settingsSheet, { backgroundColor: theme.surface }]}>
                <View style={[styles.sheetHandle, { backgroundColor: theme.line }]} />
                <Text style={[styles.settTitle, { color: theme.ink }]}>Voice settings</Text>

                <Text style={[styles.settSection, { color: theme.muted }]}>Voice persona</Text>
                <View style={styles.personaRow}>
                  {(['Asha', 'Kiran'] as const).map(p => (
                    <TouchableOpacity key={p} style={[styles.personaBtn, { borderColor: persona === p ? theme.cta : theme.line, backgroundColor: persona === p ? 'rgba(185,197,245,0.12)' : 'transparent' }]} onPress={() => setPersona(p)}>
                      <Text style={[styles.personaLabel, { color: theme.ink }]}>{p}</Text>
                      <Text style={[styles.personaSub, { color: theme.ink }]}>{p === 'Asha' ? 'Warm, higher voice' : 'Calm, deeper voice'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.settSection, { color: theme.muted }]}>Speech speed</Text>
                <View style={styles.speedRow}>
                  {([{ l: '0.8x slow', v: 0.8 }, { l: '1x normal', v: 1 }, { l: '1.25x fast', v: 1.25 }]).map(o => (
                    <TouchableOpacity key={o.v} style={[styles.speedBtn, { borderColor: speed === o.v ? theme.cta : theme.line, backgroundColor: speed === o.v ? 'rgba(185,197,245,0.12)' : 'transparent' }]} onPress={() => setSpeed(o.v)}>
                      <Text style={[styles.speedText, { color: theme.ink }]}>{o.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.themeRow}>
                  <Text style={[styles.themeLabel, { color: theme.ink }]}>Light theme</Text>
                  <TouchableOpacity style={[styles.toggle, { backgroundColor: isDark ? theme.tile : theme.cta }]} onPress={toggleTheme}>
                    <View style={[styles.knob, { transform: [{ translateX: isDark ? 0 : 20 }] }]} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 8, paddingBottom: 4, position: 'relative' },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  langBtnText: { fontSize: 13.5, fontWeight: '600' },
  langMenu: { position: 'absolute', top: 60, left: 16, zIndex: 20, borderRadius: 14, padding: 8, borderWidth: 1, minWidth: 150, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  langRow: { padding: 10, borderRadius: 10 },
  langRowText: { fontSize: 14 },
  topRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 8, gap: 0 },
  stateLabel: { fontSize: 14, marginTop: 22 },
  interimBubble: { borderRadius: 16, padding: 12, marginTop: 16, maxWidth: '88%' },
  bottomControls: { paddingHorizontal: 16, paddingBottom: 10 },
  chipsRow: { marginBottom: 2 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, flexShrink: 0 },
  chipText: { fontSize: 13 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 },
  ctrlBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 },
  micBtnGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#8fa3ef' },
  micNote: { fontSize: 11.5, textAlign: 'center', marginTop: 10 },
  historyPanel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: Platform.OS === 'android' ? 50 : 12, paddingBottom: 12, borderBottomWidth: 1 },
  histTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13.5, textAlign: 'center', marginTop: 60 },
  bubble: { borderRadius: 16, padding: 12, paddingVertical: 9 },
  bubbleName: { fontSize: 11, marginBottom: 3, marginLeft: 4 },
  settingsBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 5 },
  settingsSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 34 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  settTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  settSection: { fontSize: 12.5, fontWeight: '600', marginBottom: 8 },
  personaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  personaBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  personaLabel: { fontWeight: '700', fontSize: 14.5 },
  personaSub: { fontSize: 11.5, opacity: 0.75, marginTop: 2 },
  speedRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  speedBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  speedText: { fontSize: 13, fontWeight: '600' },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});
