import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { colors, typography, radius, space, elevation } from '@/theme';
import { useAppStore } from '@/store';
import { useAuthBootstrap, useRealtimeBridge } from '@/features/useCampusData';
import { OfflineBanner } from '@/components/ui';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppShell() {
  useAuthBootstrap();
  useRealtimeBridge();

  const router = useRouter();
  const segments = useSegments();
  const user = useAppStore((s) => s.user);
  const isHydrated = useAppStore((s) => s.isHydrated);
  const isOffline = useAppStore((s) => s.isOffline);
  const toastMessage = useAppStore((s) => s.toastMessage);

  // Reactive auth guard: redirect to login when session is cleared
  useEffect(() => {
    if (!isHydrated) return;
    const rootSegment = segments[0];
    const isAuthOrPublic =
      !rootSegment || rootSegment === '(auth)' || rootSegment === 'support';
    if (!user && !isAuthOrPublic) {
      router.replace('/(auth)/login' as never);
    }
  }, [isHydrated, user, segments, router]);

  // Cold start & foreground push notification deep link handler
  useEffect(() => {
    let isMounted = true;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!isMounted || !response) return;
        const deepLink = response.notification.request.content.data?.deepLink as
          | string
          | undefined;
        if (deepLink) {
          router.push(deepLink as never);
        }
      })
      .catch(() => {
        // ignore in unsupported environment
      });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const deepLink = response.notification.request.content.data?.deepLink as
          | string
          | undefined;
        if (deepLink) {
          router.push(deepLink as never);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OfflineBanner visible={isOffline} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      {toastMessage ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toastBox}>
            <Text style={[typography.labelMd, { color: colors.white }]}>
              {toastMessage}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
          },
        },
      })
  );

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.tintSoft }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toastWrap: {
    position: 'absolute',
    bottom: 84,
    left: space.lg,
    right: space.lg,
    alignItems: 'center',
  },
  toastBox: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: radius.full,
    ...elevation.level4,
  },
});
