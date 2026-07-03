import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AppProvider, useApp } from './src/hooks/useAppContext';
import { BottomDock } from './src/components/BottomDock';
import HomeScreen from './src/screens/HomeScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import CardsScreen from './src/screens/CardsScreen';
import HubScreen from './src/screens/HubScreen';
import VoiceOverlay from './src/screens/VoiceOverlay';

function AppShell() {
  const { theme, isDark, tab } = useApp();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'accounts' && <AccountsScreen />}
        {tab === 'cards' && <CardsScreen />}
        {tab === 'hub' && <HubScreen />}
      </View>

      {/* Bottom Navigation */}
      <BottomDock />

      {/* Voice Overlay (modal) */}
      <VoiceOverlay />
    </View>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
