import React, { type ComponentRef, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
  BadgeCheck,
  ChevronDown,
  FileText,
  Info,
  Megaphone,
  Paperclip,
  Pin,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react-native';
import { colors, elevation, radius, space, typography } from '@/theme';
import { useChatRoomDetailData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import {
  Button,
  ChatBubble,
  EmptyState,
  ErrorState,
  SectionSkeleton,
} from '@/components/ui';
import { ChatMessage } from '@/types';
import { formatDateIdLong } from '@/utils/format';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const user = useAppStore((s) => s.user);
  const isOffline = useAppStore((s) => s.isOffline);
  const showToast = useAppStore((s) => s.showToast);

  const {
    roomQuery,
    messagesQuery,
    sendMutation,
    pinMutation,
    announcementMutation,
    deleteMutation,
    reportMutation,
  } = useChatRoomDetailData(roomId || '');

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [sendAsAnnouncement, setSendAsAnnouncement] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [failedDrafts, setFailedDrafts] = useState<ChatMessage[]>([]);
  const [reportingMsg, setReportingMsg] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('Konten tidak relevan / spam');

  const room = roomQuery.data;
  const messages = useMemo(() => {
    const base = messagesQuery.data ?? [];
    const combined = [...base, ...failedDrafts];
    if (!searchQuery.trim()) return combined;
    const q = searchQuery.trim().toLowerCase();
    return combined.filter(
      (m) =>
        (m.text || '').toLowerCase().includes(q) ||
        (m.senderName || '').toLowerCase().includes(q),
    );
  }, [messagesQuery.data, failedDrafts, searchQuery]);

  const isAdmin = Boolean(
    user?.role === 'dosen' ||
      user?.isClassLeader ||
      (room?.adminIds && user && room.adminIds.includes(user.id)),
  );

  const mentionChips = useMemo(() => {
    const baseRoleChip = room?.type === 'class' ? '@Dosen Wali' : '@Dosen Pengampu';
    const otherMembers = (room?.members || [])
      .filter((m) => m.userId !== user?.id)
      .slice(0, 3)
      .map((m) => `@${m.name}`);

    if (otherMembers.length > 0) {
      return [baseRoleChip, '@Ketua Kelas', ...otherMembers];
    }
    if (room?.type === 'class') {
      return ['@Dosen Wali', '@Ketua Kelas', '@Ahmad Fadil', '@Rina Salsabila'];
    }
    return ['@Dosen Pengampu', '@Ketua Kelas', '@Ahmad Fadil', '@Rina Salsabila'];
  }, [room?.type, room?.members, user?.id]);

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        setAttachedFiles((prev) => [...prev, res.assets[0].name]);
      }
    } catch {
      setAttachedFiles((prev) => [...prev, 'Lampiran_Kuliah_TI3A.pdf']);
    }
  };

  const handleInsertMention = (mentionTag: string) => {
    setInputText((prev) => (prev ? `${prev} ${mentionTag} ` : `${mentionTag} `));
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    if (isOffline && user) {
      const failedMsg: ChatMessage = {
        id: `failed-${Date.now()}`,
        roomId: roomId || '',
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        senderIsClassLeader: user.isClassLeader,
        text: trimmed || undefined,
        attachments: attachedFiles,
        replyToId: replyTo?.id,
        replyToPreview: replyTo
          ? {
              senderName: replyTo.senderName || 'Anggota',
              text: replyTo.text || 'Lampiran',
            }
          : undefined,
        isAnnouncement: sendAsAnnouncement,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'failed',
      };
      setFailedDrafts((prev) => [...prev, failedMsg]);
      setInputText('');
      setAttachedFiles([]);
      setReplyTo(null);
      setSendAsAnnouncement(false);
      showToast('Koneksi terputus. Pesan gagal dikirim.');
      return;
    }

    const extractedMentions = trimmed.match(/@[\w.\s]+/g) || [];
    const prevText = inputText;
    const prevFiles = attachedFiles;
    const prevReply = replyTo;
    const prevAnnounce = sendAsAnnouncement;

    setInputText('');
    setAttachedFiles([]);
    setReplyTo(null);
    setSendAsAnnouncement(false);

    sendMutation.mutate(
      {
        text: trimmed || undefined,
        attachments: prevFiles,
        replyToMessage: prevReply,
        mentions: extractedMentions,
        isAnnouncement: prevAnnounce,
      },
      {
        onSuccess: () => {
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
        },
        onError: () => {
          setInputText(prevText);
          setAttachedFiles(prevFiles);
          setReplyTo(prevReply);
          setSendAsAnnouncement(prevAnnounce);
        },
      },
    );
  };

  const handleRetryFailed = (msg: ChatMessage) => {
    if (isOffline) {
      showToast('Masih offline. Matikan mode offline untuk mengirim ulang.');
      return;
    }
    setFailedDrafts((prev) => prev.filter((d) => d.id !== msg.id));
    sendMutation.mutate({
      text: msg.text,
      attachments: msg.attachments,
      isAnnouncement: msg.isAnnouncement,
    });
  };

  const getRoomInitials = () => {
    if (!room) return 'RM';
    if (room.type === 'class') return 'TI';
    return room.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={() => router.push(`/chat/${roomId}/info`)}
          style={styles.headerCenter}
        >
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.roomAvatar,
                room?.type === 'course' && { backgroundColor: colors.secondary },
              ]}
            >
              <Text style={styles.roomAvatarText}>{getRoomInitials()}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {room?.name || 'Room Diskusi'}
              </Text>
              <BadgeCheck size={16} color={colors.secondary} />
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {room?.lecturerName || room?.description || 'Kelas TI-3A'} •{' '}
              {room?.memberIds.length || 38} Mhs
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setSearchOpen((v) => !v)}
            style={styles.iconBtn}
            accessibilityLabel="Cari pesan di room"
          >
            <Search size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/chat/${roomId}/info`)}
            style={styles.iconBtn}
            accessibilityLabel="Info Room"
          >
            <Info size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar in Room */}
      {searchOpen ? (
        <View style={styles.inRoomSearch}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari isi pesan atau nama pengirim..."
            placeholderTextColor={colors.textMuted}
            style={styles.inRoomSearchInput}
            autoFocus
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Pinned Message Bar */}
      {room?.pinnedMessage ? (
        <Pressable
          onPress={() => setPinnedExpanded((v) => !v)}
          style={[
            styles.pinnedBar,
            room.type === 'course' && styles.pinnedBarCourse,
          ]}
        >
          <View style={styles.pinnedIcon}>
            <Pin
              size={15}
              color={room.type === 'course' ? colors.primary : colors.warningText}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.pinnedHeaderLabel,
                room.type === 'course' && { color: colors.primary },
              ]}
            >
              PESAN TERSEMAT • Oleh {room.pinnedMessage.senderName || 'Dosen Pengampu'}
            </Text>
            <Text
              style={styles.pinnedBodyText}
              numberOfLines={pinnedExpanded ? 6 : 1}
            >
              {room.pinnedMessage.text || 'Lampiran pengumuman tersemat'}
            </Text>
          </View>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Message Feed */}
        {roomQuery.isLoading || messagesQuery.isLoading ? (
          <View style={styles.pad}>
            <SectionSkeleton count={4} />
          </View>
        ) : roomQuery.isError || messagesQuery.isError ? (
          <View style={styles.pad}>
            <ErrorState
              message="Gagal memuat percakapan room."
              onRetry={() => {
                roomQuery.refetch();
                messagesQuery.refetch();
              }}
            />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.pad}>
            <EmptyState
              title="Belum ada pesan"
              description="Mulai diskusi perkuliahan atau tanyakan materi di room resmi ini."
            />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {/* Date Pill */}
            <View style={styles.datePillWrap}>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>
                  Hari Ini, {formatDateIdLong(new Date())}
                </Text>
              </View>
            </View>

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
                isAdminView={isAdmin}
                onReply={(m) => setReplyTo(m)}
                onPin={(m) => pinMutation.mutate(m.id)}
                onToggleAnnouncement={(m) => announcementMutation.mutate(m.id)}
                onDelete={(m) => deleteMutation.mutate(m.id)}
                onReport={(m) => setReportingMsg(m)}
                onRetry={handleRetryFailed}
              />
            ))}
          </ScrollView>
        )}

        {/* Quick Mention & Action Chips Bar */}
        <View style={styles.quickChipsContainer}>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsScroll}
          >
            {mentionChips.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => handleInsertMention(chip)}
                style={styles.mentionChip}
              >
                <Text style={styles.mentionChipText}>{chip}</Text>
              </Pressable>
            ))}

            <Pressable onPress={handlePickFile} style={styles.attachmentQuickChip}>
              <Paperclip size={13} color={colors.textSecondary} />
              <Text style={styles.attachmentQuickChipText}>Lampiran Tugas</Text>
            </Pressable>

            {isAdmin ? (
              <Pressable
                onPress={() => setSendAsAnnouncement((v) => !v)}
                style={[
                  styles.announceToggleChip,
                  sendAsAnnouncement && styles.announceToggleChipActive,
                ]}
              >
                <Megaphone
                  size={13}
                  color={sendAsAnnouncement ? colors.warningText : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.announceToggleText,
                    sendAsAnnouncement && { color: colors.warningText, fontWeight: '700' },
                  ]}
                >
                  {sendAsAnnouncement ? 'Mode Pengumuman Aktif' : 'Tandai Pengumuman'}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>

        {/* Reply / Attachment Preview Bar */}
        {replyTo || attachedFiles.length > 0 ? (
          <View style={styles.previewDrawer}>
            {replyTo ? (
              <View style={styles.replyPreviewRow}>
                <View style={styles.replyStripe} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.replyPreviewSender}>
                    Membalas {replyTo.senderName || 'Anggota'}
                  </Text>
                  <Text style={styles.replyPreviewText} numberOfLines={1}>
                    {replyTo.text || 'Lampiran berkas'}
                  </Text>
                </View>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : null}

            {attachedFiles.length > 0 ? (
              <View style={styles.attachedFilesRow}>
                {attachedFiles.map((file, idx) => (
                  <View key={`${file}-${idx}`} style={styles.attachedFilePill}>
                    <FileText size={14} color={colors.primary} />
                    <Text style={styles.attachedFileName} numberOfLines={1}>
                      {file}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <X size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Composer Bar */}
        <View style={styles.composerBar}>
          <Pressable
            onPress={handlePickFile}
            style={styles.attachBtn}
            accessibilityLabel="Tambah lampiran"
          >
            <Plus size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.inputWrap}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Ketik pesan untuk ${room?.courseCode || 'TI-3A'}...`}
              placeholderTextColor={colors.textMuted}
              style={styles.composerInput}
              multiline
            />
          </View>

          <Pressable
            onPress={handleSend}
            hitSlop={10}
            disabled={!inputText.trim() && attachedFiles.length === 0}
            style={[
              styles.sendBtn,
              !inputText.trim() && attachedFiles.length === 0 && styles.sendBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Kirim pesan"
          >
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Laporkan Pesan */}
      <Modal
        visible={Boolean(reportingMsg)}
        transparent
        animationType="fade"
        onRequestClose={() => setReportingMsg(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Laporkan Pesan</Text>
            <Text style={styles.modalSubtitle}>
              Pilih alasan pelaporan untuk pesan dari {reportingMsg?.senderName}:
            </Text>

            {[
              'Konten tidak relevan / spam',
              'Bahasa tidak sopan / pelecehan',
              'Informasi akademik menyesatkan',
            ].map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setReportReason(reason)}
                style={[
                  styles.reasonOption,
                  reportReason === reason && styles.reasonOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    reportReason === reason && {
                      color: colors.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {reason}
                </Text>
              </Pressable>
            ))}

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => setReportingMsg(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Kirim Laporan"
                variant="danger"
                onPress={() => {
                  if (reportingMsg) {
                    reportMutation.mutate({
                      messageId: reportingMsg.id,
                      reason: reportReason,
                    });
                  }
                  setReportingMsg(null);
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
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: space.xs,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  roomAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomAvatarText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inRoomSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inRoomSearchInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  pinnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
  },
  pinnedBarCourse: {
    backgroundColor: colors.tintSoft,
    borderBottomColor: colors.tintStrong,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  pinnedIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedHeaderLabel: {
    ...typography.labelSm,
    color: colors.warningText,
  },
  pinnedBodyText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    marginTop: 1,
  },
  pad: {
    padding: space.lg,
  },
  messagesContainer: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  datePillWrap: {
    alignItems: 'center',
    marginBottom: space.md,
  },
  datePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  datePillText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  quickChipsContainer: {
    backgroundColor: colors.bg,
    paddingVertical: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickChipsScroll: {
    paddingHorizontal: space.md,
    gap: space.xs,
    alignItems: 'center',
  },
  mentionChip: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  mentionChipText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  attachmentQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  attachmentQuickChipText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  announceToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  announceToggleChipActive: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  announceToggleText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  previewDrawer: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.xs,
  },
  replyPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surfaceMuted,
    padding: space.sm,
    borderRadius: radius.md,
  },
  replyStripe: {
    width: 3,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  replyPreviewSender: {
    ...typography.labelSm,
    color: colors.primary,
  },
  replyPreviewText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  attachedFilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  attachedFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  attachedFileName: {
    ...typography.bodySm,
    color: colors.primary,
    maxWidth: 180,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sheet,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 110,
  },
  composerInput: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level1,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  reasonOption: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.tintSoft,
  },
  reasonOptionText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xs,
  },
});
