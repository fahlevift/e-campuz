import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Clock,
  MapPin,
  User as UserIcon,
  MessageSquare,
  Video,
  ArrowRight,
  Info,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { ScheduleItem } from '@/types';
import { formatTimeDot } from '@/utils/format';
import { ChangeTag, StatusChip } from './StatusTags';
import { Button } from './Button';

interface ScheduleCardProps {
  item: ScheduleItem;
  variant?: 'hero' | 'compact';
  countdownLabel?: string;
  onPress: () => void;
  onOpenChat?: () => void;
  onOpenCourse?: () => void;
  onEditSchedule?: () => void;
  isLecturer?: boolean;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  item,
  variant = 'compact',
  countdownLabel,
  onPress,
  onOpenChat,
  onOpenCourse,
  onEditSchedule,
  isLecturer = false,
}) => {
  const latestChange = item.changes?.[0];
  const isChanged = item.status === 'changed';
  const isCancelled = item.status === 'cancelled';

  if (variant === 'hero') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Kuliah berikutnya: ${item.courseName}`}
        onPress={onPress}
        style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.94 }]}
      >
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroPills}>
            {item.courseCode ? (
              <View style={styles.heroCodePill}>
                <Text style={[typography.labelSm, { color: colors.white }]}>
                  {item.courseCode} · {item.courseSks || 3} SKS
                </Text>
              </View>
            ) : null}
            {isChanged ? (
              <View style={styles.heroChangedPill}>
                <Text style={[typography.labelSm, { color: colors.warningText }]}>
                  Berubah
                </Text>
              </View>
            ) : null}
          </View>
          {countdownLabel ? (
            <View style={styles.countdownPill}>
              <Clock size={12} color={colors.primary} />
              <Text style={[typography.labelSm, { color: colors.primary, marginLeft: 4 }]}>
                {countdownLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[typography.headlineMd, { color: colors.white, marginTop: space.sm }]}>
          {item.courseName}
        </Text>

        <View style={styles.heroInfoGrid}>
          <View style={styles.heroInfoItem}>
            <Clock size={16} color={colors.tintStrong} />
            <Text style={[typography.bodyMd, { color: colors.white, marginLeft: space.xs }]}>
              {formatTimeDot(item.startTime)}–{formatTimeDot(item.endTime)} WIB
            </Text>
          </View>
          <View style={styles.heroInfoItem}>
            <MapPin size={16} color={colors.tintStrong} />
            {isChanged && latestChange?.field === 'room' ? (
              <View style={styles.heroRoomDelta}>
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.tintStrong, textDecorationLine: 'line-through' },
                  ]}
                >
                  {latestChange.oldValue}
                </Text>
                <ArrowRight size={13} color={colors.white} style={{ marginHorizontal: 4 }} />
                <View style={styles.heroNewRoomBadge}>
                  <Text style={[typography.labelMd, { color: colors.warningText }]}>
                    {latestChange.newValue}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[typography.bodyMd, { color: colors.white, marginLeft: space.xs }]}>
                {item.room}
              </Text>
            )}
          </View>
          {item.lecturerNames?.length ? (
            <View style={styles.heroInfoItem}>
              <UserIcon size={16} color={colors.tintStrong} />
              <Text
                numberOfLines={1}
                style={[typography.bodySm, { color: colors.tintStrong, marginLeft: space.xs }]}
              >
                {item.lecturerNames.join(', ')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.heroFooter}>
          {onOpenChat ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka Chat Mata Kuliah"
              onPress={onOpenChat}
              style={styles.heroSecondaryBtn}
            >
              <MessageSquare size={16} color={colors.white} />
              <Text style={[typography.labelMd, { color: colors.white, marginLeft: space.xs }]}>
                Chat MK
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lihat Detail Jadwal"
            onPress={onPress}
            style={styles.heroPrimaryBtn}
          >
            <Text style={[typography.labelMd, { color: colors.primary }]}>Detail Jadwal</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.courseName}, ${formatTimeDot(item.startTime)} sampai ${formatTimeDot(
        item.endTime
      )}, ruang ${item.room}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactCard,
        isChanged && styles.changedCard,
        isCancelled && styles.cancelledCard,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.compactTopRow}>
        <View style={styles.timeBadge}>
          <Clock size={14} color={isCancelled ? colors.textMuted : colors.primary} />
          <Text
            style={[
              typography.labelMd,
              {
                color: isCancelled ? colors.textMuted : colors.primary,
                marginLeft: space.xs,
                textDecorationLine: isCancelled ? 'line-through' : 'none',
              },
            ]}
          >
            {formatTimeDot(item.startTime)} – {formatTimeDot(item.endTime)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.typePill}>
            <Text style={[typography.labelSm, { color: colors.textSecondary }]}>
              {item.type === 'teori'
                ? 'Teori'
                : item.type === 'praktikum'
                ? 'Praktikum'
                : 'Online'}
            </Text>
          </View>
          {isCancelled ? <StatusChip status="schedule_cancelled" /> : null}
        </View>
      </View>

      <Text
        style={[
          typography.titleMd,
          {
            color: isCancelled ? colors.textMuted : colors.textPrimary,
            marginTop: space.sm,
            textDecorationLine: isCancelled ? 'line-through' : 'none',
          },
        ]}
      >
        {item.courseName}
      </Text>

      {item.courseCode ? (
        <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
          {item.courseCode} · {item.courseSks || 3} SKS
          {item.className ? ` · Kelas ${item.className}` : ''}
        </Text>
      ) : null}

      <View style={styles.compactMeta}>
        <View style={styles.metaRow}>
          <MapPin size={15} color={colors.iconMuted} />
          {isChanged && latestChange ? (
            <ChangeTag
              prefix={latestChange.field === 'room' ? 'Ruang' : 'Jadwal'}
              oldValue={latestChange.oldValue}
              newValue={latestChange.newValue}
              style={{ marginLeft: space.xs }}
            />
          ) : (
            <Text style={[typography.bodyMd, { color: colors.textPrimary, marginLeft: space.xs }]}>
              Ruang {item.room}
            </Text>
          )}
        </View>

        {item.lecturerNames?.length ? (
          <View style={styles.metaRow}>
            <UserIcon size={15} color={colors.iconMuted} />
            <Text
              style={[typography.bodySm, { color: colors.textSecondary, marginLeft: space.xs }]}
            >
              {item.lecturerNames.join(', ')}
            </Text>
          </View>
        ) : null}
      </View>

      {latestChange?.reason ? (
        <View style={styles.reasonBox}>
          <Info size={15} color={colors.warningText} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.warningText, marginLeft: space.xs, flex: 1 },
            ]}
          >
            Catatan Dosen: {latestChange.reason}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        {item.type === 'online' && item.onlineUrl ? (
          <Button
            title="Gabung Kelas Online"
            onPress={onPress}
            variant="secondary"
            size="sm"
            icon={<Video size={16} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        ) : null}
        {isLecturer && onEditSchedule ? (
          <Button
            title="Ubah Ruangan / Jadwal"
            onPress={onEditSchedule}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          />
        ) : null}
        {!isLecturer && onOpenCourse ? (
          <Button
            title="Materi & Tugas"
            onPress={onOpenCourse}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          />
        ) : null}
        {onOpenChat ? (
          <Button
            title="Chat MK"
            onPress={onOpenChat}
            variant="ghost"
            size="sm"
            icon={<MessageSquare size={15} color={colors.textSecondary} />}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: space.lg,
    ...elevation.level2,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  heroPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  heroCodePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  heroChangedPill: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroInfoGrid: {
    marginTop: space.md,
    gap: space.xs + 2,
  },
  heroInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRoomDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: space.xs,
  },
  heroNewRoomBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.sm,
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.input,
    minHeight: 40,
  },
  heroPrimaryBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.input,
    minHeight: 40,
    justifyContent: 'center',
  },
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    ...elevation.level1,
  },
  changedCard: {
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
  },
  cancelledCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  typePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  compactMeta: {
    marginTop: space.md,
    gap: space.xs + 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radius.md,
    padding: space.sm,
    marginTop: space.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
