import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap } from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { useAppStore } from '@/store';

// Splash
export default function SplashScreen() {
  const router = useRouter();
  const isHydrated = useAppStore((s) => s.isHydrated);
  const user = useAppStore((s) => s.user);
  const hasSeenNotifOnboarding = useAppStore((s) => s.hasSeenNotifOnboarding);
  const progressAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login' as never);
      } else if (!hasSeenNotifOnboarding) {
        router.replace('/(auth)/notification-permission' as never);
      } else {
        router.replace('/(tabs)/home' as never);
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [isHydrated, user, hasSeenNotifOnboarding, router]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.logoCard}>
          <GraduationCap size={48} color={colors.white} />
        </View>
        <Text style={[typography.displayHero, styles.brandTitle]}>
          E-Campuz<Text style={{ color: colors.secondary }}>.</Text>
        </Text>
        <Text style={[typography.bodyMd, styles.tagline]}>
          Sistem Informasi Akademik &{'\n'}Kemahasiswaan Terpadu
        </Text>

        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <View style={styles.pulseDot} />
            <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
              Memuat…
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
  },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: radius.sheet,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
    ...elevation.level2,
  },
  brandTitle: {
    color: colors.primary,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.xs,
  },
  progressBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.xxxl,
    ...elevation.level1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginRight: space.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
