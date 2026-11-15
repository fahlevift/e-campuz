import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  MapPin,
  User as UserIcon,
  BookOpen,
  MessageSquare,
  History,
  Edit3,
  ArrowRight,
  Video,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import {
  ChangeTag,
  StatusChip,
  Button,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useAppStore } from '@/store';
import { useScheduleDetailData, getCourseChatRoomId } from '@/features/useCampusData';
import {
  getDayName,
  formatTimeDot,
  formatDateTimeId,
} from '@/utils/format';

// Detail Jadwal
export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const isLecturer = user?.role === 'dosen';

  const scheduleQuery = useScheduleDetailData(id || '');
  const item = scheduleQuery.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={space.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typography.titleMd, { color: colors.textPrimary }]}>
          Detail Jadwal Kuliah
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {scheduleQuery.isLoading ? (
          <SectionSkeleton count={2} />
        ) : scheduleQuery.isError ? (
          <ErrorState onRetry={() => scheduleQuery.refetch()} />
        ) : !item ? (
          <EmptyState
            title="Jadwal tidak ditemukan"
            description="Data jadwal mungkin telah diperbarui atau dihapus."
            actionLabel="Kembali ke Jadwal"
            onAction={() => router.replace('/(tabs)/schedule' as never)}
          />
        ) : (
          <View>
            {/* Kartu Utama Info Jadwal */}
            <View
              style={[
                styles.mainCard,
                item.status === 'changed' && styles.mainCardChanged,
              ]}
            >
              <View style={styles.topPillsRow}>
                <View style={styles.codePill}>
                  <Text style={[typography.labelSm, { color: colors.primary }]}>
                    {item.courseCode || 'IF3201'} · {item.courseSks || 3} SKS
                  </Text>
                </View>
                {item.status === 'changed' ? (
                  <ChangeTag />
                ) : item.status === 'cancelled' ? (
                  <StatusChip status="schedule_cancelled" />
                ) : (
                  <StatusChip status="schedule_normal" />
                )}
              </View>

              <Text
                style={[
                  typography.headlineMd,
                  { color: colors.textPrimary, marginTop: space.sm },
                ]}
              >
                {item.courseName}
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                Kelas {item.className || 'TI-3A'} ·{' '}
                {item.type === 'teori'
                  ? 'Perkuliahan Teori'
                  : item.type === 'praktikum'
                  ? 'Praktikum Laboratorium'
                  : 'Perkuliahan Daring (Online)'}
              </Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Clock size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                      Hari & Jam Perkuliahan
                    </Text>
                    <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                      {getDayName(item.day)}, {formatTimeDot(item.startTime)}–
                      {formatTimeDot(item.endTime)} WIB
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <MapPin size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                      Lokasi / Ruangan
                    </Text>
                    {item.status === 'changed' && item.changes?.[0]?.field === 'room' ? (
                      <View style={styles.deltaRow}>
                        <Text style={[typography.bodyMd, styles.oldText]}>
                          {item.changes[0].oldValue}
                        </Text>
                        <ArrowRight
                          size={14}
                          color={colors.iconMuted}
                          style={{ marginHorizontal: 6 }}
                        />
                        <Text style={[typography.titleSm, { color: colors.urgentText }]}>
                          {item.changes[0].newValue}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                        {item.room}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <UserIcon size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                      Dosen Pengampu
                    </Text>
                    <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                      {item.lecturerNames?.join(', ') || 'Dr. Ir. Ahmad Fauzi, M.Kom.'}
                    </Text>
                  </View>
                </View>
              </View>

              {item.type === 'online' && item.onlineUrl ? (
                <Button
                  title="Buka Tautan Kelas Online"
                  icon={<Video size={18} color={colors.white} />}
                  onPress={() => Linking.openURL(item.onlineUrl!)}
                  style={{ marginTop: space.lg }}
                />
              ) : null}

              <View style={styles.quickActionRow}>
                <Button
                  title="Buka Materi & Tugas"
                  variant="secondary"
                  size="sm"
                  icon={<BookOpen size={16} color={colors.primary} />}
                  onPress={() => router.push(`/learning/${item.courseId}` as never)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Room Chat MK"
                  variant="secondary"
                  size="sm"
                  icon={<MessageSquare size={16} color={colors.primary} />}
                  onPress={() =>
                    router.push(`/chat/${getCourseChatRoomId(item.courseId || item.courseCode)}` as never)
                  }
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            {/* Tombol Khusus Dosen: Ubah Jadwal & Ubah Ruangan */}
            {isLecturer ? (
              <View style={styles.lecturerBox}>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  Kelola Jadwal Perkuliahan (Mode Dosen)
                </Text>
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.textSecondary, marginTop: 2, marginBottom: space.md },
                  ]}
                >
                  Perubahan ruangan atau jam akan langsung mengirimkan notifikasi ke seluruh mahasiswa peserta mata kuliah.
                </Text>
                <View style={styles.lecturerBtns}>
                  <Button
                    title="Ubah Ruangan / Jadwal"
                    icon={<Edit3 size={18} color={colors.white} />}
                    onPress={() => router.push(`/schedule/${item.id}/edit` as never)}
                  />
                </View>
              </View>
            ) : null}

            {/* Riwayat Perubahan Jadwal */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <History size={18} color={colors.primary} />
                <Text
                  style={[
                    typography.headlineSm,
                    { color: colors.textPrimary, marginLeft: space.xs },
                  ]}
                >
                  Riwayat Perubahan
                </Text>
              </View>

              {!item.changes || item.changes.length === 0 ? (
                <View style={styles.noChangeCard}>
                  <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
                    Belum ada riwayat perubahan pada jadwal mata kuliah ini.
                  </Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {item.changes.map((chg) => (
                    <View key={chg.id} style={styles.historyCard}>
                      <View style={styles.historyTopRow}>
                        <View style={styles.scopePill}>
                          <Text style={[typography.labelBadge, { color: colors.warningText }]}>
                            {chg.scope === 'once' ? 'Pertemuan Ini Saja' : 'Permanen'}
                          </Text>
                        </View>
                        <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                          {formatDateTimeId(chg.changedAt)}
                        </Text>
                      </View>

                      <View style={[styles.deltaRow, { marginTop: space.sm }]}>
                        <Text style={[typography.labelMd, { color: colors.textSecondary }]}>
                          {chg.field === 'room'
                            ? 'Ruangan: '
                            : chg.field === 'time'
                            ? 'Jam: '
                            : chg.field === 'day'
                            ? 'Hari: '
                            : 'Status: '}
                        </Text>
                        <Text style={[typography.bodyMd, styles.oldText]}>
                          {chg.oldValue}
                        </Text>
                        <ArrowRight
                          size={15}
                          color={colors.iconMuted}
                          style={{ marginHorizontal: 6 }}
                        />
                        <View style={styles.newBox}>
                          <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                            {chg.newValue}
                          </Text>
                        </View>
                      </View>

                      {chg.reason ? (
                        <Text
                          style={[
                            typography.bodySm,
                            { color: colors.textSecondary, marginTop: space.sm },
                          ]}
                        >
                          Alasan: &ldquo;{chg.reason}&rdquo;
                        </Text>
                      ) : null}

                      <Text
                        style={[
                          typography.bodySm,
                          { color: colors.textMuted, marginTop: space.xs },
                        ]}
                      >
                        Diubah oleh: {chg.changedByName || 'Dr. Ir. Ahmad Fauzi, M.Kom.'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    ...elevation.level1,
  },
  mainCardChanged: {
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  topPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codePill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  infoGrid: {
    marginTop: space.lg,
    gap: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  oldText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  newBox: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
  lecturerBox: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    padding: space.lg,
    marginTop: space.xl,
  },
  lecturerBtns: {
    marginTop: space.xs,
  },
  historySection: {
    marginTop: space.sectionGap,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
  },
  noChangeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  historyList: {
    gap: space.itemGap,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
    padding: space.lg,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scopePill: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
});
