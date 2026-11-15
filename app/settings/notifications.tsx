import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronUp,
  Moon,
  AlertTriangle,
  Info,
  RotateCcw,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { ListItemSwitch, Button } from '@/components/ui';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/store';
import {
  useNotificationsData,
  useCoursesData,
  useChatRoomsData,
} from '@/features/useCampusData';
import { NotifCategory, NotificationPreferences } from '@/types';

const CATEGORY_CONFIG: Array<{
  key: NotifCategory;
  title: string;
  subtitle: string;
  subtypes: Array<{ key: string; label: string; isCritical?: boolean }>;
}> = [
  {
    key: 'SCHEDULE',
    title: 'Jadwal Kuliah',
    subtitle: 'Perubahan jadwal, ruangan, pembatalan & pengingat kuliah',
    subtypes: [
      { key: 'SCHEDULE_CHANGED', label: 'Perubahan jadwal' },
      { key: 'ROOM_CHANGED', label: 'Perubahan ruangan', isCritical: true },
      { key: 'CLASS_CANCELLED', label: 'Kelas dibatalkan' },
      { key: 'CLASS_REMINDER', label: 'Pengingat kuliah sebelum mulai' },
    ],
  },
  {
    key: 'ASSIGNMENT',
    title: 'Tugas Akademik',
    subtitle: 'Tugas baru, pengingat deadline & nilai keluar',
    subtypes: [
      { key: 'ASSIGNMENT_NEW', label: 'Tugas baru diterbitkan' },
      { key: 'ASSIGNMENT_DUE_REMINDER', label: 'Pengingat deadline tugas' },
      { key: 'ASSIGNMENT_GRADED', label: 'Nilai tugas keluar' },
    ],
  },
  {
    key: 'FINANCE',
    title: 'Keuangan / UKT',
    subtitle: 'Tagihan terbit, jatuh tempo & lewat jatuh tempo',
    subtypes: [
      { key: 'UKT_BILL_ISSUED', label: 'Tagihan UKT terbit' },
      { key: 'UKT_DUE_REMINDER', label: 'Pengingat jatuh tempo (H-14, H-7, H-3, H-1)' },
      { key: 'UKT_OVERDUE', label: 'Lewat jatuh tempo', isCritical: true },
      { key: 'UKT_PAID', label: 'Konfirmasi pembayaran lunas' },
    ],
  },
  {
    key: 'LEARNING',
    title: 'Pembelajaran',
    subtitle: 'Materi baru diunggah dosen per mata kuliah',
    subtypes: [{ key: 'MATERIAL_UPLOADED', label: 'Materi baru diunggah' }],
  },
  {
    key: 'CHAT',
    title: 'Room Chat',
    subtitle: 'Mention @nama, pengumuman tersemat & pesan baru',
    subtypes: [
      { key: 'CHAT_MENTION', label: 'Mention (@nama)' },
      { key: 'CHAT_ANNOUNCEMENT', label: 'Pengumuman kelas & mata kuliah' },
      { key: 'CHAT_ALL', label: 'Semua pesan chat' },
    ],
  },
  {
    key: 'SUPPORT',
    title: 'Layanan Bantuan',
    subtitle: 'Perubahan status tiket & balasan petugas',
    subtypes: [
      { key: 'TICKET_STATUS_CHANGED', label: 'Update status tiket' },
      { key: 'TICKET_REPLIED', label: 'Balasan petugas layanan' },
    ],
  },
  {
    key: 'ANNOUNCEMENT',
    title: 'Pengumuman Kampus',
    subtitle: 'Informasi resmi akademik & kemahasiswaan',
    subtypes: [{ key: 'CAMPUS_ANNOUNCEMENT', label: 'Pengumuman kampus' }],
  },
];

// Preferensi Notifikasi
export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { notifPrefs, savePreferences } = useNotificationsData();
  const { data: courses } = useCoursesData();
  const { data: chatRooms } = useChatRoomsData();

  const [expandedCat, setExpandedCat] = useState<NotifCategory | null>('SCHEDULE');
  const [riskDialog, setRiskDialog] = useState<{
    cat: NotifCategory;
    typeKey: string;
    label: string;
  } | null>(null);

  const mutedRooms = (chatRooms || []).filter((r) => Boolean(r.mutedUntil));

  const updateAndSave = (next: NotificationPreferences) => {
    savePreferences(next);
  };

  const handleToggleMasterPush = (val: boolean) => {
    updateAndSave({
      ...notifPrefs,
      pushEnabled: val,
    });
  };

  const handleToggleCategory = (cat: NotifCategory, val: boolean) => {
    updateAndSave({
      ...notifPrefs,
      categories: {
        ...notifPrefs.categories,
        [cat]: {
          ...notifPrefs.categories[cat],
          enabled: val,
        },
      },
    });
  };

  const handleToggleSubtype = (
    cat: NotifCategory,
    typeKey: string,
    label: string,
    isCritical: boolean | undefined,
    val: boolean
  ) => {
    // Saat pengguna mematikan "Perubahan ruangan" atau "Lewat jatuh tempo", tampilkan dialog konfirmasi risiko
    if (!val && isCritical) {
      setRiskDialog({ cat, typeKey, label });
      return;
    }
    applySubtypeToggle(cat, typeKey, val);
  };

  const applySubtypeToggle = (cat: NotifCategory, typeKey: string, val: boolean) => {
    updateAndSave({
      ...notifPrefs,
      categories: {
        ...notifPrefs.categories,
        [cat]: {
          ...notifPrefs.categories[cat],
          types: {
            ...notifPrefs.categories[cat].types,
            [typeKey]: val,
          },
        },
      },
    });
  };

  const handleSetClassReminder = (minutes: 15 | 30 | 60) => {
    updateAndSave({
      ...notifPrefs,
      classReminderMinutes: minutes,
    });
  };

  const handleToggleAssignmentReminder = (opt: 'H-3' | 'H-1' | '6h') => {
    const exists = notifPrefs.assignmentReminders.includes(opt);
    const nextList = exists
      ? notifPrefs.assignmentReminders.filter((x) => x !== opt)
      : [...notifPrefs.assignmentReminders, opt];
    updateAndSave({
      ...notifPrefs,
      assignmentReminders: nextList,
    });
  };

  const handleToggleCourseMaterial = (courseId: string) => {
    const isMuted = notifPrefs.mutedCourseIdsForMaterial.includes(courseId);
    const nextMuted = isMuted
      ? notifPrefs.mutedCourseIdsForMaterial.filter((id) => id !== courseId)
      : [...notifPrefs.mutedCourseIdsForMaterial, courseId];
    updateAndSave({
      ...notifPrefs,
      mutedCourseIdsForMaterial: nextMuted,
    });
  };

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
          Preferensi Notifikasi
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset ke Default"
          onPress={() => updateAndSave(DEFAULT_NOTIFICATION_PREFERENCES)}
        >
          <Text style={[typography.labelMd, { color: colors.primary }]}>Reset Default</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info: Mematikan hanya menghentikan push, tetap tercatat di Pusat Notifikasi */}
        <View style={styles.infoBanner}>
          <Info size={18} color={colors.primary} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.textSecondary, marginLeft: space.sm, flex: 1 },
            ]}
          >
            Mematikan kategori hanya menghentikan notifikasi push ke layar ponsel. Semua informasi tetap tercatat di Pusat Notifikasi agar tidak hilang.
          </Text>
        </View>

        {/* 1. Master Switch Izinkan Notifikasi Push */}
        <View style={styles.card}>
          <ListItemSwitch
            icon={<Bell size={20} color={colors.primary} />}
            title="Izinkan Notifikasi Push"
            description="Terima pemberitahuan langsung di perangkat Anda"
            value={notifPrefs.pushEnabled}
            onValueChange={handleToggleMasterPush}
          />
          {!notifPrefs.pushEnabled ? (
            <View style={styles.systemPermBanner}>
              <Text style={[typography.bodySm, { color: colors.warningText, flex: 1 }]}>
                Push dinonaktifkan. Anda juga dapat memeriksa izin notifikasi sistem ponsel.
              </Text>
              <Button
                title="Buka Pengaturan"
                size="sm"
                variant="secondary"
                onPress={() => Linking.openSettings()}
              />
            </View>
          ) : null}
        </View>

        {/* 2. Per Kategori dengan Sub-item */}
        <Text style={[typography.labelSm, styles.sectionCaps]}>
          PENGATURAN PER KATEGORI
        </Text>

        <View style={styles.stackGap}>
          {CATEGORY_CONFIG.map((cat) => {
            const catState = notifPrefs.categories[cat.key];
            const isExpanded = expandedCat === cat.key;

            return (
              <View key={cat.key} style={styles.card}>
                <View style={styles.catHeaderRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Buka pengaturan ${cat.title}`}
                    onPress={() =>
                      setExpandedCat(isExpanded ? null : cat.key)
                    }
                    style={{ flex: 1, paddingRight: space.sm }}
                  >
                    <View style={styles.catTitleInline}>
                      <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                        {cat.title}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={18} color={colors.iconMuted} />
                      ) : (
                        <ChevronDown size={18} color={colors.iconMuted} />
                      )}
                    </View>
                    <Text
                      style={[
                        typography.bodySm,
                        { color: colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {cat.subtitle}
                    </Text>
                  </Pressable>

                  <ListItemSwitch
                    title=""
                    value={catState?.enabled ?? true}
                    onValueChange={(val) => handleToggleCategory(cat.key, val)}
                  />
                </View>

                {isExpanded && catState?.enabled ? (
                  <View style={styles.subtypesContainer}>
                    {cat.subtypes.map((sub) => (
                      <ListItemSwitch
                        key={sub.key}
                        title={sub.label}
                        value={catState.types[sub.key] ?? true}
                        onValueChange={(val) =>
                          handleToggleSubtype(
                            cat.key,
                            sub.key,
                            sub.label,
                            sub.isCritical,
                            val
                          )
                        }
                      />
                    ))}

                    {/* Opsi waktu pengingat kuliah (15 / 30 / 60 menit) */}
                    {cat.key === 'SCHEDULE' ? (
                      <View style={styles.extraOptionBox}>
                        <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                          Waktu Pengingat Sebelum Kuliah:
                        </Text>
                        <View style={styles.pillsRow}>
                          {([15, 30, 60] as const).map((mins) => {
                            const active = notifPrefs.classReminderMinutes === mins;
                            return (
                              <Pressable
                                key={mins}
                                accessibilityRole="button"
                                onPress={() => handleSetClassReminder(mins)}
                                style={[
                                  styles.optionPill,
                                  active && styles.optionPillActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    typography.labelSm,
                                    {
                                      color: active
                                        ? colors.white
                                        : colors.textSecondary,
                                    },
                                  ]}
                                >
                                  {mins} menit
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}

                    {/* Opsi pengingat deadline tugas (H-3, H-1, 6 jam — multi pilih) */}
                    {cat.key === 'ASSIGNMENT' ? (
                      <View style={styles.extraOptionBox}>
                        <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                          Jadwal Pengingat Deadline (Multi-pilih):
                        </Text>
                        <View style={styles.pillsRow}>
                          {(['H-3', 'H-1', '6h'] as const).map((opt) => {
                            const active = notifPrefs.assignmentReminders.includes(opt);
                            return (
                              <Pressable
                                key={opt}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: active }}
                                onPress={() => handleToggleAssignmentReminder(opt)}
                                style={[
                                  styles.optionPill,
                                  active && styles.optionPillActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    typography.labelSm,
                                    {
                                      color: active
                                        ? colors.white
                                        : colors.textSecondary,
                                    },
                                  ]}
                                >
                                  {opt === '6h' ? '6 jam sebelum' : opt}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ) : null}

                    {/* Pilihan materi baru per mata kuliah */}
                    {cat.key === 'LEARNING' && (courses || []).length > 0 ? (
                      <View style={styles.extraOptionBox}>
                        <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                          Pilih Mata Kuliah Aktif:
                        </Text>
                        {(courses || []).map((course) => {
                          const enabled =
                            !notifPrefs.mutedCourseIdsForMaterial.includes(course.id);
                          return (
                            <ListItemSwitch
                              key={course.id}
                              title={course.name}
                              description={course.code}
                              value={enabled}
                              onValueChange={() => handleToggleCourseMaterial(course.id)}
                            />
                          );
                        })}
                      </View>
                    ) : null}

                    {/* Daftar room chat yang sedang di-mute */}
                    {cat.key === 'CHAT' ? (
                      <View style={styles.extraOptionBox}>
                        <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                          Room Chat yang Dibisukan ({mutedRooms.length}):
                        </Text>
                        {mutedRooms.length === 0 ? (
                          <Text
                            style={[
                              typography.bodySm,
                              { color: colors.textSecondary, marginTop: 4 },
                            ]}
                          >
                            Tidak ada room chat yang sedang dibisukan.
                          </Text>
                        ) : (
                          mutedRooms.map((r) => (
                            <Text
                              key={r.id}
                              style={[
                                typography.bodySm,
                                { color: colors.warningText, marginTop: 4 },
                              ]}
                            >
                              • {r.name} (Dibisukan)
                            </Text>
                          ))
                        )}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* 3. Jam Tenang (Quiet Hours) */}
        <Text style={[typography.labelSm, styles.sectionCaps]}>
          JAM TENANG (QUIET HOURS)
        </Text>
        <View style={styles.card}>
          <ListItemSwitch
            icon={<Moon size={20} color={colors.primary} />}
            title="Aktifkan Jam Tenang"
            description={`Senyap otomatis pukul ${notifPrefs.quietHours.start} – ${notifPrefs.quietHours.end} WIB`}
            value={notifPrefs.quietHours.enabled}
            onValueChange={(val) =>
              updateAndSave({
                ...notifPrefs,
                quietHours: { ...notifPrefs.quietHours, enabled: val },
              })
            }
          />

          {notifPrefs.quietHours.enabled ? (
            <View style={styles.subtypesContainer}>
              <View style={styles.quietTimeRow}>
                <View style={styles.timePillBox}>
                  <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                    Mulai
                  </Text>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    {notifPrefs.quietHours.start} WIB
                  </Text>
                </View>
                <View style={styles.timePillBox}>
                  <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                    Selesai
                  </Text>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    {notifPrefs.quietHours.end} WIB
                  </Text>
                </View>
              </View>

              <ListItemSwitch
                title="Izinkan notifikasi mendesak saat jam tenang"
                description="Tetap bunyikan jika ruangan kuliah berubah mendadak"
                value={notifPrefs.quietHours.allowUrgent}
                onValueChange={(val) =>
                  updateAndSave({
                    ...notifPrefs,
                    quietHours: { ...notifPrefs.quietHours, allowUrgent: val },
                  })
                }
              />
            </View>
          ) : null}
        </View>

        {/* 4. Reset ke Default */}
        <Button
          title="Kembalikan ke Pengaturan Default"
          variant="secondary"
          icon={<RotateCcw size={16} color={colors.primary} />}
          onPress={() => updateAndSave(DEFAULT_NOTIFICATION_PREFERENCES)}
          style={{ marginTop: space.xl }}
        />
      </ScrollView>

      {/* Dialog Konfirmasi Risiko saat mematikan Perubahan Ruangan / Lewat Jatuh Tempo */}
      <Modal
        visible={Boolean(riskDialog)}
        transparent
        animationType="fade"
        onRequestClose={() => setRiskDialog(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconCircle}>
              <AlertTriangle size={24} color={colors.urgent} />
            </View>
            <Text
              style={[
                typography.headlineSm,
                { color: colors.textPrimary, textAlign: 'center' },
              ]}
            >
              Matikan Notifikasi Penting?
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
              Jika Anda mematikan{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {riskDialog?.label}
              </Text>
              , Anda berisiko terlambat mengetahui perpindahan ruangan mendadak atau denda keterlambatan UKT.
            </Text>

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="secondary"
                onPress={() => setRiskDialog(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Tetap Matikan"
                variant="danger"
                onPress={() => {
                  if (riskDialog) {
                    applySubtypeToggle(riskDialog.cat, riskDialog.typeKey, false);
                  }
                  setRiskDialog(null);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  systemPermBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.input,
    padding: space.sm,
    marginBottom: space.sm,
    gap: space.sm,
  },
  sectionCaps: {
    color: colors.textSecondary,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  stackGap: {
    gap: space.itemGap,
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catTitleInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  subtypesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: space.xs,
    paddingTop: space.xs,
  },
  extraOptionBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    padding: space.md,
    marginVertical: space.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  optionPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  optionPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  quietTimeRow: {
    flexDirection: 'row',
    gap: space.md,
    marginVertical: space.sm,
  },
  timePillBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    padding: space.md,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.screenMargin,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    padding: space.xl,
    alignItems: 'center',
    ...elevation.level4,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.urgentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xl,
    width: '100%',
  },
});
