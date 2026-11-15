import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  CheckCheck,
  Settings,
  AlertCircle,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import {
  NotificationItem,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useAppStore } from '@/store';
import { useNotificationsData } from '@/features/useCampusData';
import { getNotificationGroupLabel } from '@/utils/format';
import { AppNotification, NotifCategory } from '@/types';

type FilterTabKey = 'ALL' | NotifCategory;

const FILTER_TABS: Array<{ key: FilterTabKey; label: string; emptyLabel: string }> = [
  { key: 'ALL', label: 'Semua', emptyLabel: 'Belum ada notifikasi' },
  { key: 'SCHEDULE', label: 'Jadwal', emptyLabel: 'Belum ada notifikasi jadwal' },
  { key: 'ASSIGNMENT', label: 'Tugas', emptyLabel: 'Belum ada notifikasi tugas' },
  { key: 'FINANCE', label: 'Keuangan', emptyLabel: 'Belum ada notifikasi keuangan' },
  { key: 'LEARNING', label: 'Pembelajaran', emptyLabel: 'Belum ada notifikasi pembelajaran' },
  { key: 'CHAT', label: 'Chat', emptyLabel: 'Belum ada notifikasi chat' },
  { key: 'SUPPORT', label: 'Layanan', emptyLabel: 'Belum ada notifikasi layanan' },
];

// Pusat Notifikasi
export default function NotificationCenterScreen() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const [selectedTab, setSelectedTab] = useState<FilterTabKey>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
    markReadMutation,
    markAllReadMutation,
    deleteNotifMutation,
  } = useNotificationsData();

  const allItems = notifications || [];

  const filteredItems =
    selectedTab === 'ALL'
      ? allItems
      : allItems.filter((n) => n.category === selectedTab);

  // Notifikasi berprioritas Mendesak yang belum dibaca selalu disematkan di atas dalam "Perlu Tindakan"
  const urgentActionItems = filteredItems.filter(
    (n) => n.priority === 'urgent' && !n.isRead
  );
  const regularItems = filteredItems.filter(
    (n) => !(n.priority === 'urgent' && !n.isRead)
  );

  const timeGroups: Array<'Hari ini' | 'Kemarin' | 'Minggu ini' | 'Lebih lama'> = [
    'Hari ini',
    'Kemarin',
    'Minggu ini',
    'Lebih lama',
  ];

  const getUnreadBadgeForTab = (key: FilterTabKey): number => {
    const list =
      key === 'ALL' ? allItems : allItems.filter((n) => n.category === key);
    return list.filter((n) => !n.isRead).length;
  };

  const handleOpenNotification = (item: AppNotification) => {
    if (!item.isRead) {
      markReadMutation.mutate({ id: item.id, isRead: true });
    }
    router.push(item.deepLink as never);
  };

  const handleCopyVa = async (va: string) => {
    try {
      await Clipboard.setStringAsync(va);
    } catch {
      // ignore
    }
    showToast('Nomor Virtual Account disalin');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const activeTabMeta =
    FILTER_TABS.find((t) => t.key === selectedTab) || FILTER_TABS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <ArrowLeft size={space.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typography.titleMd, { color: colors.textPrimary, flex: 1 }]}>
          Pusat Notifikasi
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tandai semua dibaca"
          onPress={() => markAllReadMutation.mutate()}
          style={styles.iconBtn}
        >
          <CheckCheck size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preferensi Notifikasi"
          onPress={() => router.push('/settings/notifications' as never)}
          style={styles.iconBtn}
        >
          <Settings size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Tab Filter Horizontal dengan Badge Belum Dibaca */}
      <View style={styles.tabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedTab === tab.key;
            const unreadCount = getUnreadBadgeForTab(tab.key);

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={tab.label}
                onPress={() => setSelectedTab(tab.key)}
                style={[styles.tabPill, isSelected && styles.tabPillActive]}
              >
                <Text
                  style={[
                    typography.labelMd,
                    { color: isSelected ? colors.white : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
                {unreadCount > 0 ? (
                  <View
                    style={[
                      styles.tabBadge,
                      isSelected ? styles.tabBadgeActive : styles.tabBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        typography.labelBadge,
                        {
                          color: isSelected ? colors.white : colors.textPrimary,
                        },
                      ]}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <SectionSkeleton count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={activeTabMeta.emptyLabel}
            description="Notifikasi terbaru akan langsung tampil di sini."
          />
        ) : (
          <View>
            {/* Bagian PERLU TINDAKAN (Disematkan di atas) */}
            {urgentActionItems.length > 0 ? (
              <View style={styles.groupBlock}>
                <View style={styles.urgentHeaderRow}>
                  <View style={styles.urgentTitleRow}>
                    <AlertCircle size={16} color={colors.urgent} />
                    <Text
                      style={[
                        typography.labelSm,
                        { color: colors.urgentText, marginLeft: 6 },
                      ]}
                    >
                      PERLU TINDAKAN
                    </Text>
                  </View>
                  <View style={styles.priorityCountPill}>
                    <Text style={[typography.labelBadge, { color: colors.urgentText }]}>
                      {urgentActionItems.length} Prioritas
                    </Text>
                  </View>
                </View>

                <View style={styles.itemsStack}>
                  {urgentActionItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onPress={handleOpenNotification}
                      onToggleRead={(it) =>
                        markReadMutation.mutate({ id: it.id, isRead: !it.isRead })
                      }
                      onDelete={(it) => deleteNotifMutation.mutate(it.id)}
                      onCopyVa={handleCopyVa}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Pengelompokan Berdasarkan Waktu: Hari ini · Kemarin · Minggu ini · Lebih lama */}
            {timeGroups.map((groupLabel) => {
              const groupItems = regularItems.filter(
                (it) => getNotificationGroupLabel(it.createdAt) === groupLabel
              );
              if (groupItems.length === 0) return null;

              return (
                <View key={groupLabel} style={styles.groupBlock}>
                  <Text style={[typography.labelSm, styles.groupCaps]}>
                    {groupLabel.toUpperCase()}
                  </Text>
                  <View style={styles.itemsStack}>
                    {groupItems.map((item) => (
                      <NotificationItem
                        key={item.id}
                        item={item}
                        onPress={handleOpenNotification}
                        onToggleRead={(it) =>
                          markReadMutation.mutate({ id: it.id, isRead: !it.isRead })
                        }
                        onDelete={(it) => deleteNotifMutation.mutate(it.id)}
                        onCopyVa={handleCopyVa}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: space.minTap,
    height: space.minTap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    backgroundColor: colors.surface,
    paddingVertical: space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsScroll: {
    paddingHorizontal: space.screenMargin,
    gap: space.sm,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 3,
    borderRadius: radius.full,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tabBadgeInactive: {
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  groupBlock: {
    marginBottom: space.sectionGap,
  },
  urgentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  urgentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityCountPill: {
    backgroundColor: colors.urgentSoft,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  groupCaps: {
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  itemsStack: {
    gap: space.itemGap,
  },
});
