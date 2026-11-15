import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Reply,
  Pin,
  Trash2,
  Megaphone,
  FileText,
  RotateCcw,
  Flag,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isAdminView?: boolean;
  onReply?: (message: ChatMessage) => void;
  onPin?: (message: ChatMessage) => void;
  onToggleAnnouncement?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReport?: (message: ChatMessage) => void;
  onRetry?: (message: ChatMessage) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwn,
  isAdminView = false,
  onReply,
  onPin,
  onToggleAnnouncement,
  onDelete,
  onReport,
  onRetry,
}) => {
  const timeStr = new Date(message.createdAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getRoleBadge = () => {
    if (message.senderRole === 'dosen') {
      return { label: 'Dosen', bg: colors.tintSoft, text: colors.primary };
    }
    if (message.senderIsClassLeader) {
      return { label: 'Ketua Kelas', bg: colors.warningSoft, text: colors.warningText };
    }
    return null;
  };

  const roleBadge = getRoleBadge();
  const initials = (message.senderName || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (message.deleted) {
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        <View style={styles.deletedBubble}>
          <Text style={[typography.bodySm, { color: colors.textMuted, fontStyle: 'italic' }]}>
            Pesan dihapus oleh admin
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn ? (
        <View
          style={[
            styles.avatar,
            message.senderRole === 'dosen' && { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[typography.labelSm, { color: colors.white }]}>{initials}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          message.isAnnouncement && styles.bubbleAnnouncement,
        ]}
      >
        {!isOwn ? (
          <View style={styles.senderRow}>
            <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
              {message.senderName || 'Anggota'}
            </Text>
            {roleBadge ? (
              <View style={[styles.rolePill, { backgroundColor: roleBadge.bg }]}>
                <Text style={[typography.labelBadge, { color: roleBadge.text }]}>
                  {roleBadge.label}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {message.isAnnouncement ? (
          <View style={styles.announcementHeader}>
            <Megaphone size={13} color={colors.warningText} />
            <Text style={[typography.labelSm, { color: colors.warningText, marginLeft: 4 }]}>
              PENGUMUMAN PENTING
            </Text>
          </View>
        ) : null}

        {message.replyToPreview ? (
          <View style={[styles.replyBox, isOwn && styles.replyBoxOwn]}>
            <Text
              style={[
                typography.labelSm,
                { color: isOwn ? colors.tintStrong : colors.primary },
              ]}
            >
              {message.replyToPreview.senderName}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                typography.bodySm,
                { color: isOwn ? colors.white : colors.textSecondary },
              ]}
            >
              {message.replyToPreview.text}
            </Text>
          </View>
        ) : null}

        {message.text ? (
          <Text
            style={[
              typography.bodyLg,
              {
                color: isOwn && !message.isAnnouncement ? colors.white : colors.textPrimary,
              },
            ]}
          >
            {message.text}
          </Text>
        ) : null}

        {message.attachments?.length ? (
          <View style={styles.attachmentsList}>
            {message.attachments.map((att, idx) => (
              <View key={idx} style={styles.attachmentChip}>
                <FileText size={15} color={colors.primary} />
                <Text
                  numberOfLines={1}
                  style={[
                    typography.bodySm,
                    { color: colors.primary, marginLeft: space.xs, flex: 1 },
                  ]}
                >
                  {att}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <Text
            style={[
              typography.bodySm,
              {
                color:
                  isOwn && !message.isAnnouncement ? colors.tintStrong : colors.textMuted,
              },
            ]}
          >
            {timeStr.replace(':', '.')}
            {isOwn
              ? message.deliveryStatus === 'sending'
                ? ' · Mengirim…'
                : message.deliveryStatus === 'failed'
                ? ' · Gagal'
                : ' · Terkirim'
              : ''}
          </Text>

          <View style={styles.actionLinks}>
            {message.deliveryStatus === 'failed' && onRetry ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kirim ulang pesan"
                onPress={() => onRetry(message)}
                style={styles.miniAction}
              >
                <RotateCcw size={13} color={colors.urgent} />
                <Text style={[typography.labelBadge, { color: colors.urgent, marginLeft: 2 }]}>
                  Kirim Ulang
                </Text>
              </Pressable>
            ) : null}

            {onReply ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Balas pesan"
                onPress={() => onReply(message)}
                style={styles.miniAction}
              >
                <Reply
                  size={13}
                  color={
                    isOwn && !message.isAnnouncement ? colors.tintStrong : colors.iconMuted
                  }
                />
              </Pressable>
            ) : null}

            {isAdminView && onPin ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sematkan pesan"
                onPress={() => onPin(message)}
                style={styles.miniAction}
              >
                <Pin
                  size={13}
                  color={
                    isOwn && !message.isAnnouncement ? colors.tintStrong : colors.iconMuted
                  }
                />
              </Pressable>
            ) : null}

            {isAdminView && onToggleAnnouncement ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tandai pengumuman"
                onPress={() => onToggleAnnouncement(message)}
                style={styles.miniAction}
              >
                <Megaphone
                  size={13}
                  color={
                    isOwn && !message.isAnnouncement ? colors.tintStrong : colors.iconMuted
                  }
                />
              </Pressable>
            ) : null}

            {(isAdminView || isOwn) && onDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hapus pesan"
                onPress={() => onDelete(message)}
                style={styles.miniAction}
              >
                <Trash2
                  size={13}
                  color={
                    isOwn && !message.isAnnouncement ? colors.tintStrong : colors.urgent
                  }
                />
              </Pressable>
            ) : null}

            {!isOwn && onReport ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Laporkan pesan"
                onPress={() => onReport(message)}
                style={styles.miniAction}
              >
                <Flag size={13} color={colors.iconMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: space.md,
    gap: space.sm,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleAnnouncement: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
  },
  deletedBubble: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginBottom: 4,
  },
  rolePill: {
    paddingHorizontal: space.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyBox: {
    backgroundColor: colors.surfaceMuted,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    marginBottom: space.xs,
  },
  replyBoxOwn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderLeftColor: colors.white,
  },
  attachmentsList: {
    marginTop: space.xs,
    gap: 4,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
    gap: space.sm,
  },
  actionLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
  },
});
