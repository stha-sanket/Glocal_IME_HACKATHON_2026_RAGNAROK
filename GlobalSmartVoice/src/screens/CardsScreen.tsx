import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../hooks/useAppContext';
import { CARD_PERKS } from '../constants/data';

const PERK_ICONS: Record<string, string> = {
  globe: 'globe-outline',
  atm: 'cash-outline',
  bell: 'notifications-outline',
};

export default function CardsScreen() {
  const { theme, cardBlocked } = useApp();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.ink }]}>Cards</Text>

        {cardBlocked && (
          <View style={[styles.blockedBanner, { backgroundColor: 'rgba(224,82,82,0.14)', borderColor: 'rgba(224,82,82,0.4)' }]}>
            <Ionicons name="shield" size={18} color={theme.red} />
            <Text style={[styles.blockedText, { color: theme.red }]}>Your Visa debit card •••• 4082 is blocked.</Text>
          </View>
        )}

        {/* Visa Card Visual */}
        <View style={[styles.visaCard, { opacity: cardBlocked ? 0.45 : 1 }]}>
          <LinearGradient
            colors={['#f6c443', '#ef8f3a', '#e2542e', '#b23036']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Image source={require('../../assets/logo.png')} style={styles.visaLogo} />
          <View style={styles.chipCard} />
          <Text style={styles.visaBrand}>VISA</Text>
        </View>

        <Text style={[styles.applyTitle, { color: theme.ink }]}>Apply for your{'\n'}Visa Card</Text>

        {CARD_PERKS.map(p => (
          <View key={p.id} style={styles.perk}>
            <Ionicons name={(PERK_ICONS[p.icon] || 'star-outline') as any} size={22} color={theme.ink} style={{ paddingTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.perkTitle, { color: theme.ink }]}>{p.title}</Text>
              <Text style={[styles.perkSub, { color: theme.muted }]}>{p.sub}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.bottomAction}>
        <Text style={[styles.linkText, { color: theme.muted }]}>
          Already Have a Card?{' '}
          <Text style={{ color: '#7d9bf0', fontWeight: '600' }}>Link Now</Text>
        </Text>
        <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.cta }]} activeOpacity={0.85}>
          <Text style={[styles.applyBtnText, { color: theme.ctaInk }]}>Apply Card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  title: { fontSize: 23, fontWeight: '700', letterSpacing: -0.3, marginBottom: 18 },
  blockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  blockedText: { fontSize: 13.5, fontWeight: '600', flex: 1 },
  visaCard: { width: '100%', height: 200, borderRadius: 18, overflow: 'hidden', marginBottom: 26 },
  visaLogo: { position: 'absolute', top: 14, left: 16, width: 30, height: 30, borderRadius: 4 },
  chipCard: { position: 'absolute', top: 52, left: 20, width: 38, height: 28, borderRadius: 5, backgroundColor: '#e0dac8' },
  visaBrand: { position: 'absolute', bottom: 14, right: 18, fontStyle: 'italic', fontWeight: '800', fontSize: 22, color: '#fff' },
  applyTitle: { fontSize: 25, fontWeight: '600', letterSpacing: 1, lineHeight: 34, textAlign: 'center', textTransform: 'uppercase', marginBottom: 24 },
  perk: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  perkTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  perkSub: { fontSize: 13, lineHeight: 20 },
  bottomAction: { padding: 20, paddingTop: 0, paddingBottom: 12 },
  linkText: { textAlign: 'center', fontSize: 13, marginBottom: 10 },
  applyBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { fontWeight: '600', fontSize: 15 },
});
