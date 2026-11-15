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
  Calendar,
  Clock,
  FileUp,
  Info,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { Button, ListItemSwitch } from '@/components/ui';
import { useCourseDetailData, useAssignmentsData } from '@/features/useCampusData';

// Buat Tugas (Dosen)
export default function CreateAssignmentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const { courseQuery } = useCourseDetailData(courseId || '');
  const { createMutation } = useAssignmentsData(courseId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDaysFromNow, setDueDaysFromNow] = useState<1 | 3 | 7>(3);
  const [dueTime, setDueTime] = useState('23:59');
  const [submissionType, setSubmissionType] = useState<'file' | 'text'>('file');
  const [allowLate, setAllowLate] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([
    'Panduan_Tugas_Mahasiswa.pdf',
  ]);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

  const course = courseQuery.data;

  // Konfirmasi keluar saat ada isian
  const handleBack = () => {
    if (title.trim().length > 0 || description.trim().length > 0) {
      setDiscardModalVisible(true);
      return;
    }
    router.back();
  };

  const handlePublish = async () => {
    const finalTitle =
      title.trim() || 'Tugas 05: Implementasi CRUD & Sinkronisasi Supabase';
    const finalDesc =
      description.trim() ||
      'Kerjakan sesuai spesifikasi modul dan kumpulkan sebelum batas waktu berakhir.';
    const dueDate = new Date(
      Date.now() + dueDaysFromNow * 24 * 3600 * 1000
    ).toISOString();

    await createMutation.mutateAsync({
      courseId: courseId || '44444444-4444-4444-4444-444444444401',
      title: finalTitle,
      description: finalDesc,
      attachments,
      dueAt: dueDate,
      allowLate,
      submissionType,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            Buat Tugas Baru
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            {course?.name || 'Pemrograman Perangkat Bergerak'}
          </Text>
        </View>
        <View style={styles.modeBadge}>
          <GraduationCap size={14} color={colors.primary} />
          <Text style={[typography.labelBadge, { color: colors.primary, marginLeft: 4 }]}>
            MODE DOSEN
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Kartu Info MK */}
        <View style={styles.courseCard}>
          <Text style={[typography.labelSm, { color: colors.primary }]}>
            {course?.code || 'IF3201'} · {course?.semester || 'Ganjil 2026/2027'}
          </Text>
          <Text style={[typography.headlineSm, { color: colors.textPrimary, marginTop: 2 }]}>
            {course?.name || 'Pemrograman Perangkat Bergerak'} · Kelas{' '}
            {course?.className || 'TI-3A'}
          </Text>
        </View>

        {/* Judul & Deskripsi */}
        <View style={styles.card}>
          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
            Judul Tugas
          </Text>
          <TextInput
            accessibilityLabel="Judul Tugas"
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Tugas 05: Implementasi CRUD Supabase"
            placeholderTextColor={colors.textMuted}
            style={[typography.bodyMd, styles.input]}
          />

          <Text
            style={[
              typography.titleSm,
              { color: colors.textPrimary, marginTop: space.md },
            ]}
          >
            Deskripsi & Petunjuk Tugas
          </Text>
          <TextInput
            accessibilityLabel="Deskripsi Tugas"
            value={description}
            onChangeText={setDescription}
            placeholder="Tuliskan instruksi pengerjaan dan kriteria pengumpulan…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={[typography.bodyMd, styles.textarea]}
          />

          <Text
            style={[
              typography.titleSm,
              { color: colors.textPrimary, marginTop: space.md },
            ]}
          >
            Lampiran Soal Dosen
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setAttachments((prev) => [
                ...prev,
                `Lampiran_Soal_${prev.length + 1}.pdf`,
              ])
            }
            style={styles.attachBox}
          >
            <FileUp size={20} color={colors.primary} />
            <Text style={[typography.labelMd, { color: colors.primary, marginLeft: 8 }]}>
              + Tambah Berkas Lampiran Soal ({attachments.length} terlampir)
            </Text>
          </Pressable>
        </View>

        {/* Batas Waktu Pengumpulan */}
        <View style={styles.card}>
          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
            Batas Waktu Pengumpulan (Deadline)
          </Text>

          <View style={styles.pillsRow}>
            {(
              [
                { days: 1 as const, label: 'Besok (H+1)' },
                { days: 3 as const, label: '3 Hari Lagi' },
                { days: 7 as const, label: '1 Minggu Lagi' },
              ]
            ).map((opt) => {
              const active = dueDaysFromNow === opt.days;
              return (
                <Pressable
                  key={opt.days}
                  accessibilityRole="button"
                  onPress={() => setDueDaysFromNow(opt.days)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Calendar
                    size={14}
                    color={active ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      typography.labelSm,
                      {
                        color: active ? colors.white : colors.textSecondary,
                        marginLeft: 4,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.timeRow}>
            <Clock size={16} color={colors.iconMuted} />
            <Text
              style={[
                typography.bodySm,
                { color: colors.textSecondary, marginLeft: 6 },
              ]}
            >
              Jam Berakhir:
            </Text>
            <TextInput
              accessibilityLabel="Jam berakhir"
              value={dueTime}
              onChangeText={setDueTime}
              style={[typography.titleSm, styles.timeInput]}
            />
            <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
              WIB
            </Text>
          </View>

          <View style={styles.infoNote}>
            <Info size={16} color={colors.primary} />
            <Text
              style={[
                typography.bodySm,
                { color: colors.textSecondary, marginLeft: 8, flex: 1 },
              ]}
            >
              Sistem akan otomatis mengaktifkan jadwal pengingat H-3, H-1, dan 6 jam ke notifikasi mahasiswa.
            </Text>
          </View>
        </View>

        {/* Ketentuan Pengumpulan: Unggah File | Teks + Toggle Izinkan Terlambat */}
        <View style={styles.card}>
          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
            Ketentuan Pengumpulan Mahasiswa
          </Text>

          <View style={styles.segmentedRow}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: submissionType === 'file' }}
              onPress={() => setSubmissionType('file')}
              style={[
                styles.segBtn,
                submissionType === 'file' && styles.segBtnActive,
              ]}
            >
              <Text
                style={[
                  typography.labelMd,
                  {
                    color:
                      submissionType === 'file'
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Unggah File
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: submissionType === 'text' }}
              onPress={() => setSubmissionType('text')}
              style={[
                styles.segBtn,
                submissionType === 'text' && styles.segBtnActive,
              ]}
            >
              <Text
                style={[
                  typography.labelMd,
                  {
                    color:
                      submissionType === 'text'
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Teks Jawaban
              </Text>
            </Pressable>
          </View>

          <ListItemSwitch
            title="Izinkan pengumpulan terlambat"
            description="Pengumpulan tetap dibuka lewat batas waktu namun otomatis ditandai status Terlambat"
            value={allowLate}
            onValueChange={setAllowLate}
          />
        </View>

        {/* Tombol Terbitkan Tugas */}
        <Button
          title="Terbitkan Tugas"
          loading={createMutation.isPending}
          onPress={handlePublish}
          style={{ marginTop: space.xl }}
        />
      </ScrollView>

      <Modal
        visible={discardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDiscardModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: space.screenMargin,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.card,
              padding: space.xl,
              ...elevation.level4,
            }}
          >
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Buang Perubahan?
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { color: colors.textSecondary, marginTop: space.xs },
              ]}
            >
              Formulir tugas yang belum diterbitkan akan hilang.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: space.md,
                marginTop: space.lg,
              }}
            >
              <Button
                title="Lanjut Mengisi"
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
  modeBadge: {
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
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.primary,
    padding: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    minHeight: space.controlHeight,
    color: colors.textPrimary,
    marginTop: space.xs,
  },
  textarea: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: space.md,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: space.xs,
  },
  attachBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.tintStrong,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
    gap: space.xs,
  },
  timeInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    color: colors.textPrimary,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.md,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    padding: 4,
    marginTop: space.sm,
    marginBottom: space.sm,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  segBtnActive: {
    backgroundColor: colors.surface,
    ...elevation.level1,
  },
});
