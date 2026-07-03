import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { useVoiceEngine } from '../hooks/useVoiceEngine';
import { ATM_ROWS } from '../constants/data';

export function ConfirmCard() {
  const { theme, confirm } = useApp();
  const { confirmAction, cancelAction } = useVoiceEngine();
  if (!confirm) return null;
  const isDanger = confirm.danger;
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: isDanger ? 'rgba(224,82,82,0.15)' : 'rgba(185,197,245,0.15)' }]}>
          <Ionicons name={isDanger ? 'shield' : confirm.type === 'topup' ? 'phone-portrait' : 'send'} size={20} color={isDanger ? theme.red : theme.cta} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.ink }]}>{confirm.title}</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>Voice alone never authorizes this — confirm on screen.</Text>
        </View>
      </View>
      {confirm.rows.map((r, i) => (
        <View key={i} style={[styles.row, { borderBottomColor: theme.line }]}>
          <Text style={[styles.rowKey, { color: theme.muted }]}>{r.k}</Text>
          <Text style={[styles.rowVal, { color: theme.ink }]}>{r.v}</Text>
        </View>
      ))}
      <View style={styles.btns}>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.tile }]} onPress={() => cancelAction(confirm)}>
          <Text style={[styles.btnText, { color: theme.ink }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: isDanger ? theme.red : theme.cta }]} onPress={() => confirmAction(confirm)}>
          <Text style={[styles.btnText, { color: isDanger ? '#fff' : theme.ctaInk }]}>{confirm.btn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BalanceCard() {
  const { theme } = useApp();
  return (
    <View style={[styles.balCard, { backgroundColor: theme.blue }]}>
      <Text style={styles.balTitle}>Global Mobile Banking Savings Account (NPR)</Text>
      <Text style={styles.balAcct}>13408010000408</Text>
      <Text style={styles.balAmt}>Rs. 84,560.84</Text>
      <Text style={styles.balSub}>Available Balance · 2.75% p.a.</Text>
    </View>
  );
}

export function AtmCard() {
  const { theme } = useApp();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      {ATM_ROWS.map((a, i) => (
        <View key={a.id} style={[styles.atmRow, { borderBottomColor: theme.line, borderBottomWidth: i < ATM_ROWS.length - 1 ? 1 : 0 }]}>
          <Ionicons name="location" size={20} color={theme.cta} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.atmName, { color: theme.ink }]}>{a.name}</Text>
            <Text style={[styles.atmSub, { color: theme.muted }]}>{a.sub}</Text>
          </View>
          <Text style={[styles.atmDist, { color: theme.ink }]}>{a.dist}</Text>
        </View>
      ))}
    </View>
  );
}

export function SuccessCard() {
  const { theme, success } = useApp();
  if (!success) return null;
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line, alignItems: 'center' }]}>
      <View style={[styles.successIcon, { backgroundColor: 'rgba(61,220,151,0.15)' }]}>
        <Ionicons name="checkmark" size={26} color={theme.green} />
      </View>
      <Text style={[styles.successTitle, { color: theme.ink }]}>{success.title}</Text>
      <Text style={[styles.successSub, { color: theme.muted }]}>{success.sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15.5, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1 },
  rowKey: { fontSize: 13.5 },
  rowVal: { fontSize: 13.5, fontWeight: '600' },
  btns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { flex: 1.4, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '600' },
  balCard: { borderRadius: 14, padding: 16, width: '100%' },
  balTitle: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.9 },
  balAcct: { color: '#fff', fontSize: 11.5, opacity: 0.7, marginTop: 2, marginBottom: 12 },
  balAmt: { color: '#fff', fontSize: 26, fontWeight: '800' },
  balSub: { color: '#fff', fontSize: 12, opacity: 0.85, marginTop: 2 },
  atmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  atmName: { fontSize: 14, fontWeight: '600' },
  atmSub: { fontSize: 12 },
  atmDist: { fontSize: 12.5, fontWeight: '700' },
  successIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: 16.5, fontWeight: '700', marginBottom: 4 },
  successSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
