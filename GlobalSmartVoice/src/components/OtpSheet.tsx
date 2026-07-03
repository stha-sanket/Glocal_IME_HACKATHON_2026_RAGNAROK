import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../hooks/useAppContext';
import { useVoiceEngine } from '../hooks/useVoiceEngine';

const OTP_LENGTH = 6;

export function OtpSheet() {
  const { theme, showOtpSheet, setShowOtpSheet, pendingAction } = useApp();
  const { finish } = useVoiceEngine();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  // Auto-focus first field when sheet opens
  useEffect(() => {
    if (showOtpSheet) {
      setDigits(Array(OTP_LENGTH).fill(''));
      setBusy(false);
      setStatus('');
      setTimeout(() => inputs.current[0]?.focus(), 150);
    }
  }, [showOtpSheet]);

  if (!showOtpSheet) return null;

  const focusNext = (index: number) => {
    if (index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };
  const focusPrev = (index: number) => {
    if (index > 0) inputs.current[index - 1]?.focus();
  };

  const handleChange = (text: string, index: number) => {
    if (busy) return;
    // Accept only single digit
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit) {
      focusNext(index);
    }

    // Check completion
    const full = next.join('');
    if (full.length === OTP_LENGTH && next.every(d => d !== '')) {
      setBusy(true);
      setStatus('Verifying…');
      setTimeout(() => {
        setBusy(false);
        setDigits(Array(OTP_LENGTH).fill(''));
        setStatus('');
        if (pendingAction) finish(pendingAction);
      }, 1100);
    } else {
      setStatus('');
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '') {
      focusPrev(index);
    }
  };

  const handleCancel = () => {
    setShowOtpSheet(false);
    setDigits(Array(OTP_LENGTH).fill(''));
    setStatus('');
  };

  return (
    <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={{ alignItems: 'center' }}>
        {/* Shield icon */}
        <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"
          stroke={theme.cta} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ marginBottom: 6 }}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>

        <Text style={[styles.title, { color: theme.ink }]}>Enter OTP to verify</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>
          Sent by SMS to +977 97••••2293 · Demo: any 6 digits
        </Text>

        {/* 6 OTP input boxes */}
        <View style={styles.inputRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el; }}
              style={[
                styles.box,
                {
                  backgroundColor: theme.tile,
                  borderColor: digit ? theme.cta : theme.line,
                  color: theme.ink,
                },
                busy && { opacity: 0.5 },
              ]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor={theme.cta}
              editable={!busy}
              returnKeyType="done"
              autoComplete="one-time-code"  // iOS autofill
            />
          ))}
        </View>

        {/* Status / error */}
        <Text style={[styles.status, { color: busy ? theme.cta : theme.muted }]}>
          {status}
        </Text>
      </View>

      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
        <Text style={[styles.cancel, { color: theme.muted }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 17,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 14,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '700',
  },
  status: {
    minHeight: 18,
    fontSize: 12.5,
    marginBottom: 4,
    fontWeight: '500',
  },
  cancelBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  cancel: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 4,
  },
});
