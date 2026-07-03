import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { HUB_SECTIONS } from '../constants/data';

// Map icon string to Ionicons name
const ICON_MAP: Record<string, string> = {
  phone: 'phone-portrait-outline',
  percent: 'stats-chart-outline',
  net: 'share-social-outline',
  signal: 'cellular-outline',
  droplet: 'water-outline',
  wifi: 'wifi-outline',
  'phone-call': 'call-outline',
  tv: 'tv-outline',
  umbrella: 'umbrella-outline',
  'credit-card': 'card-outline',
  truck: 'car-outline',
  store: 'storefront-outline',
  landmark: 'business-outline',
  wallet: 'wallet-outline',
  'qr-code': 'qr-code-outline',
  lock: 'lock-closed-outline',
  globe: 'globe-outline',
  users: 'people-outline',
  plane: 'airplane-outline',
  'bed-double': 'bed-outline',
  car: 'car-outline',
  'bar-chart-2': 'bar-chart-outline',
  'piggy-bank': 'cash-outline',
  'git-branch': 'git-network-outline',
  'candlestick-chart': 'trending-up-outline',
  'trending-up': 'trending-up-outline',
  briefcase: 'briefcase-outline',
};

export default function HubScreen() {
  const { theme } = useApp();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: theme.ink }]}>Hub</Text>

      <View style={[styles.searchBar, { backgroundColor: theme.search }]}>
        <Ionicons name="search-outline" size={18} color={theme.muted} />
        <Text style={[styles.searchPlaceholder, { color: theme.muted }]}>Search</Text>
      </View>

      {HUB_SECTIONS.map(sec => (
        <View key={sec.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>{sec.title}</Text>
          <View style={styles.tilesGrid}>
            {sec.tiles.map(t => (
              <TouchableOpacity key={t.id} style={styles.tile} activeOpacity={0.75}>
                {t.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.badge}</Text>
                  </View>
                )}
                <View style={[styles.tileBox, { backgroundColor: theme.tile }]}>
                  <Ionicons name={(ICON_MAP[t.icon] || 'apps-outline') as any} size={26} color={theme.ink} />
                </View>
                <Text style={[styles.tileLabel, { color: theme.ink }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  title: { fontSize: 23, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 12, paddingHorizontal: 14, marginBottom: 22 },
  searchPlaceholder: { fontSize: 15 },
  section: { marginBottom: 26 },
  sectionTitle: { fontSize: 16.5, fontWeight: '700', marginBottom: 14 },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { width: '22%', alignItems: 'center', gap: 8, position: 'relative' },
  badge: { position: 'absolute', top: -9, zIndex: 2, backgroundColor: '#cff5ee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#0c3d36', fontSize: 9.5, fontWeight: '700' },
  tileBox: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 11.5, textAlign: 'center', lineHeight: 16 },
});
