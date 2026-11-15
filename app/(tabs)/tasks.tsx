import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Bell,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import {
  StatusChip,
  Button,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useAssignmentsData } from '@/features/useCampusData';
import { formatDateTimeId, formatRemainingTime } from '@/utils/format';

type TaskStatusFilter = 'all' | 'pending' | 'submitted' | 'late' | 'graded';

// Semua Tugas
export default function AllTasksScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const assignmentsQuery = useAssignmentsData();
  const allAssignments = assignmentsQuery.data || [];

  const filtered = allAssignments.filter((asg) => {
    const matchesSearch =
      !searchQuery.trim() ||
      asg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asg.courseName || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const sub = asg.submission;
    const rem = formatRemainingTime(asg.dueAt);

    if (statusFilter === 'pending') return !sub && !rem.isOverdue;
    if (statusFilter === 'submitted') return sub?.status === 'submitted';
    if (statusFilter === 'late') return sub?.status === 'late' || (!sub && rem.isOverdue);
    if (statusFilter === 'graded') return sub?.status === 'graded';
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await assignmentsQuery.refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
            Semua Tugas
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            Semester Ganjil 2026/2027
          </Text>
        </View>
      </View>

      {/* Search Bar & Filter Status */}
      <View style={styles.filterHeaderBox}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.iconMuted} />
          <TextInput
            accessibilityLabel="Cari tugas atau mata kuliah"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari judul tugas atau mata kuliah…"
            placeholderTextColor={colors.textMuted}
            style={[typography.bodyMd, styles.searchInput]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {(
            [
              { key: 'all', label: 'Semua' },
              { key: 'pending', label: 'Belum Dikerjakan' },
              { key: 'submitted', label: 'Terkumpul' },
              { key: 'late', label: 'Terlambat' },
              { key: 'graded', label: 'Dinilai' },
            ] as const
          ).map((chip) => {
            const active = statusFilter === chip.key;
            return (
              <Pressable
                key={chip.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setStatusFilter(chip.key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  style={[
                    typography.labelMd,
                    { color: active ? colors.white : colors.textSecondary },
                  ]}
                >
                  {chip.label}
                </Text>
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
        {/* Banner Info Pengingat Otomatis */}
        <View style={styles.reminderInfoBanner}>
          <Bell size={18} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: space.sm }}>
            <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
              Pengingat Otomatis Aktif
            </Text>
            <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
              Notifikasi dikirim pada H-3, H-1, dan 6 jam sebelum deadline. Otomatis berhenti saat tugas telah dikumpulkan.
            </Text>
          </View>
        </View>

        {assignmentsQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : assignmentsQuery.isError ? (
          <ErrorState onRetry={() => assignmentsQuery.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada tugas yang cocok"
            description="Ubah kata kunci pencarian atau pilih filter status lainnya."
          />
        ) : (
          <View style={styles.cardsStack}>
            {filtered.map((asg) => {
              const sub = asg.submission;
              const rem = formatRemainingTime(asg.dueAt);
              const isUrgent = !sub && rem.hoursLeft <= 24;

              return (
                <Pressable
                  key={asg.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(
                      `/learning/${asg.courseId}/assignment/${asg.id}` as never
                    )
                  }
                  style={[
                    styles.taskCard,
                    isUrgent && styles.taskCardUrgent,
                    !sub && !isUrgent && styles.taskCardWarning,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.courseChip}>
                      <Text style={[typography.labelSm, { color: colors.primary }]}>
                        {asg.courseName}
                      </Text>
                    </View>
                    {!sub ? (
                      <StatusChip
                        status={
                          rem.isOverdue ? 'assignment_late' : 'assignment_pending'
                        }
                      />
                    ) : sub.status === 'graded' ? (
                      <StatusChip status="assignment_graded" />
                    ) : sub.status === 'late' ? (
                      <StatusChip status="assignment_late" />
                    ) : (
                      <StatusChip status="assignment_submitted" />
                    )}
                  </View>

                  <Text
                    style={[
                      typography.titleMd,
                      { color: colors.textPrimary, marginTop: space.sm },
                    ]}
                  >
                    {asg.title}
                  </Text>

                  <View style={[styles.rowBetween, { marginTop: space.sm }]}>
                    <View style={styles.rowCenter}>
                      <Clock
                        size={14}
                        color={isUrgent ? colors.urgent : colors.iconMuted}
                      />
                      <Text
                        style={[
                          typography.bodySm,
                          {
                            color: isUrgent
                              ? colors.urgentText
                              : colors.textSecondary,
                            marginLeft: 4,
                          },
                        ]}
                      >
                        {formatDateTimeId(asg.dueAt)}
                      </Text>
                    </View>
                    {!sub ? (
                      <Text
                        style={[
                          typography.labelSm,
                          {
                            color: isUrgent
                              ? colors.urgentText
                              : colors.warningText,
                          },
                        ]}
                      >
                        {rem.label}
                      </Text>
                    ) : null}
                  </View>

                  {sub?.status === 'graded' ? (
                    <View style={styles.gradedBox}>
                      <Text style={[typography.titleSm, { color: colors.successText }]}>
                        Nilai: {sub.score}/100
                      </Text>
                      {sub.feedback ? (
                        <Text
                          style={[
                            typography.bodySm,
                            { color: colors.textSecondary, marginTop: 2 },
                          ]}
                        >
                          Catatan Dosen: &ldquo;{sub.feedback}&rdquo;
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {!sub ? (
                    <Button
                      title="Kerjakan & Unggah Tugas"
                      size="sm"
                      rightIcon={<ArrowRight size={15} color={colors.white} />}
                      onPress={() =>
                        router.push(
                          `/learning/${asg.courseId}/assignment/${asg.id}` as never
                        )
                      }
                      style={{ marginTop: space.md }}
                    />
                  ) : null}
                </Pressable>
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
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterHeaderBox: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.screenMargin,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    minHeight: 44,
    marginTop: space.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    marginLeft: space.sm,
  },
  chipsScroll: {
    gap: space.xs,
    marginTop: space.md,
  },
  filterPill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  reminderInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.lg,
  },
  cardsStack: {
    gap: space.itemGap,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  taskCardUrgent: {
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  taskCardWarning: {
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseChip: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  gradedBox: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.sm,
  },
});
