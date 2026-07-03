import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useApp } from '../hooks/useAppContext';
import { Ionicons } from '@expo/vector-icons';

export function BottomDock() {
  const { theme, tab, setTab, openVoice } = useApp();

  const dockItem = (
    label: string,
    icon: string,
    activeIcon: string,
    targetTab: typeof tab
  ) => {
    const active = tab === targetTab;
    return (
      <TouchableOpacity
        style={styles.dockBtn}
        onPress={() => setTab(targetTab)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={(active ? activeIcon : icon) as any}
          size={24}
          color={active ? theme.ink : theme.muted}
        />
        <Text style={[styles.dockLabel, { color: active ? theme.ink : theme.muted }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.dock,
        { backgroundColor: theme.bg, borderTopColor: theme.line },
      ]}
    >
      {/* Home */}
      <TouchableOpacity
        style={styles.dockBtn}
        onPress={() => setTab('home')}
        activeOpacity={0.7}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { opacity: tab === 'home' ? 1 : 0.45 }]}
        />
        <Text style={[styles.dockLabel, { color: tab === 'home' ? theme.ink : theme.muted }]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Accounts */}
      {dockItem('Accounts', 'business-outline', 'business', 'accounts')}

      {/* Voice Assist FAB */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          onPress={openVoice}
          activeOpacity={0.85}
          style={[styles.fab, { shadowColor: '#8fa3ef' }]}
        >
          <View style={styles.fabGrad} />
          <Ionicons name="mic" size={26} color="#121736" />
        </TouchableOpacity>
        <Text style={[styles.dockLabel, { color: theme.muted }]}>Assist</Text>
      </View>

      {/* Cards */}
      {dockItem('Cards', 'card-outline', 'card', 'cards')}

      {/* Hub */}
      {dockItem('Hub', 'grid-outline', 'grid', 'hub')}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  dockBtn: {
    alignItems: 'center',
    gap: 3,
    width: 60,
    paddingTop: 4,
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  fabWrap: {
    alignItems: 'center',
    marginTop: -26,
    gap: 3,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  fabGrad: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#8fa3ef',
  },
});
