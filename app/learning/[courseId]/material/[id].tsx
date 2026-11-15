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
  FileText,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MessageSquare,
  ArrowRight,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import {
  Button,
  SectionSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import {
  useMaterialDetailData,
  useMaterialsData,
  useAssignmentsData,
  getCourseChatRoomId,
} from '@/features/useCampusData';
import { formatFileSize, formatDateTimeId } from '@/utils/format';

// Viewer Materi
export default function MaterialViewerScreen() {
  const { courseId, id } = useLocalSearchParams<{ courseId: string; id: string }>();
  const router = useRouter();

  const materialQuery = useMaterialDetailData(id || '');
  const { toggleOfflineMutation } = useMaterialsData(courseId);
  const assignmentsQuery = useAssignmentsData(courseId);

  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const totalPages = 16;

  const material = materialQuery.data;
  const relatedAssignment = (assignmentsQuery.data || [])[0];

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
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={[typography.titleMd, { color: colors.textPrimary }]}
          >
            Materi Pertemuan {material?.meeting || 7}
          </Text>
          <Text
            numberOfLines={1}
            style={[typography.bodySm, { color: colors.textSecondary }]}
          >
            {material?.courseName || 'Pemrograman Perangkat Bergerak'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {materialQuery.isLoading ? (
          <SectionSkeleton count={2} />
        ) : materialQuery.isError ? (
          <ErrorState onRetry={() => materialQuery.refetch()} />
        ) : !material ? (
          <EmptyState title="Materi tidak ditemukan" />
        ) : (
          <View>
            {/* Kartu Info File + Tombol Unduh Offline */}
            <View style={styles.fileInfoCard}>
              <View style={styles.fileTopRow}>
                <View style={styles.fileIconBox}>
                  <FileText size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.pillsRow}>
                    <View style={styles.typePill}>
                      <Text style={[typography.labelBadge, { color: colors.primary }]}>
                        {material.type.toUpperCase()} MODUL
                      </Text>
                    </View>
                    <View style={styles.codePill}>
                      <Text
                        style={[
                          typography.labelBadge,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {material.courseCode || 'IF3201'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      typography.titleMd,
                      { color: colors.textPrimary, marginTop: 4 },
                    ]}
                  >
                    {material.title}
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {formatFileSize(material.sizeBytes)} · {totalPages} Halaman ·{' '}
                    {material.uploadedByName || 'Dr. Ir. Ahmad Fauzi, M.Kom.'}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  typography.bodySm,
                  { color: colors.textMuted, marginTop: space.sm },
                ]}
              >
                Diunggah pada {formatDateTimeId(material.uploadedAt)}
              </Text>

              <Button
                title={
                  material.isDownloadedOffline
                    ? 'Tersimpan untuk Akses Offline'
                    : 'Unduh untuk Akses Offline'
                }
                variant={material.isDownloadedOffline ? 'secondary' : 'primary'}
                size="sm"
                icon={
                  material.isDownloadedOffline ? (
                    <CheckCircle2 size={16} color={colors.success} />
                  ) : (
                    <Download size={16} color={colors.white} />
                  )
                }
                onPress={() => toggleOfflineMutation.mutate(material.id)}
                style={{ marginTop: space.md }}
              />
            </View>

            {/* Area Preview Konten + Kontrol Halaman & Zoom */}
            <View style={styles.viewerCard}>
              <View style={styles.viewerHeaderRow}>
                <Text style={[typography.labelSm, { color: colors.primary }]}>
                  SLIDE KULIAH {material.courseCode || 'IF3201'}
                </Text>
                <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                  Halaman {page} / {totalPages}
                </Text>
              </View>

              <View style={styles.slideCanvas}>
                <Text style={[typography.labelSm, { color: colors.secondary }]}>
                  PERTEMUAN {material.meeting}
                </Text>
                <Text
                  style={[
                    typography.headlineSm,
                    { color: colors.textPrimary, marginTop: 4 },
                  ]}
                >
                  {material.title}
                </Text>
                <Text
                  style={[
                    typography.bodyMd,
                    { color: colors.textSecondary, marginTop: space.sm },
                  ]}
                >
                  {material.description ||
                    'Materi membahas arsitektur aplikasi mobile dengan React Native, Expo Router, manajemen state Zustand, dan sinkronisasi data Supabase PostgreSQL.'}
                </Text>

                <View style={styles.keyPointsBox}>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    Pokok Bahasan Halaman {page}:
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginTop: 4 },
                    ]}
                  >
                    1. Pemisahan komponen UI, hook fitur, dan service layer Supabase.
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    2. Penyimpanan sesi terenkripsi dengan expo-secure-store.
                  </Text>
                  <Text
                    style={[
                      typography.bodySm,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    3. Penanganan 4 state tampilan (skeleton, kosong, error, sukses).
                  </Text>
                </View>
              </View>

              {/* Kontrol Halaman & Zoom */}
              <View style={styles.viewerControls}>
                <View style={styles.pageControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Halaman sebelumnya"
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    style={styles.ctrlBtn}
                  >
                    <ChevronLeft size={18} color={colors.white} />
                  </Pressable>
                  <Text style={[typography.labelMd, { color: colors.white }]}>
                    {page} / {totalPages}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Halaman berikutnya"
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={styles.ctrlBtn}
                  >
                    <ChevronRight size={18} color={colors.white} />
                  </Pressable>
                </View>

                <View style={styles.pageControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Perkecil tampilan"
                    onPress={() => setZoom((z) => Math.max(75, z - 25))}
                    style={styles.ctrlBtn}
                  >
                    <ZoomOut size={16} color={colors.white} />
                  </Pressable>
                  <Text style={[typography.labelSm, { color: colors.white }]}>
                    {zoom}%
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Perbesar tampilan"
                    onPress={() => setZoom((z) => Math.min(150, z + 25))}
                    style={styles.ctrlBtn}
                  >
                    <ZoomIn size={16} color={colors.white} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Kartu Tugas Terkait Materi */}
            {relatedAssignment ? (
              <View style={styles.relatedTaskCard}>
                <Text style={[typography.labelSm, { color: colors.urgentText }]}>
                  ● TUGAS TERKAIT MATERI
                </Text>
                <Text
                  style={[
                    typography.titleMd,
                    { color: colors.textPrimary, marginTop: 4 },
                  ]}
                >
                  {relatedAssignment.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    typography.bodySm,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {relatedAssignment.description}
                </Text>
                <Button
                  title="Buka Instruksi Tugas"
                  size="sm"
                  rightIcon={<ArrowRight size={15} color={colors.white} />}
                  onPress={() =>
                    router.push(
                      `/learning/${material.courseId}/assignment/${relatedAssignment.id}` as never
                    )
                  }
                  style={{ marginTop: space.md }}
                />
              </View>
            ) : null}

            {/* Tautan ke Room Chat MK */}
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push(`/chat/${getCourseChatRoomId(material.courseId)}` as never)
              }
              style={styles.chatLinkCard}
            >
              <MessageSquare size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  Forum Diskusi Materi
                </Text>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Diskusikan materi ini di Room Chat Mata Kuliah
                </Text>
              </View>
              <ArrowRight size={18} color={colors.primary} />
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
  fileInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  fileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: space.xs,
  },
  typePill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  codePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  viewerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.lg,
  },
  viewerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  slideCanvas: {
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  keyPointsBox: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.input,
    padding: space.md,
    marginTop: space.md,
  },
  viewerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    marginTop: space.md,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  ctrlBtn: {
    padding: 4,
  },
  relatedTaskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
    padding: space.lg,
    marginTop: space.lg,
  },
  chatLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginTop: space.lg,
  },
});
