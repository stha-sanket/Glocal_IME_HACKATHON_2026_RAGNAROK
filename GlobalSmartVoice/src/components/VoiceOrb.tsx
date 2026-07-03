import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../hooks/useAppContext';
import { LinearGradient } from 'expo-linear-gradient';

// Exact palettes from the design: [light, mid, dark]
const ORB_PALETTES: Record<string, [string, string, string]> = {
  idle:      ['#dfe6ff', '#8fa3ef', '#5568c9'],
  listening: ['#ffe1d9', '#ef968a', '#c9564f'],
  thinking:  ['#e2e6ff', '#9db0f5', '#6f82d9'],
  speaking:  ['#dcecff', '#8fb3ef', '#4f79c9'],
};



export function VoiceOrb({ onPress }: { onPress: () => void }) {
  const { vstate } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const palette = ORB_PALETTES[vstate] ?? ORB_PALETTES.idle;

  useEffect(() => {
    scaleAnim.stopAnimation();
    opacityAnim.stopAnimation();

    let loop: Animated.CompositeAnimation;

    if (vstate === 'idle') {
      // gsBreathe: 3.2s gentle pulse
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.045, duration: 1600, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,     duration: 1600, useNativeDriver: true }),
        ])
      );
    } else if (vstate === 'listening') {
      // gsOrbListen: 1s scale up/down
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      );
    } else if (vstate === 'speaking') {
      // gsOrbSpeak: 0.85s 4-step rhythm
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.06, duration: 213, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.96, duration: 213, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.04, duration: 213, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 213, useNativeDriver: true }),
        ])
      );
    } else {
      // gsOrbThink: opacity pulse only
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.75, duration: 500, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      );
    }

    loop.start();
    return () => loop.stop();
  }, [vstate]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Animated.View
        style={[
          styles.orbWrap,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Main orb sphere — diagonal gradient from light (top-left) to dark (bottom-right) */}
        <LinearGradient
          colors={[palette[0], palette[1], palette[2]]}
          start={{ x: 0.15, y: 0.10 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbCore}
        >
          {/* Subtle gloss sheen — white-to-transparent at top edge, very low opacity */}
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 0.5 }}
            style={styles.gloss}
          />

          {/* Mic / Stop icon centered */}
          <Svg
            width={34} height={34} viewBox="0 0 24 24"
            fill="none"
            stroke={vstate === 'listening' ? '#fff' : '#121736'}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={styles.icon}
          >
            {vstate === 'listening' ? (
              <Path d="M7 7h10v10H7z" fill={"#fff"} stroke="none" />
            ) : (
              <>
                <Path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <Path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <Path d="M12 18v4" />
              </>
            )}
          </Svg>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  orbWrap: {
    width: 172,
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
    // Outer glow — simulates `box-shadow: 0 14px 44px rgba(90,110,220,0.4)` from design
    shadowColor: '#5a6edc',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 44,
    elevation: 14,
  },
  orbCore: {
    width: 172,
    height: 172,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 86,   // top half only
    borderTopLeftRadius: 86,
    borderTopRightRadius: 86,
  },
  icon: {
    // center the icon, slightly lower than the geometric center
    // to account for the gloss area at top
    marginTop: 8,
  },
});
