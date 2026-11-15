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
import {
  BookOpen,
  ClipboardList,
  User as UserIcon,
  ArrowRight,
  GraduationCap,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { SectionSkeleton, EmptyState, ErrorState } from '@/components/ui';
import { useCoursesData } from '@/features/useCampusData';

type CourseFilter = 'all' | 'new_material' | 'active_task';

// Daftar Kelas
export default function LearningCoursesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<CourseFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const coursesQuery = useCoursesData();
  const courses = coursesQuery.data || [];

  const totalNewMaterials = courses.reduce(
    (sum, c) => sum + (c.unreadMaterialCount || 0),
    0
  );
  const totalActiveTasks = courses.reduce(
    (sum, c) => sum + (c.activeAssignmentCount || 0),
    0
  );
  const totalSks = courses.reduce((sum, c) => sum + c.sks, 0);

  const filteredCourses = courses.filter((c) => {
    if (filter === 'new_material') return (c.unreadMaterialCount || 0) > 0;
    if (filter === 'active_task') return (c.activeAssignmentCount || 0) > 0;
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await coursesQuery.refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
            Pembelajaran & Kelas
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            Semester Ganjil 2026/2027 · {totalSks} SKS
          </Text>
        </View>
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
        {/* Banner Biru Ringkasan Semester */}
        <View style={styles.heroSummaryBanner}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[typography.labelSm, { color: colors.tintStrong }]}>
                RINGKASAN BEBAN STUDI
              </Text>
              <Text
                style={[
                  typography.headlineMd,
                  { color: colors.white, marginTop: 2 },
                ]}
              >
                {courses.length} Mata Kuliah Diambil
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <GraduationCap size={24} color={colors.white} />
            </View>
          </View>

          <View style={styles.heroBadgesRow}>
            <View style={styles.heroGlassBadge}>
              <BookOpen size={14} color={colors.white} />
              <Text style={[typography.labelSm, { color: colors.white, marginLeft: 4 }]}>
                {totalNewMaterials} Materi Baru
              </Text>
            </View>
            <View style={styles.heroUrgentBadge}>
              <ClipboardList size={14} color={colors.white} />
              <Text style={[typography.labelSm, { color: colors.white, marginLeft: 4 }]}>
                {totalActiveTasks} Tugas Aktif
              </Text>
            </View>
          </View>
        </View>

        {/* Chip Filter: Semua | Ada Materi Baru | Ada Tugas */}
        <View style={styles.filterRow}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'all' }}
            onPress={() => setFilter('all')}
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          >
            <Text
              style={[
                typography.labelMd,
                { color: filter === 'all' ? colors.white : colors.textSecondary },
              ]}
            >
              Semua ({courses.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'new_material' }}
            onPress={() => setFilter('new_material')}
            style={[
              styles.filterChip,
              filter === 'new_material' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                typography.labelMd,
                {
                  color:
                    filter === 'new_material' ? colors.white : colors.textSecondary,
                },
              ]}
            >
              Ada Materi Baru ({courses.filter((c) => (c.unreadMaterialCount || 0) > 0).length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'active_task' }}
            onPress={() => setFilter('active_task')}
            style={[
              styles.filterChip,
              filter === 'active_task' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                typography.labelMd,
                {
                  color:
                    filter === 'active_task' ? colors.white : colors.textSecondary,
                },
              ]}
            >
              Ada Tugas ({courses.filter((c) => (c.activeAssignmentCount || 0) > 0).length})
            </Text>
          </Pressable>
        </View>

        {/* Daftar Kartu Mata Kuliah (4 State) */}
        {coursesQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : coursesQuery.isError ? (
          <ErrorState onRetry={() => coursesQuery.refetch()} />
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            title="Tidak ada mata kuliah pada filter ini"
            description="Coba pilih tab Semua untuk melihat daftar seluruh mata kuliah Anda."
            actionLabel="Tampilkan Semua"
            onAction={() => setFilter('all')}
          />
        ) : (
          <View style={styles.cardsStack}>
            {filteredCourses.map((course) => {
              const currentMtg = course.currentMeeting || 7;
              const totalMtg = course.totalMeetings || 16;
              const progressPct = Math.round((currentMtg / totalMtg) * 100);
              const hasActiveTask = (course.activeAssignmentCount || 0) > 0;
              const hasNewMat = (course.unreadMaterialCount || 0) > 0;

              return (
                <Pressable
                  key={course.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Buka kelas ${course.name}`}
                  onPress={() => router.push(`/learning/${course.id}` as never)}
                  style={[
                    styles.courseCard,
                    hasActiveTask && styles.courseCardUrgent,
                  ]}
                >
                  <View style={styles.courseTopRow}>
                    <View style={styles.codeBadge}>
                      <Text style={[typography.labelSm, { color: colors.primary }]}>
                        {course.code}
                      </Text>
                    </View>
                    <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                      {course.sks} SKS · Kelas {course.className || 'TI-3A'}
                    </Text>
                  </View>

                  <Text
                    style={[
                      typography.headlineSm,
                      { color: colors.textPrimary, marginTop: space.xs },
                    ]}
                  >
                    {course.name}
                  </Text>

                  <View style={styles.lecturerRow}>
                    <UserIcon size={14} color={colors.iconMuted} />
                    <Text
                      style={[
                        typography.bodySm,
                        { color: colors.textSecondary, marginLeft: 4 },
                      ]}
                    >
                      {course.lecturerNames?.join(', ') || 'Dr. Ir. Ahmad Fauzi, M.Kom.'}
                    </Text>
                  </View>

                  {/* Progress Pertemuan */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                        Progres Pertemuan
                      </Text>
                      <Text style={[typography.labelSm, { color: colors.textPrimary }]}>
                        {currentMtg}/{totalMtg} Pertemuan ({progressPct}%)
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${progressPct}%` }]}
                      />
                    </View>
                  </View>

                  {/* Badge Materi Baru & Tugas Aktif */}
                  <View style={styles.badgesWrap}>
                    {hasNewMat ? (
                      <View style={styles.materialBadge}>
                        <BookOpen size={13} color={colors.primary} />
                        <Text
                          style={[
                            typography.labelBadge,
                            { color: colors.primary, marginLeft: 4 },
                          ]}
                        >
                          {course.unreadMaterialCount} Materi Baru (Pertemuan {currentMtg})
                        </Text>
                      </View>
                    ) : null}

                    {hasActiveTask ? (
                      <View style={styles.taskBadge}>
                        <ClipboardList size={13} color={colors.urgentText} />
                        <Text
                          style={[
                            typography.labelBadge,
                            { color: colors.urgentText, marginLeft: 4 },
                          ]}
                        >
                          {course.activeAssignmentCount} Tugas Belum Dikerjakan
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.completedBadge}>
                        <Text
                          style={[typography.labelBadge, { color: colors.successText }]}
                        >
                          ✓ Semua tugas terkumpul
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.courseFooter}>
                    <Text style={[typography.labelMd, { color: colors.primary }]}>
                      Buka Kelas
                    </Text>
                    <ArrowRight
                      size={16}
                      color={colors.primary}
                      style={{ marginLeft: 4 }}
                    />
                  </View>
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
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  heroSummaryBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: space.lg,
    ...elevation.level2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
  },
  heroGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  heroUrgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.urgent,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginVertical: space.lg,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardsStack: {
    gap: space.itemGap,
  },
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    ...elevation.level1,
  },
  courseCardUrgent: {
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  courseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  codeBadge: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  lecturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressSection: {
    marginTop: space.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.md,
  },
  materialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.urgentSoft,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  completedBadge: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
