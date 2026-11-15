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
  FileText,
  Award,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import {
  StatusChip,
  Button,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import {
  useAssignmentDetailData,
  useSubmissionsListData,
} from '@/features/useCampusData';
import { formatDateTimeId } from '@/utils/format';

// Daftar Pengumpulan (Dosen)
export default function AssignmentSubmissionsScreen() {
  const { id } = useLocalSearchParams<{ courseId: string; id: string }>();
  const router = useRouter();

  const assignmentQuery = useAssignmentDetailData(id || '');
  const submissionsQuery = useSubmissionsListData(id || '');

  const [gradingTarget, setGradingTarget] = useState<{
    studentId: string;
    studentName: string;
    studentNim: string;
    score: string;
    feedback: string;
  } | null>(null);

  const assignment = assignmentQuery.data;
  const studentsList = submissionsQuery.data || [];

  const handleSaveGrade = async () => {
    if (!gradingTarget) return;
    const numericScore = Math.min(
      100,
      Math.max(0, Number(gradingTarget.score) || 0)
    );
    await submissionsQuery.gradeMutation.mutateAsync({
      studentId: gradingTarget.studentId,
      studentName: gradingTarget.studentName,
      studentNim: gradingTarget.studentNim,
      score: numericScore,
      feedback: gradingTarget.feedback.trim() || undefined,
    });
    setGradingTarget(null);
  };

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
            Daftar Pengumpulan
          </Text>
          <Text
            numberOfLines={1}
            style={[typography.bodySm, { color: colors.textSecondary }]}
          >
            {assignment?.title || 'Tugas Mata Kuliah'}
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
        {submissionsQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : submissionsQuery.isError ? (
          <ErrorState onRetry={() => submissionsQuery.refetch()} />
        ) : studentsList.length === 0 ? (
          <EmptyState title="Belum ada data mahasiswa" />
        ) : (
          <View style={styles.stackGap}>
            {studentsList.map((row) => {
              const sub = row.submission;
              return (
                <View key={row.studentId} style={styles.studentCard}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                        {row.studentName}
                      </Text>
                      <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                        NIM {row.studentNim}
                      </Text>
                    </View>
                    {!sub ? (
                      <StatusChip status="assignment_pending" />
                    ) : sub.status === 'graded' ? (
                      <StatusChip
                        status="assignment_graded"
                        customLabel={`Dinilai (${sub.score}/100)`}
                      />
                    ) : sub.status === 'late' ? (
                      <StatusChip status="assignment_late" />
                    ) : (
                      <StatusChip status="assignment_submitted" />
                    )}
                  </View>

                  {sub ? (
                    <View style={styles.subDetailsBox}>
                      <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                        Waktu Kumpul: {formatDateTimeId(sub.submittedAt)}
                      </Text>
                      {sub.files?.length ? (
                        <View style={styles.fileChip}>
                          <FileText size={14} color={colors.primary} />
                          <Text
                            style={[
                              typography.bodySm,
                              { color: colors.primary, marginLeft: 6 },
                            ]}
                          >
                            {sub.files.join(', ')}
                          </Text>
                        </View>
                      ) : null}
                      {sub.notes ? (
                        <Text
                          style={[
                            typography.bodySm,
                            { color: colors.textPrimary, marginTop: 4 },
                          ]}
                        >
                          Catatan Mahasiswa: &ldquo;{sub.notes}&rdquo;
                        </Text>
                      ) : null}
                      {sub.feedback ? (
                        <Text
                          style={[
                            typography.bodySm,
                            {
                              color: colors.successText,
                              marginTop: 4,
                              fontStyle: 'italic',
                            },
                          ]}
                        >
                          Umpan Balik Dosen: &ldquo;{sub.feedback}&rdquo;
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <Button
                    title={sub?.status === 'graded' ? 'Ubah Nilai & Komentar' : 'Beri Nilai (0–100)'}
                    size="sm"
                    variant={sub ? 'primary' : 'secondary'}
                    icon={
                      <Award
                        size={15}
                        color={sub ? colors.white : colors.primary}
                      />
                    }
                    onPress={() =>
                      setGradingTarget({
                        studentId: row.studentId,
                        studentName: row.studentName,
                        studentNim: row.studentNim,
                        score: sub?.score !== undefined ? String(sub.score) : '90',
                        feedback:
                          sub?.feedback ||
                          'Implementasi sudah sangat baik dan memenuhi seluruh kriteria.',
                      })
                    }
                    style={{ marginTop: space.md }}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Beri Nilai (0-100) & Komentar */}
      <Modal
        visible={Boolean(gradingTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setGradingTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Penilaian Tugas Mahasiswa
            </Text>
            <Text
              style={[
                typography.bodySm,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
            >
              {gradingTarget?.studentName} (NIM {gradingTarget?.studentNim})
            </Text>

            <Text
              style={[
                typography.titleSm,
                { color: colors.textPrimary, marginTop: space.md },
              ]}
            >
              Nilai (0 – 100)
            </Text>
            <TextInput
              accessibilityLabel="Input Nilai 0 sampai 100"
              value={gradingTarget?.score || ''}
              onChangeText={(val) =>
                setGradingTarget((prev) => (prev ? { ...prev, score: val } : null))
              }
              keyboardType="numeric"
              style={[typography.headlineSm, styles.scoreInput]}
            />

            <Text
              style={[
                typography.titleSm,
                { color: colors.textPrimary, marginTop: space.md },
              ]}
            >
              Komentar / Umpan Balik Dosen
            </Text>
            <TextInput
              accessibilityLabel="Komentar evaluasi dosen"
              value={gradingTarget?.feedback || ''}
              onChangeText={(val) =>
                setGradingTarget((prev) =>
                  prev ? { ...prev, feedback: val } : null
                )
              }
              multiline
              numberOfLines={3}
              style={[typography.bodyMd, styles.feedbackInput]}
            />

            <View style={styles.modalBtns}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => setGradingTarget(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Simpan Nilai"
                loading={submissionsQuery.gradeMutation.isPending}
                onPress={handleSaveGrade}
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
  stackGap: {
    gap: space.itemGap,
  },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subDetailsBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.sm,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  scoreInput: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.primary,
    marginTop: space.xs,
  },
  feedbackInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: space.md,
    color: colors.textPrimary,
    minHeight: 84,
    textAlignVertical: 'top',
    marginTop: space.xs,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
});
