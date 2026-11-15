import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  Paperclip,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';
import { useFaqDetailData, useSupportData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import { Card, EmptyState, ErrorState, SectionSkeleton } from '@/components/ui';
import { formatDateIdShort } from '@/utils/format';

export default function FaqDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const faqQuery = useFaqDetailData(id || '');
  const { faqsQuery } = useSupportData();

  const [feedbackVote, setFeedbackVote] = useState<'up' | 'down' | null>(null);

  const faq = faqQuery.data;
  const relatedFaqs = useMemo(() => {
    const all = faqsQuery.data ?? [];
    return all.filter((f) => f.id !== id).slice(0, 3);
  }, [faqsQuery.data, id]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Bantuan & FAQ</Text>
        <View style={{ width: 38 }} />
      </View>

      {faqQuery.isLoading ? (
        <View style={styles.pad}>
          <SectionSkeleton count={4} />
        </View>
      ) : faqQuery.isError ? (
        <View style={styles.pad}>
          <ErrorState
            message="Gagal memuat artikel FAQ."
            onRetry={() => faqQuery.refetch()}
          />
        </View>
      ) : !faq ? (
        <View style={styles.pad}>
          <EmptyState
            title="Artikel FAQ tidak ditemukan"
            description="Silakan kembali ke halaman Layanan Bantuan untuk mencari panduan lainnya."
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Meta Row */}
          <View style={styles.metaTopRow}>
            <View style={styles.categoryPill}>
              <BookOpen size={13} color={colors.primary} />
              <Text style={styles.categoryPillText}>{faq.category}</Text>
            </View>
            <View style={styles.updatedRow}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.updatedText}>
                Diperbarui {formatDateIdShort(faq.updatedAt)}
              </Text>
            </View>
          </View>

          {/* Question Title */}
          <Text style={styles.questionTitle}>{faq.question}</Text>

          {/* Author Row */}
          <View style={styles.authorRow}>
            <View style={styles.authorIconBox}>
              <Building2 size={16} color={colors.primary} />
            </View>
            <Text style={styles.authorText}>
              Biro Administrasi Akademik & Keuangan (BAAK)
            </Text>
            <BadgeCheck size={16} color={colors.primary} />
          </View>

          {/* Ringkasan Cepat */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryIconCircle}>
              <Lightbulb size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Ringkasan Cepat</Text>
              <Text style={styles.summaryBody}>{faq.summary}</Text>
            </View>
          </View>

          {/* Tahapan & Prosedur Pengajuan */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.rowCenter}>
              <ListOrdered size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Tahapan & Prosedur Pengajuan</Text>
            </View>
            <View style={styles.stepsCountChip}>
              <Text style={styles.stepsCountText}>{faq.steps.length} Langkah</Text>
            </View>
          </View>

          <View style={styles.stepsList}>
            {faq.steps.map((step, idx) => (
              <Card key={idx} style={styles.stepCard}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Langkah {idx + 1}</Text>
                  <Text style={styles.stepDesc}>{step}</Text>
                </View>
              </Card>
            ))}
          </View>

          {/* Dokumen Lampiran */}
          {faq.attachments && faq.attachments.length > 0 ? (
            <View style={styles.attachmentsSection}>
              <View style={styles.rowCenter}>
                <Paperclip size={16} color={colors.textPrimary} />
                <Text style={styles.sectionTitle}>Dokumen Lampiran</Text>
              </View>

              {faq.attachments.map((att, idx) => (
                <Card key={idx} style={styles.attachmentCard}>
                  <View style={styles.attachmentRow}>
                    <View style={styles.fileIconBox}>
                      <FileText size={18} color={colors.urgentText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {att}
                      </Text>
                      <Text style={styles.fileMeta}>650 KB • Dokumen Resmi BAAK</Text>
                    </View>
                    <Pressable
                      onPress={() => showToast(`Mengunduh ${att}...`)}
                      style={styles.downloadBtn}
                    >
                      <Download size={14} color={colors.primary} />
                      <Text style={styles.downloadBtnText}>Unduh</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {/* Perhatian Penting */}
          {faq.warningNote ? (
            <View style={styles.warningBox}>
              <AlertTriangle size={18} color={colors.warningText} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Perhatian Penting</Text>
                <Text style={styles.warningBody}>{faq.warningNote}</Text>
              </View>
            </View>
          ) : null}

          {/* Feedback Card */}
          <Card style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>
              Apakah informasi FAQ ini membantu menjawab kendala Anda?
            </Text>
            <Text style={styles.feedbackSubtitle}>
              Umpan balik Anda membantu Biro Akademik menyempurnakan artikel ini.
            </Text>
            <View style={styles.feedbackBtnsRow}>
              <Pressable
                onPress={() => {
                  setFeedbackVote('up');
                  showToast('Terima kasih atas umpan balik Anda!');
                }}
                style={[
                  styles.voteBtn,
                  feedbackVote === 'up' && styles.voteBtnActive,
                ]}
              >
                <ThumbsUp
                  size={15}
                  color={feedbackVote === 'up' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.voteBtnText,
                    feedbackVote === 'up' && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  Ya, Sangat Membantu
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setFeedbackVote('down');
                  showToast('Silakan buat tiket agar petugas dapat membantu langsung.');
                }}
                style={[
                  styles.voteBtn,
                  feedbackVote === 'down' && styles.voteBtnActive,
                ]}
              >
                <ThumbsDown
                  size={15}
                  color={feedbackVote === 'down' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.voteBtnText,
                    feedbackVote === 'down' && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  Belum Menjawab
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* CTA Buat Tiket Bantuan */}
          <Card style={styles.ctaTicketCard}>
            <View style={styles.ctaTopRow}>
              <View style={styles.ctaIconBox}>
                <HelpCircle size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Masih butuh bantuan lebih lanjut?</Text>
                <Text style={styles.ctaBody}>
                  Jika pertanyaan Anda belum terjawab, buat tiket pengaduan resmi agar
                  petugas BAAK dapat membantu secara langsung.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/support/new',
                  params: { category: faq.category },
                })
              }
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaBtnText}>Buat Tiket Bantuan Baru</Text>
              <ArrowRight size={16} color={colors.white} />
            </Pressable>
          </Card>

          {/* FAQ Terkait Lainnya */}
          {relatedFaqs.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>FAQ Terkait Lainnya</Text>
              {relatedFaqs.map((rel) => (
                <Card
                  key={rel.id}
                  onPress={() => router.replace(`/support/faq/${rel.id}`)}
                  style={styles.relatedCard}
                >
                  <View style={styles.relatedRow}>
                    <FileText size={16} color={colors.textSecondary} />
                    <Text style={styles.relatedText} numberOfLines={1}>
                      {rel.question}
                    </Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </View>
                </Card>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  pad: {
    padding: space.lg,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.huge,
    gap: space.md,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  categoryPillText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updatedText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  questionTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  authorIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.tintStrong,
  },
  summaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    ...typography.labelMd,
    color: colors.primary,
    marginBottom: 2,
  },
  summaryBody: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  stepsCountChip: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  stepsCountText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  stepsList: {
    gap: space.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.md,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.labelSm,
    color: colors.white,
  },
  stepTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  stepDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  attachmentsSection: {
    gap: space.sm,
  },
  attachmentCard: {
    padding: space.md,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.urgentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  fileMeta: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.input,
  },
  downloadBtnText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningTitle: {
    ...typography.labelMd,
    color: colors.warningText,
  },
  warningBody: {
    ...typography.bodySm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  feedbackCard: {
    padding: space.md,
    alignItems: 'center',
    gap: space.xs,
  },
  feedbackTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  feedbackSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackBtnsRow: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
    marginTop: space.sm,
  },
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: space.sm + 2,
  },
  voteBtnActive: {
    backgroundColor: colors.tintSoft,
    borderColor: colors.primary,
  },
  voteBtnText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  ctaTicketCard: {
    padding: space.md,
    gap: space.md,
  },
  ctaTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  ctaIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  ctaBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    height: 46,
  },
  ctaBtnText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
  relatedSection: {
    gap: space.sm,
    marginTop: space.xs,
  },
  relatedCard: {
    padding: space.md,
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  relatedText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    flex: 1,
  },
});
