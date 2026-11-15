import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet, ViewStyle } from 'react-native';
import {
  ChevronRight,
  FileText,
  Presentation,
  Video,
  Link as LinkIcon,
  Download,
  CheckCircle2,
  WifiOff,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import { formatFileSize } from '@/utils/format';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          style={styles.actionHit}
        >
          <Text style={[typography.labelMd, { color: colors.secondary }]}>{actionLabel}</Text>
          <ChevronRight size={16} color={colors.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
};

interface ListItemSwitchProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const ListItemSwitch: React.FC<ListItemSwitchProps> = ({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
}) => {
  return (
    <View style={[styles.switchRow, disabled && { opacity: 0.5 }]}>
      {icon ? <View style={styles.switchIcon}>{icon}</View> : null}
      <View style={{ flex: 1, paddingRight: space.md }}>
        <Text style={[typography.titleSm, { color: colors.textPrimary }]}>{title}</Text>
        {description ? (
          <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.secondary }}
        thumbColor={colors.white}
      />
    </View>
  );
};

interface FileItemProps {
  title: string;
  type: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
  sizeBytes?: number;
  subtitle?: string;
  isNew?: boolean;
  isDownloaded?: boolean;
  downloadProgress?: number;
  onPress?: () => void;
  onDownload?: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  title,
  type,
  sizeBytes,
  subtitle,
  isNew,
  isDownloaded,
  downloadProgress,
  onPress,
  onDownload,
}) => {
  const renderIcon = () => {
    switch (type) {
      case 'ppt':
        return <Presentation size={space.iconMd} color={colors.warningText} />;
      case 'video':
        return <Video size={space.iconMd} color={colors.chatCategory} />;
      case 'link':
        return <LinkIcon size={space.iconMd} color={colors.tertiary} />;
      default:
        return <FileText size={space.iconMd} color={colors.primary} />;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.fileCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.fileIconBox}>{renderIcon()}</View>
      <View style={{ flex: 1 }}>
        <View style={styles.fileTitleRow}>
          <Text
            numberOfLines={1}
            style={[typography.titleSm, { color: colors.textPrimary, flex: 1 }]}
          >
            {title}
          </Text>
          {isNew ? (
            <View style={styles.newPill}>
              <Text style={[typography.labelBadge, { color: colors.primary }]}>Baru</Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
          {subtitle ? `${subtitle} · ` : ''}
          {type.toUpperCase()}
          {sizeBytes ? ` · ${formatFileSize(sizeBytes)}` : ''}
        </Text>
        {typeof downloadProgress === 'number' && downloadProgress < 100 ? (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
          </View>
        ) : null}
      </View>
      {onDownload ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDownloaded ? 'Tersedia offline' : `Unduh ${title}`}
          onPress={onDownload}
          style={styles.downloadBtn}
        >
          {isDownloaded ? (
            <CheckCircle2 size={space.iconMd} color={colors.success} />
          ) : (
            <Download size={space.iconMd} color={colors.primary} />
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export const OfflineBanner: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.offlineBanner}>
      <WifiOff size={16} color={colors.urgentText} />
      <Text style={[typography.labelMd, { color: colors.urgentText, marginLeft: space.sm }]}>
        Anda sedang offline. Menampilkan data lokal.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  actionHit: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: space.minTap,
    paddingLeft: space.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: space.sm,
  },
  switchIcon: {
    marginRight: space.md,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  newPill: {
    backgroundColor: colors.tintStrong,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  downloadBtn: {
    width: space.minTap,
    height: space.minTap,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    marginTop: space.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.secondary,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.urgentSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.urgentBorder,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
});
