import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useApp, VoiceState } from '../hooks/useAppContext';

const BAR_COUNT = 26;

function getBarProps(vstate: VoiceState, i: number) {
  switch (vstate) {
    case 'listening':
      return { height: 16, opacity: 1 };
    case 'speaking':
      return { height: 14, opacity: 1 };
    case 'thinking':
      return { height: 12, opacity: 0.8 };
    default:
      return { height: 6, opacity: 0.4 };
  }
}

export function WaveformBars() {
  const { vstate, theme } = useApp();
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (vstate === 'idle') {
      anims.forEach((a) => a.setValue(0.3));
      return;
    }
    const loops = anims.map((anim, i) => {
      const duration =
        vstate === 'listening'
          ? 800 + ((i * 7) % 5) * 120
          : vstate === 'speaking'
          ? 500 + ((i * 5) % 4) * 100
          : 1200;
      const delay = i * (vstate === 'thinking' ? 70 : vstate === 'listening' ? 50 : 35);

      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration / 2,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [vstate]);

  const barColor = vstate === 'listening' ? theme.red : theme.cta;
  const { height: baseHeight } = getBarProps(vstate, 0);

  return (
    <View style={styles.container}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: barColor,
              height: baseHeight,
              transform: [{ scaleY: anim }],
              opacity: anim.interpolate({
                inputRange: [0.3, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 64,
  },
  bar: {
    width: 4,
    borderRadius: 3,
  },
});
