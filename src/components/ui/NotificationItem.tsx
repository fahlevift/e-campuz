import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Calendar,
  ClipboardList,
  Wallet,
  BookOpen,
  MessageSquare,
  LifeBuoy,
  Megaphone,
  Check,
  Trash2,
  Copy,
  ArrowRight,
} from 'lucide-react-native';
import { colors, typography, radius, space, notifCategoryColors } from '@/theme';
import { AppNotification } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import { PriorityTag } from './StatusTags';

interface NotificationItemProps {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
  onToggleRead?: (item: AppNotification) => void;
  onDelete?: (item: AppNotification) => void;
  onCopyVa?: (va: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onPress,
  onToggleRead,
  onDelete,
  onCopyVa,
}) => {
  const isUrgent = item.priority === 'urgent';
  const isHigh = item.priority === 'high';

  const getCategoryStyle = () => {
    if (item.category === 'SCHEDULE' && isUrgent) {
      return notifCategoryColors.SCHEDULE_URGENT;
    }
    return notifCategoryColors[item.category] || notifCategoryColors.ANNOUNCEMENT;
  };

  const catStyle = getCategoryStyle();

  const renderCategoryIcon = () => {
    const iconColor = catStyle.icon;
    const size = space.iconMd;
    switch (item.category) {
      case 'SCHEDULE':
        return <Calendar size={size} color={iconColor} />;
      case 'ASSIGNMENT':
        return <ClipboardList size={size} color={iconColor} />;
      case 'FINANCE':
        return <Wallet size={size} color={iconColor} />;
      case 'LEARNING':
        return <BookOpen size={size} color={iconColor} />;
      case 'CHAT':
        return <MessageSquare size={size} color={iconColor} />;
      case 'SUPPORT':
        return <LifeBuoy size={size} color={iconColor} />;
      default:
        return <Megaphone size={size} color={iconColor} />;
    }
  };

  const oldValue = item.meta?.oldValue;
  const newValue = item.meta?.newValue;
  const vaNumber = item.meta?.vaNumber;

  const getContextualLabel = () => {
    switch (item.category) {
      case 'SCHEDULE':
        return 'Lihat Detail Jadwal';
      case 'ASSIGNMENT':
        return item.type === 'ASSIGNMENT_GRADED' ? 'Lihat Nilai Tugas' : 'Kirim Tugas Sekarang';
      case 'FINANCE':
        return 'Lihat Detail Tagihan';
      case 'LEARNING':
        return 'Buka Materi';
      case 'CHAT':
        return 'Buka Room Chat';
      case 'SUPPORT':
        return 'Lihat Detail Tiket';
      default:
        return null;
    }
  };

  const contextualLabel = getContextualLabel();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        isUrgent && styles.urgentCard,
        isHigh && !isUrgent && styles.warningCard,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: catStyle.bg }]}>
          {renderCategoryIcon()}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.metaHeader}>
            <View style={styles.tagsRow}>
              <PriorityTag priority={item.priority} />
              <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
            <View style={styles.rightStatus}>
              {!item.isRead ? (
                <View style={styles.unreadDot} />
              ) : (
                <Text style={[typography.labelBadge, { color: colors.textMuted }]}>
                  ✓ Terbaca
                </Text>
              )}
            </View>
          </View>

          <Text
            style={[
              item.isRead ? typography.titleSm : typography.titleSmUnread,
              {
                color: item.isRead ? colors.textSecondary : colors.textPrimary,
                marginTop: space.xxs,
              },
            ]}
          >
            {item.title}
          </Text>

          {oldValue && newValue ? (
            <View style={styles.deltaContainer}>
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                {item.meta?.courseName ? `${item.meta.courseName}: ` : 'Ruang '}
              </Text>
              <Text style={[typography.bodySm, styles.strikeOld]}>{oldValue}</Text>
              <ArrowRight size={14} color={colors.iconMuted} style={{ marginHorizontal: 4 }} />
              <View style={styles.newBox}>
                <Text style={[typography.labelMd, { color: colors.textPrimary }]}>{newValue}</Text>
              </View>
            </View>
          ) : (
            <Text
              numberOfLines={2}
              style={[
                typography.bodySm,
                { color: colors.textSecondary, marginTop: space.xxs },
              ]}
            >
              {item.body}
            </Text>
          )}

          {vaNumber && onCopyVa ? (
            <View style={styles.vaInlineBox}>
              <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
                VA: {vaNumber}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Salin nomor VA"
                onPress={() => onCopyVa(vaNumber)}
                style={styles.copyInlineBtn}
              >
                <Copy size={14} color={colors.primary} />
                <Text style={[typography.labelSm, { color: colors.primary, marginLeft: 4 }]}>
                  Salin
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.bottomActions}>
            {contextualLabel ? (
              <Text style={[typography.labelMd, { color: colors.secondary }]}>
                {contextualLabel} →
              </Text>
            ) : <View />}

            <View style={styles.quickActionIcons}>
              {onToggleRead ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                  onPress={() => onToggleRead(item)}
                  style={styles.iconActionBtn}
                >
                  <Check size={16} color={colors.iconMuted} />
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus notifikasi"
                  onPress={() => onDelete(item)}
                  style={styles.iconActionBtn}
                >
                  <Trash2 size={16} color={colors.iconMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  urgentCard: {
    backgroundColor: colors.urgentSoft,
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  warningCard: {
    borderColor: colors.warningBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  rightStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: space.unreadDotSize,
    height: space.unreadDotSize,
    borderRadius: radius.full,
    backgroundColor: colors.unreadDot,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: space.xs,
  },
  strikeOld: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  newBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  vaInlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    marginTop: space.sm,
  },
  copyInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: space.xs,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  quickActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
