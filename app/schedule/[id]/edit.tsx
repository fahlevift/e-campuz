import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  GraduationCap,
  DoorOpen,
  Clock,
  Calendar,
  ArrowRight,
  Bell,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { Button, ListItemSwitch, SectionSkeleton, ErrorState } from '@/components/ui';
import { useScheduleDetailData, useSchedulesData } from '@/features/useCampusData';
import { getDayName, formatTimeDot } from '@/utils/format';

const ROOM_PRESETS = ['C305', 'Lab Multimedia C305', 'Auditorium Lt. 2', 'Lab Komputer 1'];
const TIME_PRESETS = ['08:00–09:40', '10:00–11:40', '13:00–14:40', '15:30–17:10'];
const DAY_PRESETS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

// Ubah Jadwal / Ruangan (Dosen)
export default function EditScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const detailQuery = useScheduleDetailData(id || '');
  const { updateScheduleMutation } = useSchedulesData();

  const item = detailQuery.data;

  const [changeField, setChangeField] = useState<'room' | 'time' | 'day'>('room');
  const [newValue, setNewValue] = useState('C305');
  const [scope, setScope] = useState<'once' | 'permanent'>('once');
  const [reason, setReason] = useState('');
  const [broadcastToChat, setBroadcastToChat] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

  const hasDirtyChanges = newValue.trim().length > 0 || reason.trim().length > 0;

  // Konfirmasi "Buang perubahan?" saat keluar jika ada isian
  const handleBack = () => {
    if (hasDirtyChanges && reason.trim().length > 0) {
      setDiscardModalVisible(true);
      return;
    }
    router.back();
  };

  const oldBaselineValue =
    changeField === 'room'
      ? item?.room || 'B201'
      : changeField === 'time'
      ? `${item?.startTime || '08:00'}–${item?.endTime || '09:40'}`
      : getDayName(item?.day || 1);

  const handleConfirmSave = async () => {
    if (!item || !newValue.trim()) return;
    setConfirmModalVisible(false);
    await updateScheduleMutation.mutateAsync({
      scheduleId: item.id,
      field: changeField,
      newValue: newValue.trim(),
      scope,
      reason: reason.trim() || undefined,
      broadcastToChat,
    });
    router.back();
  };

  const presets =
    changeField === 'room'
      ? ROOM_PRESETS
      : changeField === 'time'
      ? TIME_PRESETS
      : DAY_PRESETS;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header dengan Badge MODE DOSEN */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={handleBack}
          style={styles.backBtn}
        >
          <ArrowLeft size={space.iconLg} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[typography.titleMd, { color: colors.textPrimary }]}>
            Ubah Jadwal & Ruangan
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            {item?.courseName || 'Pemrograman Perangkat Bergerak'}
          </Text>
        </View>
        <View style={styles.lecturerModeBadge}>
          <GraduationCap size={14} color={colors.primary} />
          <Text style={[typography.labelBadge, { color: colors.primary, marginLeft: 4 }]}>
            MODE DOSEN
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {detailQuery.isLoading ? (
          <SectionSkeleton count={2} />
        ) : detailQuery.isError || !item ? (
          <ErrorState onRetry={() => detailQuery.refetch()} />
        ) : (
          <View>
            {/* Kartu Info Mata Kuliah */}
            <View style={styles.courseCard}>
              <Text style={[typography.labelSm, { color: colors.primary }]}>
                {item.courseCode || 'IF3201'} · Semester Ganjil 2026/2027
              </Text>
              <Text style={[typography.headlineSm, { color: colors.textPrimary, marginTop: 4 }]}>
                {item.courseName} · Kelas {item.className || 'TI-3A'}
              </Text>
              <View style={styles.coursePillsRow}>
                <View style={styles.softPill}>
                  <Text style={[typography.labelBadge, { color: colors.primary }]}>
                    {item.courseSks || 3} SKS
                  </Text>
                </View>
                <View style={[styles.softPill, { backgroundColor: colors.successSoft }]}>
                  <Text style={[typography.labelBadge, { color: colors.successText }]}>
                    32 Mahasiswa Terdaftar
                  </Text>
                </View>
              </View>
            </View>

            {/* Jadwal Saat Ini (Baseline) */}
            <View style={styles.baselineCard}>
              <Text style={[typography.labelSm, { color: colors.textSecondary }]}>
                ● JADWAL SAAT INI (BASELINE)
              </Text>
              <View style={styles.baselineRow}>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Hari & Jam
                </Text>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  {getDayName(item.day)}, {formatTimeDot(item.startTime)}–
                  {formatTimeDot(item.endTime)} WIB
                </Text>
              </View>
              <View style={styles.baselineRow}>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Ruangan Lama
                </Text>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  {item.room}
                </Text>
              </View>
            </View>

            {/* Segmented Jenis Perubahan: Ubah Ruangan | Ubah Jam | Pindah Hari */}
            <Text style={[typography.titleSm, styles.sectionTitle]}>Jenis Perubahan</Text>
            <View style={styles.segmentedRow}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: changeField === 'room' }}
                onPress={() => {
                  setChangeField('room');
                  setNewValue('C305');
                }}
                style={[
                  styles.segItem,
                  changeField === 'room' && styles.segItemActive,
                ]}
              >
                <DoorOpen
                  size={16}
                  color={changeField === 'room' ? colors.primary : colors.iconMuted}
                />
                <Text
                  style={[
                    typography.labelSm,
                    {
                      color:
                        changeField === 'room' ? colors.primary : colors.textSecondary,
                      marginTop: 4,
                    },
                  ]}
                >
                  Ubah Ruangan
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: changeField === 'time' }}
                onPress={() => {
                  setChangeField('time');
                  setNewValue('10:00–11:40');
                }}
                style={[
                  styles.segItem,
                  changeField === 'time' && styles.segItemActive,
                ]}
              >
                <Clock
                  size={16}
                  color={changeField === 'time' ? colors.primary : colors.iconMuted}
                />
                <Text
                  style={[
                    typography.labelSm,
                    {
                      color:
                        changeField === 'time' ? colors.primary : colors.textSecondary,
                      marginTop: 4,
                    },
                  ]}
                >
                  Ubah Jam
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: changeField === 'day' }}
                onPress={() => {
                  setChangeField('day');
                  setNewValue('Rabu');
                }}
                style={[
                  styles.segItem,
                  changeField === 'day' && styles.segItemActive,
                ]}
              >
                <Calendar
                  size={16}
                  color={changeField === 'day' ? colors.primary : colors.iconMuted}
                />
                <Text
                  style={[
                    typography.labelSm,
                    {
                      color:
                        changeField === 'day' ? colors.primary : colors.textSecondary,
                      marginTop: 4,
                    },
                  ]}
                >
                  Pindah Hari
                </Text>
              </Pressable>
            </View>

            {/* Input Nilai Baru + Preview Delta */}
            <View style={styles.inputCard}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                {changeField === 'room'
                  ? 'Pilih / Masukkan Ruangan Baru'
                  : changeField === 'time'
                  ? 'Pilih / Masukkan Jam Baru'
                  : 'Pilih Hari Pengganti'}
              </Text>
              <TextInput
                accessibilityLabel="Nilai baru jadwal"
                value={newValue}
                onChangeText={setNewValue}
                placeholder="Masukkan nilai baru"
                placeholderTextColor={colors.textMuted}
                style={[typography.titleSm, styles.textInput]}
              />

              <View style={styles.presetChipsRow}>
                {presets.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setNewValue(p)}
                    style={[
                      styles.presetChip,
                      newValue === p && styles.presetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        typography.bodySm,
                        {
                          color: newValue === p ? colors.primary : colors.textSecondary,
                          fontWeight: newValue === p ? '700' : '400',
                        },
                      ]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.deltaPreviewRow}>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Perubahan:
                </Text>
                <View style={styles.deltaRight}>
                  <Text style={[typography.bodySm, styles.strikeOld]}>
                    {oldBaselineValue}
                  </Text>
                  <ArrowRight
                    size={14}
                    color={colors.iconMuted}
                    style={{ marginHorizontal: 6 }}
                  />
                  <Text style={[typography.titleSm, { color: colors.primary }]}>
                    {newValue || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Radio Cakupan: Pertemuan Ini Saja | Seterusnya (Permanen) */}
            <Text style={[typography.titleSm, styles.sectionTitle]}>
              Cakupan Perubahan Jadwal
            </Text>
            <View style={styles.scopeGroup}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: scope === 'once' }}
                onPress={() => setScope('once')}
                style={[
                  styles.scopeOption,
                  scope === 'once' && styles.scopeOptionSelected,
                ]}
              >
                <View
                  style={[
                    styles.radioOuter,
                    scope === 'once' && { borderColor: colors.primary },
                  ]}
                >
                  {scope === 'once' ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    Pertemuan Ini Saja
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                    Hanya berlaku untuk pertemuan minggu ini. Pertemuan berikutnya kembali ke jadwal semula.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: scope === 'permanent' }}
                onPress={() => setScope('permanent')}
                style={[
                  styles.scopeOption,
                  scope === 'permanent' && styles.scopeOptionSelected,
                ]}
              >
                <View
                  style={[
                    styles.radioOuter,
                    scope === 'permanent' && { borderColor: colors.primary },
                  ]}
                >
                  {scope === 'permanent' ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    Seterusnya (Permanen)
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                    Berlaku untuk seluruh sisa pertemuan semester ini.
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Input Alasan Perubahan */}
            <Text style={[typography.titleSm, styles.sectionTitle]}>
              Alasan Perubahan (Opsional)
            </Text>
            <TextInput
              accessibilityLabel="Alasan perubahan jadwal"
              value={reason}
              onChangeText={setReason}
              placeholder="Contoh: Pemeliharaan AC dan proyektor di ruang semula."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={[typography.bodyMd, styles.textarea]}
            />

            {/* Info Notifikasi Otomatis + Toggle Siarkan ke Room Chat Kelas */}
            <View style={styles.broadcastCard}>
              <View style={styles.autoNotifRow}>
                <Bell size={18} color={colors.urgent} />
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    Notifikasi Push Dikirim Otomatis
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                    Menyimpan perubahan otomatis mengirimkan notifikasi Mendesak/Penting ke seluruh mahasiswa peserta mata kuliah.
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <ListItemSwitch
                title={`Siarkan ke Room Chat Kelas (${item.className || 'TI-3A'})`}
                description="Otomatis mengirimkan pesan pengumuman di Room Chat Kelas"
                value={broadcastToChat}
                onValueChange={setBroadcastToChat}
              />
            </View>

            {/* Preview Dampak Visual Pada Mahasiswa */}
            <View style={styles.impactPreviewBox}>
              <View style={styles.impactHeader}>
                <CheckCircle2 size={16} color={colors.primary} />
                <Text
                  style={[
                    typography.labelMd,
                    { color: colors.primary, marginLeft: 6 },
                  ]}
                >
                  Dampak Visual Pada Mahasiswa
                </Text>
              </View>
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 4 }]}>
                Mahasiswa akan melihat penanda tag Berubah pada Beranda & Jadwal mereka:
              </Text>
              <View style={styles.impactDeltaBar}>
                <Text style={[typography.labelSm, { color: colors.textSecondary }]}>
                  Tampilan:
                </Text>
                <View style={styles.deltaRight}>
                  <Text style={[typography.bodySm, styles.strikeOld]}>
                    {oldBaselineValue}
                  </Text>
                  <ArrowRight
                    size={14}
                    color={colors.urgent}
                    style={{ marginHorizontal: 6 }}
                  />
                  <Text style={[typography.titleSm, { color: colors.urgentText }]}>
                    {newValue}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tombol Batalkan & Simpan */}
            <View style={styles.footerButtons}>
              <Button
                title="Batalkan"
                variant="ghost"
                onPress={handleBack}
                style={{ flex: 1 }}
              />
              <Button
                title="Simpan & Siarkan"
                onPress={() => setConfirmModalVisible(true)}
                loading={updateScheduleMutation.isPending}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Dialog Konfirmasi Ringkasan Perubahan */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Konfirmasi Perubahan Jadwal
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { color: colors.textSecondary, marginTop: space.xs },
              ]}
            >
              Periksa kembali ringkasan perubahan sebelum disiarkan ke mahasiswa:
            </Text>

            <View style={styles.summaryConfirmBox}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                {item?.courseName}
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 4 }]}>
                Perubahan: {oldBaselineValue} → {newValue}
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                Cakupan: {scope === 'once' ? 'Pertemuan Ini Saja' : 'Seterusnya (Permanen)'}
              </Text>
              {reason ? (
                <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                  Catatan: {reason}
                </Text>
              ) : null}
            </View>

            <View style={styles.modalBtnsRow}>
              <Button
                title="Periksa Lagi"
                variant="ghost"
                onPress={() => setConfirmModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Ya, Simpan"
                onPress={handleConfirmSave}
                loading={updateScheduleMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={discardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDiscardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Buang Perubahan?
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { color: colors.textSecondary, marginTop: space.xs },
              ]}
            >
              Perubahan jadwal/ruangan yang belum disimpan akan hilang.
            </Text>
            <View style={styles.modalBtnsRow}>
              <Button
                title="Lanjut Mengedit"
                variant="ghost"
                onPress={() => setDiscardModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Buang"
                variant="danger"
                onPress={() => {
                  setDiscardModalVisible(false);
                  router.back();
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
  lecturerModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  coursePillsRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  softPill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  baselineCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.md,
    gap: space.xs,
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    padding: 4,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  segItemActive: {
    backgroundColor: colors.surface,
    ...elevation.level1,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.primary,
    padding: space.lg,
    marginTop: space.md,
  },
  textInput: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    color: colors.textPrimary,
    marginTop: space.sm,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  presetChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  presetChipActive: {
    backgroundColor: colors.tintStrong,
  },
  deltaPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deltaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strikeOld: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  scopeGroup: {
    gap: space.sm,
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  scopeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.tintSoft,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.iconMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  textarea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.md,
    color: colors.textPrimary,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  broadcastCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
    padding: space.lg,
    marginTop: space.xl,
  },
  autoNotifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.md,
  },
  impactPreviewBox: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    padding: space.lg,
    marginTop: space.lg,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactDeltaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.screenMargin,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    padding: space.xl,
    ...elevation.level4,
  },
  summaryConfirmBox: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    padding: space.md,
    marginTop: space.md,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
});
