import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { FavouritesModal } from '../components/FavouritesModal';

export default function AccountsScreen() {
  const { theme, masked, toggleMask } = useApp();
  const [favouritesOpen, setFavouritesOpen] = useState(false);
  const balance = masked ? '• • • • • •' : 'Rs. 84,560.84';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.ink }]}>All Accounts</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="settings-outline" size={21} color={theme.ink} />
            <Ionicons name="help-circle-outline" size={21} color={theme.ink} />
            <TouchableOpacity onPress={toggleMask}>
              <Ionicons name={masked ? 'eye-outline' : 'eye-off-outline'} size={21} color={theme.ink} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.accountCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.acctName, { color: theme.ink }]}>Global Mobile Banking Savings Account (NPR)</Text>
          <Text style={[styles.acctNo, { color: theme.muted }]}>13408010000408</Text>
          <View style={styles.acctRow}>
            <Text style={[styles.acctBalance, { color: theme.ink }]}>{balance}</Text>
            <View style={[styles.rateBadge, { backgroundColor: theme.green }]}>
              <Text style={styles.rateText}>2.75% p.a.</Text>
            </View>
          </View>
          <Text style={[styles.interest, { color: theme.muted }]}>
            Interest: <Text style={[styles.interestVal, { color: theme.ink }]}>13.46</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.favouritesLink, { backgroundColor: theme.surface, borderColor: theme.line }]}
          activeOpacity={0.75}
          onPress={() => setFavouritesOpen(true)}
        >
          <Ionicons name="people-outline" size={20} color={theme.ink} />
          <Text style={[styles.favouritesLinkText, { color: theme.ink }]}>Favourite Accounts</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomAction}>
        <TouchableOpacity style={[styles.openBtn, { backgroundColor: theme.cta }]} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={20} color={theme.ctaInk} />
          <Text style={[styles.openBtnText, { color: theme.ctaInk }]}>Open New Account</Text>
        </TouchableOpacity>
      </View>

      <FavouritesModal visible={favouritesOpen} onClose={() => setFavouritesOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 23, fontWeight: '700', letterSpacing: -0.3 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  accountCard: { borderRadius: 14, borderWidth: 1, padding: 18 },
  acctName: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  acctNo: { fontSize: 12, marginBottom: 14 },
  acctRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  acctBalance: { fontSize: 24, fontWeight: '800' },
  rateBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  rateText: { color: '#06281a', fontSize: 12.5, fontWeight: '700' },
  interest: { fontSize: 13, marginTop: 8 },
  interestVal: { fontWeight: '600' },
  favouritesLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 14,
  },
  favouritesLinkText: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  bottomAction: { padding: 20, paddingBottom: 12 },
  openBtn: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  openBtnText: { fontWeight: '600', fontSize: 15 },
});
