import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  ArrowRight,
  Upload,
  FilePlus2,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  Trash2,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import {
  StatusChip,
  PriorityTag,
  FileItem,
  Button,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useAppStore } from '@/store';
import {
  useCourseDetailData,
  useMaterialsData,
  useSchedulesData,
  getCourseChatRoomId,
} from '@/features/useCampusData';
import {
  formatDateTimeId,
  formatRemainingTime,
  formatTimeDot,
  getDayName,
} from '@/utils/format';

type CourseTab = 'materi' | 'tugas' | 'diskusi' | 'info';

// Detail Mata Kuliah (Tab Materi, Tugas, Diskusi, Info)
export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const isLecturer = user?.role === 'dosen';

  const [activeTab, setActiveTab] = useState<CourseTab>('tugas');

  const { courseQuery, materialsQuery, assignmentsQuery } = useCourseDetailData(
    courseId || ''
  );
  const { toggleOfflineMutation, deleteMutation } = useMaterialsData(courseId);
  const schedulesQuery = useSchedulesData();

  const course = courseQuery.data;
  const materials = materialsQuery.data || [];
  const assignments = assignmentsQuery.data || [];
  const courseSchedules = (schedulesQuery.data || []).filter(
    (s) => s.courseId === courseId
  );
  const primarySchedule = courseSchedules[0];

  const pendingTaskCount = assignments.filter((a) => !a.submission).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={space.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typography.titleMd, { color: colors.textPrimary, flex: 1 }]}>
          Detail Mata Kuliah
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {courseQuery.isLoading ? (
          <SectionSkeleton count={2} />
        ) : courseQuery.isError || !course ? (
          <ErrorState onRetry={() => courseQuery.refetch()} />
        ) : (
          <View>
            {/* Kartu Header Mata Kuliah */}
            <View style={styles.courseHeaderCard}>
              <View style={styles.topPills}>
                <View style={styles.codePill}>
                  <Text style={[typography.labelSm, { color: colors.primary }]}>
                    {course.code}
                  </Text>
                </View>
                <View style={styles.semPill}>
                  <Text style={[typography.labelSm, { color: colors.textSecondary }]}>
                    {course.semester}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  typography.headlineMd,
                  { color: colors.textPrimary, marginTop: space.xs },
                ]}
              >
                {course.name}
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                {course.sks} SKS · Kelas {course.className || 'TI-3A'} ·{' '}
                {course.lecturerNames?.join(', ') || 'Dr. Ir. Ahmad Fauzi, M.Kom.'}
              </Text>

              {primarySchedule ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/schedule/${primarySchedule.id}` as never)}
                  style={styles.scheduleBanner}
                >
                  <Clock size={16} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: space.sm }}>
                    <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                      {getDayName(primarySchedule.day)},{' '}
                      {formatTimeDot(primarySchedule.startTime)}–
                      {formatTimeDot(primarySchedule.endTime)} WIB
                    </Text>
                    {primarySchedule.status === 'changed' &&
                    primarySchedule.changes?.[0] ? (
                      <View style={styles.deltaRow}>
                        <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                          Ruang{' '}
                        </Text>
                        <Text style={[typography.bodySm, styles.strikeOld]}>
                          {primarySchedule.changes[0].oldValue}
                        </Text>
                        <ArrowRight
                          size={12}
                          color={colors.iconMuted}
                          style={{ marginHorizontal: 4 }}
                        />
                        <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                          {primarySchedule.room}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                        Ruang {primarySchedule.room}
                      </Text>
                    )}
                  </View>
                  {primarySchedule.status === 'changed' ? (
                    <View style={styles.roomChangedChip}>
                      <Text style={[typography.labelBadge, { color: colors.urgentText }]}>
                        Ruang Berubah
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ) : null}

              <View style={styles.progressWrap}>
                <View style={styles.rowBetween}>
                  <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                    Progres Perkuliahan
                  </Text>
                  <Text style={[typography.labelSm, { color: colors.primary }]}>
                    Pertemuan {course.currentMeeting || 7} dari{' '}
                    {course.totalMeetings || 16} (44%)
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '44%' }]} />
                </View>
              </View>

              {/* Aksi Cepat Dosen: Upload Materi & Buat Tugas */}
              {isLecturer ? (
                <View style={styles.lecturerToolbar}>
                  <Button
                    title="+ Upload Materi"
                    size="sm"
                    icon={<Upload size={15} color={colors.white} />}
                    onPress={() =>
                      router.push(`/learning/${course.id}/material/new` as never)
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="+ Buat Tugas"
                    size="sm"
                    variant="secondary"
                    icon={<FilePlus2 size={15} color={colors.primary} />}
                    onPress={() =>
                      router.push(`/learning/${course.id}/assignment/new` as never)
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              ) : null}
            </View>

            {/* Tab Bar: Materi · Tugas · Diskusi · Info & RPS */}
            <View style={styles.tabsRow}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'materi' }}
                onPress={() => setActiveTab('materi')}
                style={[styles.tabBtn, activeTab === 'materi' && styles.tabBtnActive]}
              >
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color:
                        activeTab === 'materi' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Materi
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'tugas' }}
                onPress={() => setActiveTab('tugas')}
                style={[styles.tabBtn, activeTab === 'tugas' && styles.tabBtnActive]}
              >
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color:
                        activeTab === 'tugas' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Tugas
                </Text>
                {pendingTaskCount > 0 ? (
                  <View style={styles.tabCountBadge}>
                    <Text style={[typography.labelBadge, { color: colors.white }]}>
                      {pendingTaskCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'diskusi' }}
                onPress={() => setActiveTab('diskusi')}
                style={[styles.tabBtn, activeTab === 'diskusi' && styles.tabBtnActive]}
              >
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color:
                        activeTab === 'diskusi' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Diskusi
                </Text>
                <View style={styles.unreadDot} />
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'info' }}
                onPress={() => setActiveTab('info')}
                style={[styles.tabBtn, activeTab === 'info' && styles.tabBtnActive]}
              >
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color:
                        activeTab === 'info' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Info & RPS
                </Text>
              </Pressable>
            </View>

            {/* Konten Tab 1: Materi (dikelompokkan per Pertemuan 1-16) */}
            {activeTab === 'materi' ? (
              <View style={styles.tabBody}>
                {materialsQuery.isLoading ? (
                  <SectionSkeleton count={2} />
                ) : materials.length === 0 ? (
                  <EmptyState
                    title="Belum ada materi diunggah"
                    description="Materi perkuliahan per pertemuan akan tampil di sini."
                  />
                ) : (
                  <View style={styles.stackGap}>
                    {materials.map((mat) => (
                      <View key={mat.id} style={styles.meetingGroupCard}>
                        <View style={styles.rowBetween}>
                          <Text style={[typography.labelSm, { color: colors.primary }]}>
                            PERTEMUAN {mat.meeting}
                          </Text>
                          {isLecturer ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Hapus materi"
                              onPress={() => deleteMutation.mutate(mat.id)}
                              style={{ padding: 4 }}
                            >
                              <Trash2 size={16} color={colors.urgent} />
                            </Pressable>
                          ) : null}
                        </View>
                        <View style={{ marginTop: space.xs }}>
                          <FileItem
                            title={mat.title}
                            type={mat.type}
                            sizeBytes={mat.sizeBytes}
                            subtitle={`Diunggah oleh ${
                              mat.uploadedByName || 'Dosen Pengampu'
                            }`}
                            isNew={!mat.isRead}
                            isDownloaded={mat.isDownloadedOffline}
                            onPress={() =>
                              router.push(
                                `/learning/${course.id}/material/${mat.id}` as never
                              )
                            }
                            onDownload={() => toggleOfflineMutation.mutate(mat.id)}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {/* Konten Tab 2: Tugas */}
            {activeTab === 'tugas' ? (
              <View style={styles.tabBody}>
                {assignmentsQuery.isLoading ? (
                  <SectionSkeleton count={2} />
                ) : assignments.length === 0 ? (
                  <EmptyState
                    title="Belum ada tugas"
                    description="Tugas mata kuliah ini akan tampil di sini."
                  />
                ) : (
                  <View style={styles.stackGap}>
                    {assignments.map((asg) => {
                      const sub = asg.submission;
                      const rem = formatRemainingTime(asg.dueAt);
                      const isUrgent = !sub && rem.hoursLeft <= 24;

                      return (
                        <Pressable
                          key={asg.id}
                          accessibilityRole="button"
                          onPress={() =>
                            router.push(
                              `/learning/${course.id}/assignment/${asg.id}` as never
                            )
                          }
                          style={[
                            styles.assignmentCard,
                            isUrgent && styles.assignmentCardUrgent,
                          ]}
                        >
                          <View style={styles.rowBetween}>
                            <View style={styles.rowGap}>
                              {isUrgent ? <PriorityTag priority="urgent" /> : null}
                              {!sub ? (
                                <StatusChip
                                  status={
                                    rem.isOverdue
                                      ? 'assignment_late'
                                      : 'assignment_pending'
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

                            {sub?.status === 'graded' && sub.score !== undefined ? (
                              <View style={styles.scoreBadge}>
                                <Text
                                  style={[typography.labelMd, { color: colors.primary }]}
                                >
                                  Nilai: {sub.score}/100
                                </Text>
                              </View>
                            ) : sub ? (
                              <View style={styles.waitingScorePill}>
                                <Text
                                  style={[
                                    typography.labelBadge,
                                    { color: colors.warningText },
                                  ]}
                                >
                                  Menunggu Nilai Dosen
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={[
                              typography.titleMd,
                              { color: colors.textPrimary, marginTop: space.sm },
                            ]}
                          >
                            {asg.title}
                          </Text>
                          <Text
                            numberOfLines={2}
                            style={[
                              typography.bodySm,
                              { color: colors.textSecondary, marginTop: 4 },
                            ]}
                          >
                            {asg.description}
                          </Text>

                          {!sub ? (
                            <View style={styles.deadlineBox}>
                              <View>
                                <Text
                                  style={[
                                    typography.bodySm,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  Tenggat Waktu
                                </Text>
                                <Text
                                  style={[
                                    typography.titleSm,
                                    { color: colors.textPrimary },
                                  ]}
                                >
                                  {formatDateTimeId(asg.dueAt)}
                                </Text>
                              </View>
                              <View style={styles.remBadge}>
                                <Text
                                  style={[
                                    typography.labelBadge,
                                    { color: colors.urgentText },
                                  ]}
                                >
                                  {rem.label}
                                </Text>
                              </View>
                            </View>
                          ) : null}

                          {sub?.feedback ? (
                            <View style={styles.feedbackBox}>
                              <Text
                                style={[
                                  typography.labelSm,
                                  { color: colors.primary },
                                ]}
                              >
                                Catatan Dosen:
                              </Text>
                              <Text
                                style={[
                                  typography.bodySm,
                                  {
                                    color: colors.textPrimary,
                                    fontStyle: 'italic',
                                    marginTop: 2,
                                  },
                                ]}
                              >
                                &ldquo;{sub.feedback}&rdquo;
                              </Text>
                            </View>
                          ) : null}

                          <View style={{ marginTop: space.md }}>
                            {isLecturer ? (
                              <Button
                                title="Lihat Daftar Pengumpulan Mahasiswa"
                                size="sm"
                                variant="secondary"
                                onPress={() =>
                                  router.push(
                                    `/learning/${course.id}/assignment/${asg.id}/submissions` as never
                                  )
                                }
                              />
                            ) : !sub ? (
                              <Button
                                title="+ Kumpulkan Jawaban"
                                size="sm"
                                onPress={() =>
                                  router.push(
                                    `/learning/${course.id}/assignment/${asg.id}` as never
                                  )
                                }
                              />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {/* Konten Tab 3: Diskusi -> Membuka Room Chat Mata Kuliah */}
            {activeTab === 'diskusi' ? (
              <View style={styles.tabBody}>
                <View style={styles.discussionCard}>
                  <MessageSquare size={32} color={colors.primary} />
                  <Text
                    style={[
                      typography.headlineSm,
                      { color: colors.textPrimary, marginTop: space.sm },
                    ]}
                  >
                    Room Chat {course.name}
                  </Text>
                  <Text
                    style={[
                      typography.bodyMd,
                      {
                        color: colors.textSecondary,
                        textAlign: 'center',
                        marginTop: space.xs,
                      },
                    ]}
                  >
                    Diskusikan materi perkuliahan, tanya jawab tugas, dan lihat pengumuman tersemat langsung bersama Dosen Pengampu & peserta kelas.
                  </Text>
                  <Button
                    title="Masuk Room Chat Mata Kuliah"
                    onPress={() =>
                      router.push(`/chat/${getCourseChatRoomId(course.id || course.code)}` as never)
                    }
                    style={{ marginTop: space.lg, width: '100%' }}
                  />
                </View>
              </View>
            ) : null}

            {/* Konten Tab 4: Info & RPS (Deskripsi MK, RPS file, jadwal, ruangan, dosen, anggota) */}
            {activeTab === 'info' ? (
              <View style={[styles.tabBody, styles.stackGap]}>
                <View style={styles.infoCard}>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    Deskripsi Mata Kuliah
                  </Text>
                  <Text
                    style={[
                      typography.bodyMd,
                      { color: colors.textSecondary, marginTop: space.xs },
                    ]}
                  >
                    {course.description}
                  </Text>
                </View>

                <FileItem
                  title={`Rencana Pembelajaran Semester (RPS) — ${course.code}.pdf`}
                  type="pdf"
                  sizeBytes={1420000}
                  subtitle="Dokumen Silabus Resmi"
                  onPress={() =>
                    useAppStore
                      .getState()
                      .showToast(`Membuka RPS ${course.code}...`)
                  }
                  onDownload={() =>
                    useAppStore
                      .getState()
                      .showToast(`RPS ${course.code} berhasil diunduh`)
                  }
                />

                <View style={styles.infoCard}>
                  <View style={styles.rowCenter}>
                    <Users size={18} color={colors.primary} />
                    <Text
                      style={[
                        typography.titleSm,
                        { color: colors.textPrimary, marginLeft: space.xs },
                      ]}
                    >
                      Dosen & Peserta Kelas ({course.className || 'TI-3A'})
                    </Text>
                  </View>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginTop: space.xs },
                    ]}
                  >
                    Dosen Pengampu:{' '}
                    {course.lecturerNames?.join(', ') ||
                      'Dr. Ir. Ahmad Fauzi, M.Kom.'}
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    Peserta Terdaftar: 32 Mahasiswa Aktif (Rina Salsabila, Ahmad Fadil, dkk.)
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Kartu Bawah: Buka Room Chat Mata Kuliah */}
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push('/chat/66666666-6666-6666-6666-666666666602' as never)
              }
              style={styles.bottomChatBanner}
            >
              <View style={styles.chatIconWrap}>
                <MessageSquare size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  Buka Room Chat Mata Kuliah
                </Text>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Diskusi materi & pengumuman bersama dosen pengampu
                </Text>
              </View>
              <ArrowRight size={18} color={colors.iconMuted} />
            </Pressable>
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
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: space.minTap,
    height: space.minTap,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  courseHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    ...elevation.level1,
  },
  topPills: {
    flexDirection: 'row',
    gap: space.xs,
  },
  codePill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  semPill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  scheduleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginTop: space.md,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  strikeOld: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  roomChangedChip: {
    backgroundColor: colors.urgentSoft,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  progressWrap: {
    marginTop: space.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  lecturerToolbar: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: space.lg,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    marginRight: space.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.unreadDot,
  },
  tabBody: {
    marginTop: space.lg,
  },
  stackGap: {
    gap: space.itemGap,
  },
  meetingGroupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  assignmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  assignmentCardUrgent: {
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  scoreBadge: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  waitingScorePill: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.urgentSoft,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.md,
  },
  remBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  feedbackBox: {
    backgroundColor: colors.tintSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.md,
  },
  discussionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  bottomChatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.xl,
    gap: space.md,
  },
  chatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
