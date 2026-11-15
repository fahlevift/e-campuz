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
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  Link as LinkIcon,
  Video,
  UploadCloud,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { Button, ListItemSwitch } from '@/components/ui';
import { useCourseDetailData, useMaterialsData } from '@/features/useCampusData';

// Upload Materi (Dosen)
export default function UploadMaterialScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const { courseQuery } = useCourseDetailData(courseId || '');
  const { uploadMutation } = useMaterialsData(courseId);

  const [meeting, setMeeting] = useState(8);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'pdf' | 'link' | 'video'>('pdf');
  const [fileUrl, setFileUrl] = useState('Modul_08_Integrasi_Supabase.pdf');
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number>(100);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);

  const course = courseQuery.data;

  // Peringatan perubahan belum disimpan saat keluar
  const handleBack = () => {
    if (title.trim().length > 0 || description.trim().length > 0) {
      setDiscardModalVisible(true);
      return;
    }
    router.back();
  };

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]?.name) {
        setUploadProgress(40);
        setTimeout(() => {
          setFileUrl(res.assets[0].name);
          setUploadProgress(100);
        }, 300);
      }
    } catch {
      // ignore
    }
  };

  const handlePublish = async () => {
    const finalTitle =
      title.trim() || `Modul Pertemuan ${meeting}: Integrasi Supabase & Offline Cache`;
    await uploadMutation.mutateAsync({
      courseId: courseId || '44444444-4444-4444-4444-444444444401',
      meeting,
      title: finalTitle,
      description: description.trim() || undefined,
      type: contentType,
      url: fileUrl,
      sizeBytes: 4200000,
      notifyStudents,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header + Badge MODE DOSEN */}
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
            Upload Materi Kuliah
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
            {course?.code || 'IF3201'} · {course?.semester || 'Semester Ganjil 2026/2027'}
          </Text>
          <Text style={[typography.headlineSm, { color: colors.textPrimary, marginTop: 4 }]}>
            {course?.name || 'Pemrograman Perangkat Bergerak'} · Kelas{' '}
            {course?.className || 'TI-3A'}
          </Text>
        </View>

        {/* Pilih Pertemuan (1-16) */}
        <View style={styles.fieldCard}>
          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
            Target Pertemuan Kuliah (1–16)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.meetingPillsRow}
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map((m) => {
              const active = meeting === m;
              return (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityLabel={`Pertemuan ${m}`}
                  onPress={() => setMeeting(m)}
                  style={[styles.meetingPill, active && styles.meetingPillActive]}
                >
                  <Text
                    style={[
                      typography.labelMd,
                      { color: active ? colors.white : colors.textSecondary },
                    ]}
                  >
                    P-{m}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Input Judul (dengan counter) & Deskripsi Opsional */}
        <View style={styles.fieldCard}>
          <View style={styles.rowBetween}>
            <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
              Judul Materi Kuliah
            </Text>
            <Text style={[typography.bodySm, { color: colors.textMuted }]}>
              {title.length}/100
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Judul Materi Kuliah"
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, 100))}
            placeholder={`Contoh: Modul ${meeting}: Arsitektur & State Management`}
            placeholderTextColor={colors.textMuted}
            style={[typography.bodyMd, styles.input]}
          />

          <View style={[styles.rowBetween, { marginTop: space.md }]}>
            <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
              Deskripsi & Instruksi (Opsional)
            </Text>
            <Text style={[typography.bodySm, { color: colors.textMuted }]}>
              {description.length}/500
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Deskripsi Materi"
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, 500))}
            placeholder="Tambahkan ringkasan materi atau petunjuk belajar sebelum kelas dimulai…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={[typography.bodyMd, styles.textarea]}
          />
        </View>

        {/* Segmented Format Tipe Konten: Dokumen / File | Tautan URL | Video */}
        <View style={styles.fieldCard}>
          <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
            Format Tipe Konten
          </Text>
          <View style={styles.segmentedRow}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: contentType === 'pdf' }}
              onPress={() => setContentType('pdf')}
              style={[
                styles.segBtn,
                contentType === 'pdf' && styles.segBtnActive,
              ]}
            >
              <FileText
                size={16}
                color={contentType === 'pdf' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  typography.labelSm,
                  {
                    color:
                      contentType === 'pdf' ? colors.white : colors.textSecondary,
                    marginTop: 4,
                  },
                ]}
              >
                Dokumen / File
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: contentType === 'link' }}
              onPress={() => setContentType('link')}
              style={[
                styles.segBtn,
                contentType === 'link' && styles.segBtnActive,
              ]}
            >
              <LinkIcon
                size={16}
                color={contentType === 'link' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  typography.labelSm,
                  {
                    color:
                      contentType === 'link' ? colors.white : colors.textSecondary,
                    marginTop: 4,
                  },
                ]}
              >
                Tautan URL
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: contentType === 'video' }}
              onPress={() => setContentType('video')}
              style={[
                styles.segBtn,
                contentType === 'video' && styles.segBtnActive,
              ]}
            >
              <Video
                size={16}
                color={contentType === 'video' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  typography.labelSm,
                  {
                    color:
                      contentType === 'video' ? colors.white : colors.textSecondary,
                    marginTop: 4,
                  },
                ]}
              >
                Video
              </Text>
            </Pressable>
          </View>

          {contentType === 'link' ? (
            <TextInput
              accessibilityLabel="Tautan URL Materi"
              value={fileUrl}
              onChangeText={setFileUrl}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              style={[typography.bodyMd, styles.input, { marginTop: space.md }]}
            />
          ) : (
            <View style={{ marginTop: space.md }}>
              <View style={styles.uploadedFileBox}>
                <View style={styles.rowBetween}>
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.titleSm,
                      { color: colors.textPrimary, flex: 1 },
                    ]}
                  >
                    {fileUrl}
                  </Text>
                  <CheckCircle2 size={16} color={colors.success} />
                </View>
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.successText, marginTop: 2 },
                  ]}
                >
                  4,2 MB · Siap Terbit ({uploadProgress}%)
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handlePickFile}
                style={styles.dropzone}
              >
                <UploadCloud size={22} color={colors.primary} />
                <Text
                  style={[
                    typography.titleSm,
                    { color: colors.textPrimary, marginTop: 4 },
                  ]}
                >
                  Pilih / Ganti Berkas Materi
                </Text>
                <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                  PDF, PPTX, DOCX (Maksimal 50 MB per berkas)
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Toggle Kirim Notifikasi Otomatis */}
        <View style={styles.fieldCard}>
          <ListItemSwitch
            title="Kirim Notifikasi Otomatis ke Mahasiswa"
            description="Mahasiswa peserta mata kuliah akan menerima pemberitahuan materi baru"
            value={notifyStudents}
            onValueChange={setNotifyStudents}
          />
        </View>

        <View style={styles.warningFooter}>
          <Info size={16} color={colors.textMuted} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.textMuted, marginLeft: 6, flex: 1 },
            ]}
          >
            Perubahan yang belum disimpan akan hilang jika Anda menutup halaman ini.
          </Text>
        </View>

        {/* Tombol Terbitkan */}
        <Button
          title="Unggah & Terbitkan Materi"
          loading={uploadMutation.isPending}
          onPress={handlePublish}
          style={{ marginTop: space.md }}
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
              Materi yang sedang Anda isi belum diterbitkan.
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
  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.md,
  },
  meetingPillsRow: {
    gap: space.xs,
    marginTop: space.sm,
  },
  meetingPill: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceMuted,
  },
  meetingPillActive: {
    backgroundColor: colors.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    minHeight: 88,
    textAlignVertical: 'top',
    marginTop: space.xs,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    padding: 4,
    marginTop: space.sm,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  segBtnActive: {
    backgroundColor: colors.primary,
    ...elevation.level1,
  },
  uploadedFileBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    backgroundColor: colors.success,
  },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.tintStrong,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    padding: space.md,
    alignItems: 'center',
    marginTop: space.sm,
  },
  warningFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
  },
});
