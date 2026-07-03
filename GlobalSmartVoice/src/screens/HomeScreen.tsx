import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { HISTORY_ROWS } from '../constants/data';

export default function HomeScreen() {
  const { theme, masked, toggleMask, toggleTheme, isDark, openVoice, setTab, cardBlocked } = useApp();

  const balance = masked ? '• • • • • •' : 'Rs. 84,560.84';

  const tiles = [
    { id: 'mt', label: 'Mobile\nTopup', icon: 'phone-portrait-outline', color: theme.tile },
    { id: 'fd', label: 'Fixed\nDeposit', icon: 'stats-chart-outline', color: theme.tile },
    { id: 'du', label: 'Digital\nUniverse', icon: 'share-social-outline', color: theme.tile },
    { id: 'va', label: 'View All', icon: 'grid-outline', color: theme.teal, textColor: theme.tealInk },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.cta }]}>
            <Text style={[styles.avatarText, { color: theme.ctaInk }]}>P</Text>
          </View>
          <Text style={[styles.greeting, { color: theme.ink }]}>Hi, Prashant!</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={theme.ink} />
            </TouchableOpacity>
            <Ionicons name="search-outline" size={21} color={theme.ink} />
            <Ionicons name="notifications-outline" size={21} color={theme.ink} />
            <TouchableOpacity onPress={toggleMask}>
              <Ionicons name={masked ? 'eye-outline' : 'eye-off-outline'} size={21} color={theme.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick tiles */}
        <View style={styles.tilesGrid}>
          {tiles.map(t => (
            <TouchableOpacity key={t.id} style={styles.tile} onPress={t.id === 'va' ? () => setTab('hub') : undefined} activeOpacity={0.75}>
              <View style={[styles.tileBox, { backgroundColor: t.color }]}>
                <Ionicons name={t.icon as any} size={26} color={t.textColor || theme.ink} />
              </View>
              <Text style={[styles.tileLabel, { color: theme.ink }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KYC Banner */}
        <View style={[styles.kycBanner, { backgroundColor: theme.amber }]}>
          <Text style={styles.kycTitle}>Full KYC Verification Missed</Text>
          <Text style={styles.kycSub}>
            You missed your KYC verification deadline on <Text style={{ fontWeight: '700' }}>March 26, 2026</Text>. Please visit <Text style={{ fontWeight: '700' }}>Manamaiju Branch (D8)</Text> to avoid any service interruption.
          </Text>
        </View>

        {/* Balance Card */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Easy Balance</Text>
          <Text style={[styles.sectionLink, { color: theme.muted }]}>View Statement</Text>
        </View>
        <View style={[styles.balCard, { backgroundColor: theme.blue }]}>
          <Text style={styles.balCardTitle}>Global Mobile Banking Savings Account (NPR)</Text>
          <Text style={styles.balAmount}>{balance}</Text>
          <Text style={styles.balSub}>Available Balance</Text>
        </View>

        {/* Transaction History */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Easy History</Text>
          <Text style={[styles.sectionLink, { color: theme.muted }]}>View All</Text>
        </View>
        {HISTORY_ROWS.map(h => (
          <View key={h.id} style={styles.histRow}>
            <View style={styles.histLogo}>
              <Text style={styles.histLogoText}>fone{'\n'}pay</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.histProvider, { color: theme.muted }]}>Fone Pay</Text>
              <Text style={[styles.histName, { color: theme.ink }]} numberOfLines={1}>{h.name}</Text>
              <Text style={[styles.histTime, { color: theme.muted }]}>{h.time}</Text>
            </View>
            <Text style={[styles.histAmt, { color: '#e8a1a1' }]}>{masked ? '••••••' : h.amt}</Text>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[styles.actions, { borderTopColor: theme.line }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.cta }]} activeOpacity={0.85}>
          <Ionicons name="swap-horizontal-outline" size={20} color={theme.ctaInk} />
          <Text style={[styles.actionBtnText, { color: theme.ctaInk }]}>Fund Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.teal }]} activeOpacity={0.85}>
          <Ionicons name="qr-code-outline" size={20} color={theme.tealInk} />
          <Text style={[styles.actionBtnText, { color: theme.tealInk }]}>Scan QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  greeting: { fontSize: 23, fontWeight: '700', flex: 1, letterSpacing: -0.3 },
  headerIcons: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  tilesGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tile: { flex: 1, alignItems: 'center', gap: 8 },
  tileBox: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 11.5, textAlign: 'center', lineHeight: 16 },
  kycBanner: { borderRadius: 14, padding: 14, marginBottom: 22 },
  kycTitle: { color: '#231a02', fontWeight: '700', fontSize: 14.5, marginBottom: 4 },
  kycSub: { color: '#231a02', fontSize: 12.5, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionLink: { fontSize: 13 },
  balCard: { borderRadius: 14, padding: 16, marginBottom: 24 },
  balCardTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 14 },
  balAmount: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'right', letterSpacing: 1 },
  balSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'right', marginTop: 4 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  histLogo: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  histLogoText: { fontSize: 8, fontWeight: '800', color: '#c1272d', textAlign: 'center', lineHeight: 10 },
  histProvider: { fontSize: 11.5 },
  histName: { fontSize: 14, fontWeight: '600' },
  histTime: { fontSize: 11.5 },
  histAmt: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 12, padding: 10, paddingBottom: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { fontWeight: '600', fontSize: 15 },
});
