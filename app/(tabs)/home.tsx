import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  AlertCircle,
  Clock,
  MapPin,
  ArrowRight,
  GraduationCap,
  Upload,
  FilePlus2,
  MessageSquare,
  CheckCircle2,
  Megaphone,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import {
  Badge,
  PriorityTag,
  SectionHeader,
  ScheduleCard,
  FileItem,
  SectionSkeleton,
  EmptyState,
  ErrorState,
  NAV_ITEM_META,
  renderNavIcon,
  Button,
} from '@/components/ui';
import { useAppStore } from '@/store';
import {
  useNotificationsData,
  useSchedulesData,
  useAssignmentsData,
  useMaterialsData,
  useBillsData,
  useCampusAnnouncementsData,
  useChatRoomsData,
  getCourseChatRoomId,
} from '@/features/useCampusData';
import {
  getGreetingByTime,
  getCurrentScheduleDay,
  formatTimeDot,
  formatRemainingTime,
  formatRupiah,
  formatDateTimeId,
  formatRelativeTime,
} from '@/utils/format';
import { NavItemKey } from '@/types';

const ALL_QUICK_ACCESS_KEYS: NavItemKey[] = [
  'tugas',
  'keuangan',
  'layanan',
  'notifikasi',
  'jadwal',
  'pembelajaran',
  'chat',
  'profil',
];

// Beranda (Mahasiswa & Dosen)
export default function HomeScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const navSlots = useAppStore((s) => s.navSlots);
  const [refreshing, setRefreshing] = useState(false);

  const notifsQuery = useNotificationsData();
  const schedulesQuery = useSchedulesData();
  const assignmentsQuery = useAssignmentsData();
  const materialsQuery = useMaterialsData();
  const billsQuery = useBillsData();
  const announcementsQuery = useCampusAnnouncementsData();
  const chatRoomsQuery = useChatRoomsData();

  const isLecturer = user?.role === 'dosen';
  const todayDay = getCurrentScheduleDay();
  const greeting = getGreetingByTime();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      notifsQuery.refetch(),
      schedulesQuery.refetch(),
      assignmentsQuery.refetch(),
      materialsQuery.refetch(),
      billsQuery.refetch(),
      announcementsQuery.refetch(),
      chatRoomsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const todaySchedules = (schedulesQuery.data || []).filter((s) => s.day === todayDay);
  const nextLecture = todaySchedules.find((s) => s.status !== 'cancelled') || todaySchedules[0];

  // Item Perlu Perhatian:
  // 1) Ruangan berubah hari ini, 2) UKT jatuh tempo <= 7 hari / lewat, 3) Tugas deadline <= 24 jam
  const changedTodaySchedules = todaySchedules.filter((s) => s.status === 'changed');
  const urgentAssignments = (assignmentsQuery.data || []).filter((a) => {
    if (a.submission) return false;
    const rem = formatRemainingTime(a.dueAt);
    return rem.hoursLeft <= 24 && rem.hoursLeft >= -48;
  });
  const urgentBills = (billsQuery.data || []).filter((b) => {
    if (b.status === 'paid') return false;
    const rem = formatRemainingTime(b.dueDate);
    return rem.daysLeft <= 7 || b.status === 'overdue';
  });

  const attentionItems: Array<{
    id: string;
    priority: 'urgent' | 'high';
    timeLabel: string;
    title: string;
    oldValue?: string;
    newValue?: string;
    description: string;
    route: string;
  }> = [
    ...changedTodaySchedules.map((sch) => {
      const chg = sch.changes?.[0];
      return {
        id: `att-sch-${sch.id}`,
        priority: 'urgent' as const,
        timeLabel: chg ? formatRelativeTime(chg.changedAt) : 'Hari ini',
        title: `${sch.courseName}: Ruang Berubah`,
        oldValue: chg?.oldValue || 'B201',
        newValue: chg?.newValue || sch.room,
        description: `Ruang kuliah dipindahkan ke ${sch.room}.`,
        route: `/schedule/${sch.id}`,
      };
    }),
    ...urgentBills.map((bill) => {
      const rem = formatRemainingTime(bill.dueDate);
      return {
        id: `att-bill-${bill.id}`,
        priority: (bill.status === 'overdue' ? 'urgent' : 'high') as 'urgent' | 'high',
        timeLabel: rem.label,
        title: `Tagihan UKT ${bill.semester}`,
        description: `Jatuh tempo ${rem.label} sebesar ${formatRupiah(bill.amount)}.`,
        route: `/finance/${bill.id}`,
      };
    }),
    ...urgentAssignments.map((asg) => {
      const rem = formatRemainingTime(asg.dueAt);
      return {
        id: `att-asg-${asg.id}`,
        priority: 'urgent' as const,
        timeLabel: rem.label,
        title: asg.title,
        description: `${asg.courseName} · Batas waktu ${rem.label}.`,
        route: `/learning/${asg.courseId}/assignment/${asg.id}`,
      };
    }),
  ];

  // Akses Cepat: 4 menu yang TIDAK ada di navbar
  const quickAccessItems = ALL_QUICK_ACCESS_KEYS.filter(
    (key) => !navSlots.includes(key)
  ).slice(0, 4);

  const upcomingAssignments = (assignmentsQuery.data || [])
    .filter((a) => !a.submission)
    .slice(0, 3);

  const latestMaterials = (materialsQuery.data || []).slice(0, 3);
  const campusAnnouncements = (announcementsQuery.data || []).slice(0, 3);

  const initials = (user?.name || 'Rina Salsabila')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Section 1: Header (Tetap di atas) */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka Profil"
          onPress={() => router.push('/profile' as never)}
          style={styles.brandRow}
        >
          <View style={styles.avatarCircle}>
            <Text style={[typography.labelMd, { color: colors.white }]}>{initials}</Text>
          </View>
          <View>
            <Text style={[typography.titleMd, { color: colors.primary }]}>E-Campuz</Text>
            <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
              {isLecturer ? 'Portal Akademik Dosen' : 'Portal Akademik Mahasiswa'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pusat Notifikasi"
          onPress={() => router.push('/notifications' as never)}
          style={styles.bellBtn}
        >
          <Bell size={space.iconLg} color={colors.textPrimary} />
          {notifsQuery.activeUnreadCount > 0 ? (
            <Badge count={notifsQuery.activeUnreadCount} style={styles.bellBadge} />
          ) : null}
        </Pressable>
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
        {/* Sapaan sesuai waktu */}
        <View style={styles.greetingSection}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.headlineMd, { color: colors.textPrimary }]}>
              {greeting}, {user?.name || 'Rina Salsabila'}
            </Text>
            <View style={styles.subGreetingRow}>
              <View style={styles.greenDot} />
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                {user?.prodi || 'S1 Teknik Informatika'}
                {!isLecturer && user?.semester ? ` · Sem. ${user.semester}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.roleActiveChip}>
            <CheckCircle2 size={13} color={colors.primary} />
            <Text style={[typography.labelSm, { color: colors.primary, marginLeft: 4 }]}>
              {isLecturer ? 'Dosen' : 'Aktif'}
            </Text>
          </View>
        </View>

        {isLecturer ? (
          /* ================================================================
             BERANDA DOSEN (PRD F-03: Mengajar Hari Ini, Tugas perlu dinilai,
             Pertanyaan mahasiswa di chat, Akses Cepat, Pengumuman)
             ================================================================ */
          <View>
            {/* 1. Mengajar Hari Ini */}
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Mengajar Hari Ini"
                actionLabel="Jadwal Lengkap"
                onActionPress={() => router.push('/(tabs)/schedule' as never)}
              />
              {schedulesQuery.isLoading ? (
                <SectionSkeleton count={2} />
              ) : schedulesQuery.isError ? (
                <ErrorState onRetry={() => schedulesQuery.refetch()} />
              ) : todaySchedules.length === 0 ? (
                <EmptyState
                  title="Tidak ada jadwal mengajar hari ini"
                  description="Anda dapat melihat jadwal minggu ini pada menu Jadwal."
                />
              ) : (
                <View style={styles.stackGap}>
                  {todaySchedules.map((sch) => (
                    <ScheduleCard
                      key={sch.id}
                      item={sch}
                      isLecturer
                      onPress={() => router.push(`/schedule/${sch.id}` as never)}
                      onEditSchedule={() =>
                        router.push(`/schedule/${sch.id}/edit` as never)
                      }
                      onOpenChat={() =>
                        router.push(`/chat/${getCourseChatRoomId(sch.courseId || sch.courseCode)}` as never)
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            {/* 2. Tugas Perlu Dinilai */}
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Tugas Perlu Dinilai"
                actionLabel="Semua Kelas"
                onActionPress={() => router.push('/(tabs)/learning' as never)}
              />
              {assignmentsQuery.isLoading ? (
                <SectionSkeleton count={2} />
              ) : (
                <View style={styles.stackGap}>
                  {(assignmentsQuery.data || []).slice(0, 2).map((asg) => (
                    <Pressable
                      key={asg.id}
                      accessibilityRole="button"
                      onPress={() =>
                        router.push(
                          `/learning/${asg.courseId}/assignment/${asg.id}/submissions` as never
                        )
                      }
                      style={styles.lecturerTaskCard}
                    >
                      <View style={styles.rowBetween}>
                        <View style={styles.coursePill}>
                          <Text style={[typography.labelSm, { color: colors.primary }]}>
                            {asg.courseName}
                          </Text>
                        </View>
                        <View style={styles.warningPill}>
                          <Text style={[typography.labelSm, { color: colors.warningText }]}>
                            {asg.submittedCount || 18}/{asg.totalStudentsCount || 32} Terkumpul
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          typography.titleMd,
                          { color: colors.textPrimary, marginTop: space.xs },
                        ]}
                      >
                        {asg.title}
                      </Text>
                      <View style={[styles.rowBetween, { marginTop: space.sm }]}>
                        <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                          Tenggat: {formatDateTimeId(asg.dueAt)}
                        </Text>
                        <Text style={[typography.labelMd, { color: colors.secondary }]}>
                          Beri Nilai →
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* 3. Pertanyaan Mahasiswa di Chat (Mention) */}
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Pertanyaan & Diskusi Kelas"
                actionLabel="Buka Chat"
                onActionPress={() => router.push('/(tabs)/chat' as never)}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push('/chat/66666666-6666-6666-6666-666666666602' as never)
                }
                style={styles.mentionCard}
              >
                <View style={styles.mentionIcon}>
                  <MessageSquare size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    Ahmad Fadil di Pemrograman Perangkat Bergerak
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}
                  >
                    &ldquo;Izin bertanya Pak Fauzi, untuk Tugas 04 apakah skema migrasi SQL juga dilampirkan?&rdquo;
                  </Text>
                </View>
                <ArrowRight size={18} color={colors.primary} />
              </Pressable>
            </View>

            {/* 4. Akses Cepat Dosen */}
            <View style={styles.sectionBlock}>
              <SectionHeader title="Akses Cepat Dosen" />
              <View style={styles.lecturerQuickRow}>
                <Button
                  title="Upload Materi"
                  variant="primary"
                  size="sm"
                  icon={<Upload size={16} color={colors.white} />}
                  onPress={() =>
                    router.push(
                      '/learning/44444444-4444-4444-4444-444444444401/material/new' as never
                    )
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  title="Buat Tugas"
                  variant="secondary"
                  size="sm"
                  icon={<FilePlus2 size={16} color={colors.primary} />}
                  onPress={() =>
                    router.push(
                      '/learning/44444444-4444-4444-4444-444444444401/assignment/new' as never
                    )
                  }
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            {/* 5. Pengumuman Kampus */}
            {campusAnnouncements.length > 0 ? (
              <View style={styles.sectionBlock}>
                <SectionHeader title="Pengumuman Kampus" />
                <View style={styles.stackGap}>
                  {campusAnnouncements.map((ann) => (
                    <View key={ann.id} style={styles.announcementCard}>
                      <View style={styles.rowBetween}>
                        <View style={styles.annPill}>
                          <Megaphone size={12} color={colors.primary} />
                          <Text
                            style={[
                              typography.labelBadge,
                              { color: colors.primary, marginLeft: 4 },
                            ]}
                          >
                            {ann.category}
                          </Text>
                        </View>
                        <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                          {formatRelativeTime(ann.publishedAt)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          typography.titleSm,
                          { color: colors.textPrimary, marginTop: space.xs },
                        ]}
                      >
                        {ann.title}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          typography.bodySm,
                          { color: colors.textSecondary, marginTop: 2 },
                        ]}
                      >
                        {ann.body}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          /* ================================================================
             BERANDA MAHASISWA — Urutan Section Tetap (PRD F-03 Section 1..8)
             ================================================================ */
          <View>
            {/* Section 2: Perlu Perhatian (Disembunyikan jika kosong) */}
            {attentionItems.length > 0 ? (
              <View style={styles.sectionBlock}>
                <View style={styles.attentionHeaderRow}>
                  <View style={styles.attentionTitleRow}>
                    <AlertCircle size={18} color={colors.urgent} />
                    <Text
                      style={[
                        typography.headlineSm,
                        { color: colors.textPrimary, marginLeft: space.xs },
                      ]}
                    >
                      Perlu Perhatian
                    </Text>
                  </View>
                  <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                    Geser untuk melihat ({attentionItems.length})
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalAttentionList}
                >
                  {attentionItems.map((att) => (
                    <Pressable
                      key={att.id}
                      accessibilityRole="button"
                      accessibilityLabel={att.title}
                      onPress={() => router.push(att.route as never)}
                      style={[
                        styles.attentionCard,
                        att.priority === 'urgent'
                          ? styles.attentionUrgent
                          : styles.attentionWarning,
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <PriorityTag priority={att.priority} />
                        <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                          {att.timeLabel}
                        </Text>
                      </View>

                      <Text
                        numberOfLines={1}
                        style={[
                          typography.titleMd,
                          { color: colors.textPrimary, marginTop: space.sm },
                        ]}
                      >
                        {att.title}
                      </Text>

                      {att.oldValue && att.newValue ? (
                        <View style={styles.deltaInline}>
                          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                            Ruang dipindahkan dari{' '}
                          </Text>
                          <Text
                            style={[
                              typography.bodySm,
                              { color: colors.textMuted, textDecorationLine: 'line-through' },
                            ]}
                          >
                            {att.oldValue}
                          </Text>
                          <ArrowRight
                            size={13}
                            color={colors.iconMuted}
                            style={{ marginHorizontal: 4 }}
                          />
                          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                            {att.newValue}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          numberOfLines={2}
                          style={[
                            typography.bodySm,
                            { color: colors.textSecondary, marginTop: 4 },
                          ]}
                        >
                          {att.description}
                        </Text>
                      )}

                      <View style={styles.attentionCtaBtn}>
                        <Text style={[typography.labelMd, { color: colors.urgentText }]}>
                          Lihat Detail →
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Section 3: Kuliah Berikutnya (Tampil jika ada kuliah hari ini) */}
            {schedulesQuery.isLoading ? (
              <View style={styles.sectionBlock}>
                <SectionSkeleton count={1} />
              </View>
            ) : nextLecture ? (
              <View style={styles.sectionBlock}>
                <SectionHeader title="Kuliah Berikutnya" />
                <ScheduleCard
                  item={nextLecture}
                  variant="hero"
                  countdownLabel="25 Menit Lagi"
                  onPress={() => router.push(`/schedule/${nextLecture.id}` as never)}
                  onOpenChat={() =>
                    router.push('/chat/66666666-6666-6666-6666-666666666602' as never)
                  }
                />
              </View>
            ) : null}

            {/* Section 4: Jadwal Hari Ini (Selalu tampil; empty state jika kosong) */}
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Jadwal Hari Ini"
                actionLabel="Lihat semua"
                onActionPress={() => router.push('/(tabs)/schedule' as never)}
              />
              {schedulesQuery.isLoading ? (
                <SectionSkeleton count={2} />
              ) : schedulesQuery.isError ? (
                <ErrorState onRetry={() => schedulesQuery.refetch()} />
              ) : todaySchedules.length === 0 ? (
                <EmptyState
                  title="Tidak ada kuliah hari ini"
                  description="Nikmati waktu belajar mandiri atau cek jadwal mingguan Anda."
                />
              ) : (
                <View style={styles.timelineCard}>
                  {todaySchedules.map((sch, idx) => {
                    const isChanged = sch.status === 'changed';
                    return (
                      <Pressable
                        key={sch.id}
                        accessibilityRole="button"
                        onPress={() => router.push(`/schedule/${sch.id}` as never)}
                        style={[
                          styles.timelineRow,
                          idx < todaySchedules.length - 1 && styles.timelineDivider,
                        ]}
                      >
                        <View style={styles.timelineTimeCol}>
                          <Text style={[typography.titleSm, { color: colors.primary }]}>
                            {formatTimeDot(sch.startTime)}
                          </Text>
                          <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                            {formatTimeDot(sch.endTime)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.timelineVerticalBar,
                            {
                              backgroundColor: isChanged ? colors.warning : colors.primary,
                            },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                            {sch.courseName}
                          </Text>
                          <View style={styles.timelineLocationRow}>
                            <MapPin size={13} color={colors.iconMuted} />
                            <Text
                              style={[
                                typography.bodySm,
                                { color: colors.textSecondary, marginLeft: 4 },
                              ]}
                            >
                              Ruang {sch.room}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.timelineTag,
                            isChanged ? styles.timelineTagWarning : styles.timelineTagSoft,
                          ]}
                        >
                          <Text
                            style={[
                              typography.labelBadge,
                              {
                                color: isChanged ? colors.warningText : colors.primary,
                              },
                            ]}
                          >
                            {isChanged
                              ? 'Berubah'
                              : sch.type === 'praktikum'
                              ? 'Praktikum'
                              : 'Teori'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Section 5: Tugas Mendatang (Selalu tampil, maks 3 tugas belum dikumpulkan) */}
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Tugas Mendatang"
                actionLabel="Semua Tugas"
                onActionPress={() => router.push('/(tabs)/tasks' as never)}
              />
              {assignmentsQuery.isLoading ? (
                <SectionSkeleton count={2} />
              ) : assignmentsQuery.isError ? (
                <ErrorState onRetry={() => assignmentsQuery.refetch()} />
              ) : upcomingAssignments.length === 0 ? (
                <EmptyState
                  title="Semua tugas sudah dikumpulkan"
                  description="Belum ada tenggat tugas baru saat ini."
                />
              ) : (
                <View style={styles.stackGap}>
                  {upcomingAssignments.map((asg) => {
                    const rem = formatRemainingTime(asg.dueAt);
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
                          rem.hoursLeft <= 24
                            ? styles.taskCardUrgent
                            : styles.taskCardNormal,
                        ]}
                      >
                        <View style={styles.rowBetween}>
                          <View style={styles.coursePill}>
                            <Text style={[typography.labelSm, { color: colors.primary }]}>
                              {asg.courseName}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.remPill,
                              rem.hoursLeft <= 24
                                ? { backgroundColor: colors.urgentSoft }
                                : { backgroundColor: colors.surfaceMuted },
                            ]}
                          >
                            <Text
                              style={[
                                typography.labelBadge,
                                {
                                  color:
                                    rem.hoursLeft <= 24
                                      ? colors.urgentText
                                      : colors.textSecondary,
                                },
                              ]}
                            >
                              {rem.label}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            typography.titleMd,
                            { color: colors.textPrimary, marginTop: space.xs },
                          ]}
                        >
                          {asg.title}
                        </Text>

                        <View style={[styles.rowBetween, { marginTop: space.sm }]}>
                          <View style={styles.rowCenter}>
                            <Clock
                              size={14}
                              color={
                                rem.hoursLeft <= 24 ? colors.urgent : colors.iconMuted
                              }
                            />
                            <Text
                              style={[
                                typography.bodySm,
                                {
                                  color:
                                    rem.hoursLeft <= 24
                                      ? colors.urgentText
                                      : colors.textSecondary,
                                  marginLeft: 4,
                                },
                              ]}
                            >
                              {formatDateTimeId(asg.dueAt)}
                            </Text>
                          </View>
                          <Text style={[typography.labelMd, { color: colors.primary }]}>
                            Kumpul Tugas ↑
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Section 6: Akses Cepat */}
            <View style={styles.sectionBlock}>
              <SectionHeader
                title="Akses Cepat"
                actionLabel="Atur Navigasi"
                onActionPress={() => router.push('/settings/navigation' as never)}
              />
              <View style={styles.quickAccessGrid}>
                {quickAccessItems.map((key) => {
                  const meta = NAV_ITEM_META[key];
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityLabel={meta.label}
                      onPress={() => router.push(meta.route as never)}
                      style={styles.quickAccessItem}
                    >
                      <View style={styles.quickAccessIconBox}>
                        {renderNavIcon(key, colors.primary, 22)}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          typography.labelSm,
                          {
                            color: colors.textPrimary,
                            marginTop: space.xs,
                            textAlign: 'center',
                          },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 7: Materi Terbaru (Maks 3 materi terakhir diunggah) */}
            {latestMaterials.length > 0 ? (
              <View style={styles.sectionBlock}>
                <SectionHeader
                  title="Materi Terbaru"
                  actionLabel="Buka Kelas"
                  onActionPress={() => router.push('/(tabs)/learning' as never)}
                />
                <View style={styles.stackGap}>
                  {latestMaterials.map((mat) => (
                    <FileItem
                      key={mat.id}
                      title={mat.title}
                      type={mat.type}
                      sizeBytes={mat.sizeBytes}
                      subtitle={mat.courseName}
                      isNew={!mat.isRead}
                      isDownloaded={mat.isDownloadedOffline}
                      onPress={() =>
                        router.push(
                          `/learning/${mat.courseId}/material/${mat.id}` as never
                        )
                      }
                      onDownload={() =>
                        materialsQuery.toggleOfflineMutation.mutate(mat.id)
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Section 8: Pengumuman Kampus (Daftar 3 pengumuman) */}
            {campusAnnouncements.length > 0 ? (
              <View style={styles.sectionBlock}>
                <SectionHeader title="Pengumuman Kampus" />
                <View style={styles.stackGap}>
                  {campusAnnouncements.map((ann) => (
                    <View key={ann.id} style={styles.announcementCard}>
                      <View style={styles.rowBetween}>
                        <View style={styles.annPill}>
                          <Megaphone size={12} color={colors.primary} />
                          <Text
                            style={[
                              typography.labelBadge,
                              { color: colors.primary, marginLeft: 4 },
                            ]}
                          >
                            {ann.category}
                          </Text>
                        </View>
                        <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                          {formatRelativeTime(ann.publishedAt)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          typography.titleSm,
                          { color: colors.textPrimary, marginTop: space.xs },
                        ]}
                      >
                        {ann.title}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          typography.bodySm,
                          { color: colors.textSecondary, marginTop: 2 },
                        ]}
                      >
                        {ann.body}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtn: {
    width: space.minTap,
    height: space.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  roleActiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  sectionBlock: {
    marginTop: space.sectionGap,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  attentionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalAttentionList: {
    gap: space.md,
    paddingRight: space.md,
  },
  attentionCard: {
    width: 300,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.lg,
  },
  attentionUrgent: {
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  attentionWarning: {
    borderColor: colors.warningBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
  },
  deltaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  attentionCtaBtn: {
    backgroundColor: colors.urgentSoft,
    borderRadius: radius.input,
    paddingVertical: space.xs + 2,
    alignItems: 'center',
    marginTop: space.md,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    ...elevation.level1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    gap: space.md,
  },
  timelineDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineTimeCol: {
    width: 48,
  },
  timelineVerticalBar: {
    width: 3,
    height: 36,
    borderRadius: radius.full,
  },
  timelineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timelineTag: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  timelineTagWarning: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  timelineTagSoft: {
    backgroundColor: colors.tintSoft,
  },
  stackGap: {
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
  taskCardNormal: {
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.primary,
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
  coursePill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  remPill: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.quickAccessGutter,
  },
  quickAccessItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    ...elevation.level1,
  },
  quickAccessIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  annPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  lecturerTaskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
    padding: space.lg,
  },
  warningPill: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  mentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  mentionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lecturerQuickRow: {
    flexDirection: 'row',
    gap: space.md,
  },
});
