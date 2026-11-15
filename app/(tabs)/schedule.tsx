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
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import {
  ScheduleCard,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useAppStore } from '@/store';
import { useSchedulesData, getCourseChatRoomId } from '@/features/useCampusData';
import { getCurrentScheduleDay } from '@/utils/format';

const DAYS_LIST: Array<{ day: 1 | 2 | 3 | 4 | 5 | 6; short: string; label: string; dateNum: number }> = [
  { day: 1, short: 'SEN', label: 'Senin', dateNum: 16 },
  { day: 2, short: 'SEL', label: 'Selasa', dateNum: 17 },
  { day: 3, short: 'RAB', label: 'Rabu', dateNum: 18 },
  { day: 4, short: 'KAM', label: 'Kamis', dateNum: 19 },
  { day: 5, short: 'JUM', label: 'Jumat', dateNum: 20 },
  { day: 6, short: 'SAB', label: 'Sabtu', dateNum: 21 },
];

// Jadwal Kuliah
export default function ScheduleScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const isLecturer = user?.role === 'dosen';

  // Hari ini dipilih otomatis saat membuka halaman
  const initialDay = getCurrentScheduleDay();
  const [selectedDay, setSelectedDay] = useState<1 | 2 | 3 | 4 | 5 | 6>(initialDay);
  const [viewMode, setViewMode] = useState<'weekly' | 'today'>('weekly');
  const [refreshing, setRefreshing] = useState(false);

  const schedulesQuery = useSchedulesData();
  const allSchedules = schedulesQuery.data || [];

  const activeDay = viewMode === 'today' ? initialDay : selectedDay;
  const filteredSchedules = allSchedules.filter((s) => s.day === activeDay);
  const totalSks = filteredSchedules.reduce((sum, s) => sum + (s.courseSks || 3), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await schedulesQuery.refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
            Jadwal Kuliah
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            Semester Ganjil 2026/2027
          </Text>
        </View>

        {/* Toggle Tampilan Mingguan / Hari Ini */}
        <View style={styles.modeSwitch}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === 'weekly' }}
            onPress={() => setViewMode('weekly')}
            style={[
              styles.modeBtn,
              viewMode === 'weekly' && styles.modeBtnActive,
            ]}
          >
            <Text
              style={[
                typography.labelSm,
                {
                  color: viewMode === 'weekly' ? colors.white : colors.textSecondary,
                },
              ]}
            >
              Mingguan
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === 'today' }}
            onPress={() => {
              setViewMode('today');
              setSelectedDay(initialDay);
            }}
            style={[
              styles.modeBtn,
              viewMode === 'today' && styles.modeBtnActive,
            ]}
          >
            <Text
              style={[
                typography.labelSm,
                {
                  color: viewMode === 'today' ? colors.white : colors.textSecondary,
                },
              ]}
            >
              Hari Ini
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Pemilih Hari Horizontal (Senin - Sabtu) */}
      {viewMode === 'weekly' ? (
        <View style={styles.daySelectorBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScrollContent}
          >
            {DAYS_LIST.map((d) => {
              const isSelected = selectedDay === d.day;
              const dayItems = allSchedules.filter((s) => s.day === d.day);
              const hasChange = dayItems.some((s) => s.status === 'changed');

              return (
                <Pressable
                  key={d.day}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Hari ${d.label}`}
                  onPress={() => setSelectedDay(d.day)}
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      typography.labelSm,
                      {
                        color: isSelected ? colors.tintStrong : colors.textSecondary,
                      },
                    ]}
                  >
                    {d.short}
                  </Text>
                  <Text
                    style={[
                      typography.headlineSm,
                      {
                        color: isSelected ? colors.white : colors.textPrimary,
                        marginTop: 2,
                      },
                    ]}
                  >
                    {d.dateNum}
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      {
                        color: isSelected ? colors.tintStrong : colors.textMuted,
                      },
                    ]}
                  >
                    Nov
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      hasChange
                        ? {
                            backgroundColor: isSelected
                              ? colors.white
                              : colors.unreadDot,
                          }
                        : dayItems.length > 0
                        ? {
                            backgroundColor: isSelected
                              ? colors.white
                              : colors.warning,
                          }
                        : { backgroundColor: 'transparent' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

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
        {/* Ringkasan MK & SKS */}
        <View style={styles.summaryBar}>
          <CalendarIcon size={18} color={colors.primary} />
          <Text
            style={[
              typography.titleSm,
              { color: colors.textPrimary, marginLeft: space.sm },
            ]}
          >
            {filteredSchedules.length} Mata Kuliah ({totalSks} SKS)
          </Text>
        </View>

        {/* 4 State: Loading, Error, Empty, Success */}
        {schedulesQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : schedulesQuery.isError ? (
          <ErrorState onRetry={() => schedulesQuery.refetch()} />
        ) : filteredSchedules.length === 0 ? (
          <EmptyState
            title="Tidak ada jadwal kuliah pada hari ini"
            description="Pilih hari lain pada tab mingguan di atas untuk memeriksa perkuliahan berikutnya."
          />
        ) : (
          <View style={styles.cardsStack}>
            {filteredSchedules.map((item) => (
              <ScheduleCard
                key={item.id}
                item={item}
                isLecturer={isLecturer}
                onPress={() => router.push(`/schedule/${item.id}` as never)}
                onOpenCourse={() =>
                  router.push(`/learning/${item.courseId}` as never)
                }
                onOpenChat={() =>
                  router.push(`/chat/${getCourseChatRoomId(item.courseId || item.courseCode)}` as never)
                }
                onEditSchedule={() =>
                  router.push(`/schedule/${item.id}/edit` as never)
                }
              />
            ))}
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
    justifyContent: 'space-between',
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  daySelectorBar: {
    backgroundColor: colors.surface,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayScrollContent: {
    paddingHorizontal: space.screenMargin,
    gap: space.sm,
  },
  dayPill: {
    width: 58,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: space.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginTop: 6,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    marginBottom: space.md,
  },
  cardsStack: {
    gap: space.itemGap,
  },
});
