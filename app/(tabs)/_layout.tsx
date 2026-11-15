import React, { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store';
import { BottomNav } from '@/components/ui';
import {
  useNotificationsData,
  useChatRoomsData,
  useAssignmentsData,
  useBillsData,
  useCoursesData,
} from '@/features/useCampusData';
import { NavItemKey } from '@/types';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const navSlots = useAppStore((s) => s.navSlots);
  const showToast = useAppStore((s) => s.showToast);
  const lastBackPress = useRef<number>(0);

  const { activeUnreadCount } = useNotificationsData();
  const { totalUnreadChat } = useChatRoomsData();
  const { data: assignments } = useAssignmentsData();
  const { data: bills } = useBillsData();
  const { data: courses } = useCoursesData();

  const pendingTasksCount = (assignments || []).filter((a) => !a.submission).length;
  const unpaidBillsCount = (bills || []).filter(
    (b) => b.status === 'unpaid' || b.status === 'overdue'
  ).length;
  const hasNewMaterials = (courses || []).some((c) => (c.unreadMaterialCount || 0) > 0);

  const getActiveKey = (): 'home' | NavItemKey | 'menu' => {
    if (pathname.includes('/schedule')) return 'jadwal';
    if (pathname.includes('/learning')) return 'pembelajaran';
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/tasks')) return 'tugas';
    if (pathname.includes('/finance')) return 'keuangan';
    if (pathname.includes('/support')) return 'layanan';
    if (pathname.includes('/menu')) return 'menu';
    return 'home';
  };

  const activeKey = getActiveKey();

  // Aturan Navigasi Global:
  // Di root tab non-Beranda, back -> Beranda. Di Beranda, back dua kali -> keluar app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeKey !== 'home') {
        router.replace('/(tabs)/home' as never);
        return true;
      }
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPress.current = now;
      showToast('Tekan sekali lagi untuk keluar aplikasi');
      return true;
    });
    return () => sub.remove();
  }, [activeKey, router, showToast]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => (
        <BottomNav
          slots={navSlots}
          activeKey={activeKey}
          badges={{
            chat: totalUnreadChat,
            tugas: pendingTasksCount,
            notifikasi: activeUnreadCount,
            keuangan: unpaidBillsCount,
          }}
          dots={{
            pembelajaran: hasNewMaterials,
          }}
          onSelect={(_key, route) => {
            router.push(route as never);
          }}
        />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="learning" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="support" />
      <Tabs.Screen name="menu" />
    </Tabs>
  );
}
