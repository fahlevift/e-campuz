import React, { useState, useRef } from 'react';
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
  Clock,
  Bell,
  Paperclip,
  UploadCloud,
  X,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import {
  StatusChip,
  FileItem,
  Button,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { useAppStore } from '@/store';
import {
  useAssignmentDetailData,
  useAssignmentsData,
} from '@/features/useCampusData';
import { formatDateTimeId, formatRemainingTime } from '@/utils/format';

// Detail Tugas
export default function AssignmentDetailScreen() {
  const { courseId, id } = useLocalSearchParams<{ courseId: string; id: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const isLecturer = user?.role === 'dosen';

  const detailQuery = useAssignmentDetailData(id || '');
  const { submitMutation } = useAssignmentsData(courseId);

  const assignment = detailQuery.data;

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulatedFileUpload = (fileName: string) => {
    setUploadError(null);
    setUploadProgress(20);
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    uploadTimerRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
          setSelectedFiles((curr) => [...curr, fileName]);
          return null;
        }
        return prev + 40;
      });
    }, 180);
  };

  const cancelUpload = () => {
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    setUploadProgress(null);
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]?.name) {
        startSimulatedFileUpload(res.assets[0].name);
      }
    } catch {
      setUploadError('Gagal mengunggah berkas. Periksa koneksi lalu coba lagi.');
    }
  };

  const handleConfirmSubmit = async () => {
    if (!assignment) return;
    setConfirmVisible(false);
    await submitMutation.mutateAsync({
      assignmentId: assignment.id,
      files:
        assignment.submissionType === 'file'
          ? selectedFiles.length > 0
            ? selectedFiles
            : ['Jawaban-Tugas-Mahasiswa.zip']
          : [],
      text: assignment.submissionType === 'text' ? textAnswer : undefined,
      notes: notes || undefined,
    });
  };

  const rem = assignment ? formatRemainingTime(assignment.dueAt) : null;
  const sub = assignment?.submission;
  const isBlockedAfterDeadline =
    Boolean(rem?.isOverdue) && !assignment?.allowLate && !sub;

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
        <View style={{ flex: 1 }}>
          <Text style={[typography.titleMd, { color: colors.textPrimary }]}>
            Detail Tugas
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            {assignment?.courseName || 'Mata Kuliah'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {detailQuery.isLoading ? (
          <SectionSkeleton count={2} />
        ) : detailQuery.isError ? (
          <ErrorState onRetry={() => detailQuery.refetch()} />
        ) : !assignment ? (
          <EmptyState title="Tugas tidak ditemukan" />
        ) : (
          <View>
            {/* Banner Countdown Deadline + Info Pengingat Otomatis */}
            <View
              style={[
                styles.deadlineBanner,
                sub && {
                  backgroundColor: colors.successSoft,
                  borderColor: colors.successBorder,
                  borderLeftColor: colors.success,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <View style={styles.rowCenter}>
                  <Clock
                    size={16}
                    color={sub ? colors.successText : colors.urgentText}
                  />
                  <Text
                    style={[
                      typography.labelSm,
                      {
                        color: sub ? colors.successText : colors.urgentText,
                        marginLeft: 6,
                      },
                    ]}
                  >
                    {sub
                      ? 'TUGAS SUDAH DIKUMPULKAN'
                      : `BATAS WAKTU · ${rem?.label.toUpperCase()}`}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  typography.titleMd,
                  {
                    color: sub ? colors.successText : colors.urgentText,
                    marginTop: 6,
                  },
                ]}
              >
                {formatDateTimeId(assignment.dueAt)}
              </Text>

              <View style={[styles.rowCenter, { marginTop: space.xs }]}>
                <Bell size={14} color={colors.textSecondary} />
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.textSecondary, marginLeft: 6, flex: 1 },
                  ]}
                >
                  {sub
                    ? 'Pengingat deadline untuk tugas ini telah otomatis dihentikan.'
                    : 'Pengingat aktif (H-3, H-1, 6 jam). Otomatis berhenti setelah tugas dikumpulkan.'}
                </Text>
              </View>
            </View>

            {/* Kartu Deskripsi & Lampiran Soal Dosen */}
            <View style={styles.card}>
              <Text style={[typography.labelSm, { color: colors.primary }]}>
                {assignment.courseCode || 'IF3201'} · Semester Ganjil 2026/2027
              </Text>
              <Text
                style={[
                  typography.headlineSm,
                  { color: colors.textPrimary, marginTop: 4 },
                ]}
              >
                {assignment.title}
              </Text>

              <Text
                style={[
                  typography.titleSm,
                  { color: colors.textPrimary, marginTop: space.md },
                ]}
              >
                Deskripsi & Petunjuk Pengerjaan
              </Text>
              <Text
                style={[
                  typography.bodyMd,
                  { color: colors.textSecondary, marginTop: space.xs },
                ]}
              >
                {assignment.description}
              </Text>

              {assignment.attachments?.length > 0 ? (
                <View style={{ marginTop: space.lg }}>
                  <View style={[styles.rowCenter, { marginBottom: space.sm }]}>
                    <Paperclip size={16} color={colors.primary} />
                    <Text
                      style={[
                        typography.titleSm,
                        { color: colors.textPrimary, marginLeft: 6 },
                      ]}
                    >
                      Lampiran Soal Dosen ({assignment.attachments.length} Berkas)
                    </Text>
                  </View>
                  <View style={styles.stackGap}>
                    {assignment.attachments.map((att, idx) => (
                      <FileItem
                        key={idx}
                        title={att}
                        type="pdf"
                        sizeBytes={1250000}
                        subtitle="Dokumen Lampiran Soal"
                        onPress={() => showToast(`Membuka ${att}...`)}
                        onDownload={() => showToast(`${att} berhasil diunduh`)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>

            {/* Jika Dosen: Tombol ke Daftar Pengumpulan */}
            {isLecturer ? (
              <Button
                title="Buka Daftar Pengumpulan & Penilaian Mahasiswa"
                onPress={() =>
                  router.push(
                    `/learning/${assignment.courseId}/assignment/${assignment.id}/submissions` as never
                  )
                }
                style={{ marginTop: space.lg }}
              />
            ) : (
              /* Kartu Status Pengumpulan & Form Unggah Jawaban Mahasiswa */
              <View style={[styles.card, { marginTop: space.lg }]}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                      Status Pengumpulan
                    </Text>
                    <Text style={[typography.titleMd, { color: colors.textPrimary }]}>
                      Jawaban Anda
                    </Text>
                  </View>
                  {!sub ? (
                    <StatusChip
                      status={
                        rem?.isOverdue ? 'assignment_late' : 'assignment_pending'
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

                {/* Riwayat Pengumpulan & Nilai jika sudah dinilai */}
                {sub ? (
                  <View style={styles.submittedInfoBox}>
                    <View style={styles.rowCenter}>
                      <CheckCircle2 size={16} color={colors.success} />
                      <Text
                        style={[
                          typography.titleSm,
                          { color: colors.successText, marginLeft: 6 },
                        ]}
                      >
                        Dikumpulkan pada {formatDateTimeId(sub.submittedAt)}
                      </Text>
                    </View>
                    {sub.files?.map((f, i) => (
                      <Text
                        key={i}
                        style={[
                          typography.bodySm,
                          { color: colors.primary, marginTop: 4 },
                        ]}
                      >
                        • Berkas: {f}
                      </Text>
                    ))}
                    {sub.text ? (
                      <Text
                        style={[
                          typography.bodySm,
                          { color: colors.textPrimary, marginTop: 4 },
                        ]}
                      >
                        Jawaban Teks: {sub.text}
                      </Text>
                    ) : null}
                    {sub.status === 'graded' ? (
                      <View style={styles.gradedFeedbackBox}>
                        <Text style={[typography.titleSm, { color: colors.primary }]}>
                          Nilai Akhir: {sub.score}/100
                        </Text>
                        {sub.feedback ? (
                          <Text
                            style={[
                              typography.bodySm,
                              { color: colors.textSecondary, marginTop: 2 },
                            ]}
                          >
                            Komentar Dosen: &ldquo;{sub.feedback}&rdquo;
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Input sesuai submissionType ('file' atau 'text') */}
                {assignment.submissionType === 'file' ? (
                  <View style={{ marginTop: space.md }}>
                    <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                      Unggah Berkas Jawaban
                    </Text>

                    <View style={styles.uploadDropzone}>
                      <UploadCloud size={28} color={colors.primary} />
                      <Text
                        style={[
                          typography.titleSm,
                          { color: colors.textPrimary, marginTop: space.xs },
                        ]}
                      >
                        Pilih berkas jawaban (ZIP atau PDF)
                      </Text>
                      <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                        Maksimal ukuran berkas 25 MB
                      </Text>

                      <View style={styles.uploadButtonsRow}>
                        <Button
                          title="Pilih Berkas dari HP"
                          variant="secondary"
                          size="sm"
                          onPress={handlePickDocument}
                          style={{ marginTop: space.sm }}
                        />
                        <Button
                          title="+ Lampirkan Berkas Contoh"
                          variant="ghost"
                          size="sm"
                          onPress={() =>
                            startSimulatedFileUpload(
                              `Tugas-${assignment.courseCode || 'IF3201'}-${
                                user?.nimNip || '22053181'
                              }.zip`
                            )
                          }
                          style={{ marginTop: space.sm }}
                        />
                      </View>

                      {/* Progres unggah + tombol batalkan */}
                      {uploadProgress !== null ? (
                        <View style={styles.progressWrap}>
                          <View style={styles.rowBetween}>
                            <Text
                              style={[
                                typography.bodySm,
                                { color: colors.primary },
                              ]}
                            >
                              Mengunggah berkas… {uploadProgress}%
                            </Text>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Batalkan unggahan"
                              onPress={cancelUpload}
                            >
                              <Text
                                style={[
                                  typography.labelSm,
                                  { color: colors.urgentText },
                                ]}
                              >
                                Batalkan
                              </Text>
                            </Pressable>
                          </View>
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${uploadProgress}%` },
                              ]}
                            />
                          </View>
                        </View>
                      ) : null}

                      {/* Error unggah + coba lagi */}
                      {uploadError ? (
                        <View style={styles.uploadErrorRow}>
                          <Text
                            style={[
                              typography.bodySm,
                              { color: colors.urgentText, flex: 1 },
                            ]}
                          >
                            {uploadError}
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() =>
                              startSimulatedFileUpload('Jawaban-Mahasiswa.zip')
                            }
                            style={styles.retryInline}
                          >
                            <RotateCcw size={14} color={colors.primary} />
                            <Text
                              style={[
                                typography.labelSm,
                                { color: colors.primary, marginLeft: 4 },
                              ]}
                            >
                              Coba Lagi
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>

                    {selectedFiles.map((f, idx) => (
                      <View key={idx} style={styles.selectedFilePill}>
                        <Text
                          style={[
                            typography.labelMd,
                            { color: colors.primary, flex: 1 },
                          ]}
                        >
                          {f}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Hapus berkas"
                          onPress={() =>
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <X size={16} color={colors.iconMuted} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ marginTop: space.md }}>
                    <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                      Tulis Jawaban Teks Anda
                    </Text>
                    <TextInput
                      accessibilityLabel="Jawaban teks tugas"
                      value={textAnswer}
                      onChangeText={setTextAnswer}
                      placeholder="Tuliskan jawaban lengkap Anda di sini…"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={5}
                      style={[typography.bodyMd, styles.textarea]}
                    />
                  </View>
                )}

                <Text
                  style={[
                    typography.titleSm,
                    { color: colors.textPrimary, marginTop: space.md },
                  ]}
                >
                  Catatan untuk Dosen (Opsional)
                </Text>
                <TextInput
                  accessibilityLabel="Catatan untuk dosen"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Contoh: Tautan repositori atau catatan pengerjaan…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  style={[typography.bodyMd, styles.textareaSmall]}
                />

                <View style={styles.integrityNote}>
                  <ShieldCheck size={16} color={colors.primary} />
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginLeft: 6, flex: 1 },
                    ]}
                  >
                    Dengan mengirimkan tugas ini, saya menyatakan bahwa karya ini adalah murni hasil pengerjaan mandiri.
                  </Text>
                </View>

                {isBlockedAfterDeadline ? (
                  <View style={styles.blockedBox}>
                    <Text style={[typography.bodySm, { color: colors.urgentText }]}>
                      Batas waktu telah berakhir dan tugas ini tidak mengizinkan pengumpulan terlambat.
                    </Text>
                  </View>
                ) : (
                  <Button
                    title={
                      sub
                        ? 'Kirim Ulang Jawaban Tugas'
                        : 'Kirim Jawaban Tugas Sekarang'
                    }
                    disabled={sub?.status === 'graded'}
                    loading={submitMutation.isPending}
                    onPress={() => setConfirmVisible(true)}
                    style={{ marginTop: space.lg }}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Dialog Konfirmasi Kirim Jawaban */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Kirim Jawaban Tugas?
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { color: colors.textSecondary, marginTop: space.xs },
              ]}
            >
              Pastikan berkas atau jawaban yang Anda unggah sudah benar. Pengingat tugas akan otomatis dihentikan setelah dikirim.
            </Text>
            <View style={styles.modalBtns}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => setConfirmVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Ya, Kirim"
                onPress={handleConfirmSubmit}
                loading={submitMutation.isPending}
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
  deadlineBanner: {
    backgroundColor: colors.urgentSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
    padding: space.lg,
    marginBottom: space.lg,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  stackGap: {
    gap: space.sm,
  },
  submittedInfoBox: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.md,
  },
  gradedFeedbackBox: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.successBorder,
  },
  uploadDropzone: {
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.tintStrong,
    padding: space.lg,
    alignItems: 'center',
    marginTop: space.sm,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.xs,
  },
  progressWrap: {
    width: '100%',
    marginTop: space.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  uploadErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.sm,
  },
  retryInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: space.sm,
  },
  selectedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.sm,
  },
  textarea: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: space.md,
    color: colors.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
    marginTop: space.xs,
  },
  textareaSmall: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: space.md,
    color: colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
    marginTop: space.xs,
  },
  integrityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.md,
  },
  blockedBox: {
    backgroundColor: colors.urgentSoft,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.md,
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
  modalBtns: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
});
