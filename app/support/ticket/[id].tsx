import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Info,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Star,
  TrendingUp,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';
import { useTicketDetailData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionSkeleton,
  StatusChip,
  mapTicketStatusToKind,
} from '@/components/ui';
import { TicketStatus } from '@/types';
import { formatDateTimeId } from '@/utils/format';

const STATUS_LABELS: Record<TicketStatus, string> = {
  submitted: 'Terkirim',
  in_progress: 'Diproses Petugas',
  need_info: 'Butuh Info Tambahan',
  resolved: 'Selesai Ditangani',
  closed: 'Ditutup',
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
    replyMutation,
    statusMutation,
    ratingMutation,
  } = useTicketDetailData(id || '');

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(ticket?.rating ?? 5);
  const [ratingComment, setRatingComment] = useState<string>(
    ticket?.ratingComment ?? '',
  );

  const handleAttachReplyFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        setReplyAttachments((prev) => [...prev, res.assets[0].name]);
      }
    } catch {
      setReplyAttachments((prev) => [...prev, 'Berkas_Tambahan_Mahasiswa.pdf']);
    }
  };

  const handleSendReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed && replyAttachments.length === 0) return;

    replyMutation.mutate(
      {
        message: trimmed || 'Melampirkan berkas pendukung tambahan.',
        attachments: replyAttachments,
      },
      {
        onSuccess: () => {
          setReplyText('');
          setReplyAttachments([]);
        },
      },
    );
  };

  const isClosed = ticket?.status === 'closed';
  const canRate = ticket?.status === 'resolved' || ticket?.status === 'closed';

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detail Tiket #{ticket?.code || 'TKT-2026'}
          </Text>
          {ticket ? (
            <Text style={styles.headerSubtitle}>
              Dibuat pada {formatDateTimeId(ticket.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={styles.pad}>
            <SectionSkeleton count={4} />
          </View>
        ) : isError ? (
          <View style={styles.pad}>
            <ErrorState
              message="Gagal memuat detail tiket."
              onRetry={() => refetch()}
            />
          </View>
        ) : !ticket ? (
          <View style={styles.pad}>
            <EmptyState
              title="Tiket tidak ditemukan"
              description="Tiket ini mungkin telah dihapus atau nomor tiket tidak sesuai."
            />
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Summary Card */}
              <Card style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                  <StatusChip status={mapTicketStatusToKind(ticket.status)} />
                  <View style={styles.autoCloseRow}>
                    <Clock size={13} color={colors.textMuted} />
                    <Text style={styles.autoCloseText}>
                      {ticket.status === 'resolved'
                        ? 'Dapat ditutup otomatis dalam 3 hari'
                        : 'Dipantau Helpdesk BAAK'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ticketTitle}>{ticket.title}</Text>

                <View style={styles.metaGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Layanan</Text>
                    <Text style={styles.metaValue}>
                      {ticket.kind === 'pengaduan'
                        ? 'Pengaduan Kampus'
                        : 'Bantuan Akademik'}
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Kategori Masalah</Text>
                    <Text style={styles.metaValue}>{ticket.category}</Text>
                  </View>
                </View>

                <View style={styles.reporterBox}>
                  <Text style={styles.metaLabel}>Pelapor</Text>
                  <View style={styles.reporterRow}>
                    <UserIcon size={14} color={colors.primary} />
                    <Text style={styles.reporterValue}>
                      {ticket.anonymous
                        ? 'Pelapor Anonim (Identitas Disembunyikan)'
                        : `${ticket.reporterName || user?.name || 'Rina Salsabila'} • NIM ${ticket.reporterNim || user?.nimNip || '22051204001'}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.descriptionText}>{ticket.description}</Text>

                {ticket.attachments && ticket.attachments.length > 0 ? (
                  <View style={styles.attachmentsBlock}>
                    <Text style={styles.attachHeading}>LAMPIRAN PENDUKUNG</Text>
                    {ticket.attachments.map((att, idx) => (
                      <View key={idx} style={styles.attachmentItem}>
                        <View style={styles.attachIconBox}>
                          <FileText size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.attachName} numberOfLines={1}>
                            {att}
                          </Text>
                          <Text style={styles.attachMeta}>
                            1,2 MB • Berkas Bukti Lampiran
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => showToast(`Mengunduh ${att}...`)}
                          hitSlop={8}
                        >
                          <Download size={18} color={colors.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>

              {/* Vertical Timeline Perkembangan Tiket */}
              <Card style={styles.timelineCard}>
                <View style={styles.timelineHeaderRow}>
                  <View style={styles.rowCenter}>
                    <TrendingUp size={17} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Perkembangan Tiket</Text>
                  </View>
                  <View style={styles.stagePill}>
                    <Text style={styles.stagePillText}>
                      {ticket.history.length} Riwayat Status
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineList}>
                  {ticket.history.map((item, idx) => {
                    const isLast = idx === ticket.history.length - 1;
                    return (
                      <View key={`${item.status}-${idx}`} style={styles.timelineRow}>
                        <View style={styles.timelineRail}>
                          <View
                            style={[
                              styles.timelineDot,
                              isLast && styles.timelineDotActive,
                            ]}
                          >
                            <CheckCircle2 size={14} color={colors.white} />
                          </View>
                          {!isLast ? <View style={styles.timelineLine} /> : null}
                        </View>

                        <View style={styles.timelineContent}>
                          <View style={styles.rowCenter}>
                            <Text
                              style={[
                                styles.timelineStatusTitle,
                                isLast && { color: colors.successText },
                              ]}
                            >
                              {STATUS_LABELS[item.status] || item.status}
                            </Text>
                            {item.status !== 'submitted' ? (
                              <View style={styles.baakTag}>
                                <Text style={styles.baakTagText}>BAAK</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.timelineMeta}>
                            {formatDateTimeId(item.at)}
                            {item.note ? ` • ${item.note}` : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>

              {/* Riwayat Diskusi Petugas */}
              <View style={styles.threadHeaderRow}>
                <View style={styles.rowCenter}>
                  <MessageSquare size={17} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Riwayat Diskusi Petugas</Text>
                </View>
                <Text style={styles.msgCountText}>
                  {(ticket.messages || []).length} Pesan
                </Text>
              </View>

              <View style={styles.threadList}>
                {(ticket.messages || []).map((msg) => {
                  const isStudent = msg.senderRole === 'student';
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.msgWrap,
                        isStudent ? styles.msgWrapOwn : styles.msgWrapStaff,
                      ]}
                    >
                      <View style={styles.msgSenderHeader}>
                        {!isStudent ? (
                          <View style={styles.staffAvatar}>
                            <Text style={styles.staffAvatarText}>BP</Text>
                          </View>
                        ) : null}
                        <Text style={styles.msgSenderName}>
                          {isStudent
                            ? `${msg.senderLabel} (Anda)`
                            : msg.senderLabel}
                        </Text>
                        {!isStudent ? (
                          <View style={styles.staffRoleChip}>
                            <Text style={styles.staffRoleChipText}>
                              Helpdesk BAAK
                            </Text>
                          </View>
                        ) : null}
                        <Text style={styles.msgTimeText}>
                          • {formatDateTimeId(msg.createdAt)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.msgBubble,
                          isStudent
                            ? styles.msgBubbleOwn
                            : styles.msgBubbleStaff,
                        ]}
                      >
                        <Text
                          style={[
                            styles.msgBodyText,
                            isStudent && { color: colors.white },
                          ]}
                        >
                          {msg.message}
                        </Text>

                        {msg.attachments && msg.attachments.length > 0 ? (
                          <View style={styles.msgAttachments}>
                            {msg.attachments.map((att, i) => (
                              <View key={i} style={styles.msgAttachmentPill}>
                                <FileText size={13} color={colors.primary} />
                                <Text style={styles.msgAttachmentText}>
                                  {att}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Penilaian Layanan Petugas (Muncul saat Selesai / Ditutup) */}
              {canRate ? (
                <Card style={styles.ratingCard}>
                  <View style={styles.ratingTopRow}>
                    <Text style={styles.ratingTitle}>
                      Penilaian Layanan Petugas
                    </Text>
                    {ticket.rating ? (
                      <View style={styles.verifiedPill}>
                        <Text style={styles.verifiedPillText}>TERVERIFIKASI</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.ratingSubtitle}>
                    Bagaimana kepuasan Anda terhadap kecepatan dan solusi dari
                    Helpdesk BAAK?
                  </Text>

                  <View style={styles.starsBox}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (ticket.rating || selectedRating);
                        return (
                          <Pressable
                            key={star}
                            onPress={() => !ticket.rating && setSelectedRating(star)}
                            hitSlop={6}
                          >
                            <Star
                              size={26}
                              color={colors.warning}
                              fill={active ? colors.warning : 'transparent'}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.starsLabel}>
                      {ticket.rating || selectedRating}/5 • Respon cepat & solusi
                      tepat
                    </Text>
                  </View>

                  {ticket.rating ? (
                    ticket.ratingComment ? (
                      <View style={styles.savedCommentBox}>
                        <Text style={styles.savedCommentText}>
                          “{ticket.ratingComment}”
                        </Text>
                      </View>
                    ) : null
                  ) : (
                    <>
                      <TextInput
                        value={ratingComment}
                        onChangeText={setRatingComment}
                        placeholder="Tulis komentar penilaian layanan (opsional)..."
                        placeholderTextColor={colors.textMuted}
                        style={styles.ratingInput}
                      />
                      <Button
                        title="Kirim Penilaian"
                        variant="primary"
                        loading={ratingMutation.isPending}
                        onPress={() =>
                          ratingMutation.mutate({
                            rating: selectedRating,
                            comment: ratingComment.trim() || undefined,
                          })
                        }
                      />
                    </>
                  )}
                </Card>
              ) : null}

              {/* Info Arsip Otomatis */}
              <View style={styles.infoNoteBanner}>
                <Info size={16} color={colors.warningText} />
                <Text style={styles.infoNoteText}>
                  Tiket yang sudah selesai akan diarsipkan secara otomatis dalam 72 jam
                  jika tidak ada sanggahan lebih lanjut.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Actions + Reply Composer */}
            <View style={styles.bottomSection}>
              <View style={styles.statusActionButtons}>
                {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                  <Pressable
                    onPress={() =>
                      statusMutation.mutate({
                        nextStatus: 'in_progress',
                        note: 'Tiket dibuka ulang oleh pemohon',
                      })
                    }
                    style={styles.reopenBtn}
                  >
                    <RotateCcw size={15} color={colors.textPrimary} />
                    <Text style={styles.reopenBtnText}>Buka Ulang Tiket</Text>
                  </Pressable>
                ) : null}

                {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                  <Pressable
                    onPress={() =>
                      statusMutation.mutate({
                        nextStatus: 'resolved',
                        note: 'Dikonfirmasi selesai oleh pemohon',
                      })
                    }
                    style={styles.resolveBtn}
                  >
                    <CheckCircle2 size={15} color={colors.successText} />
                    <Text style={styles.resolveBtnText}>Masalah Selesai</Text>
                  </Pressable>
                ) : null}

                {ticket.status === 'resolved' ? (
                  <Pressable
                    onPress={() =>
                      statusMutation.mutate({
                        nextStatus: 'closed',
                        note: 'Tiket ditutup oleh pemohon',
                      })
                    }
                    style={styles.resolveBtn}
                  >
                    <CheckCircle2 size={15} color={colors.successText} />
                    <Text style={styles.resolveBtnText}>Tutup Tiket</Text>
                  </Pressable>
                ) : null}
              </View>

              {replyAttachments.length > 0 ? (
                <View style={styles.replyAttachRow}>
                  {replyAttachments.map((f, i) => (
                    <View key={i} style={styles.replyAttachPill}>
                      <FileText size={13} color={colors.primary} />
                      <Text style={styles.replyAttachName}>{f}</Text>
                      <Pressable
                        onPress={() =>
                          setReplyAttachments((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <X size={13} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.composerRow}>
                <Pressable
                  onPress={handleAttachReplyFile}
                  disabled={isClosed}
                  style={[styles.attachIconBtn, isClosed && { opacity: 0.4 }]}
                >
                  <Paperclip size={18} color={colors.textSecondary} />
                </Pressable>

                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  editable={!isClosed}
                  placeholder={
                    isClosed
                      ? 'Tiket telah ditutup. Buka ulang untuk membalas.'
                      : 'Tulis balasan atau lampiran tambahan...'
                  }
                  placeholderTextColor={colors.textMuted}
                  style={styles.replyInput}
                />

                <Pressable
                  onPress={handleSendReply}
                  disabled={
                    isClosed ||
                    (!replyText.trim() && replyAttachments.length === 0)
                  }
                  style={[
                    styles.sendReplyBtn,
                    (isClosed ||
                      (!replyText.trim() && replyAttachments.length === 0)) && {
                      opacity: 0.45,
                    },
                  ]}
                >
                  <Send size={16} color={colors.white} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
    gap: space.sm,
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
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  pad: {
    padding: space.lg,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  summaryCard: {
    padding: space.md,
    gap: space.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  autoCloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoCloseText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  ticketTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: space.md,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.labelMd,
    color: colors.textPrimary,
    marginTop: 2,
  },
  reporterBox: {
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  reporterValue: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  descriptionText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  attachmentsBlock: {
    gap: space.xs,
    marginTop: space.xs,
  },
  attachHeading: {
    ...typography.labelBadge,
    color: colors.textMuted,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.tintStrong,
  },
  attachIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  attachMeta: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  timelineCard: {
    padding: space.md,
    gap: space.md,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stagePill: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  stagePillText: {
    ...typography.labelBadge,
    color: colors.successText,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  timelineRail: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    backgroundColor: colors.successText,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.successBorder,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: space.md,
  },
  timelineStatusTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  baakTag: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  baakTagText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  timelineMeta: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  msgCountText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  threadList: {
    gap: space.md,
  },
  msgWrap: {
    gap: 4,
  },
  msgWrapOwn: {
    alignItems: 'flex-end',
  },
  msgWrapStaff: {
    alignItems: 'flex-start',
  },
  msgSenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffAvatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  msgSenderName: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  staffRoleChip: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  staffRoleChipText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  msgTimeText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  msgBubble: {
    maxWidth: '90%',
    borderRadius: radius.card,
    padding: space.md,
  },
  msgBubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  msgBubbleStaff: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  msgBodyText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  msgAttachments: {
    marginTop: space.xs,
    gap: 4,
  },
  msgAttachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  msgAttachmentText: {
    ...typography.bodySm,
    color: colors.primary,
  },
  ratingCard: {
    padding: space.md,
    gap: space.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  ratingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingTitle: {
    ...typography.titleSm,
    color: colors.warningText,
  },
  verifiedPill: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  verifiedPillText: {
    ...typography.labelBadge,
    color: colors.successText,
  },
  ratingSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  starsBox: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  starsLabel: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  savedCommentBox: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    padding: space.sm,
  },
  savedCommentText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  ratingInput: {
    ...typography.bodySm,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  infoNoteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  infoNoteText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomSection: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  statusActionButtons: {
    flexDirection: 'row',
    gap: space.sm,
  },
  reopenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: 8,
  },
  reopenBtnText: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.input,
    paddingVertical: 8,
  },
  resolveBtnText: {
    ...typography.labelSm,
    color: colors.successText,
  },
  replyAttachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  replyAttachPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  replyAttachName: {
    ...typography.bodySm,
    color: colors.primary,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  attachIconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    height: 40,
  },
  sendReplyBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
