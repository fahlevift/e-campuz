import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import { NotifPriority, TicketStatus } from '@/types';

interface PriorityTagProps {
  priority: NotifPriority;
  style?: ViewStyle;
}

export const PriorityTag: React.FC<PriorityTagProps> = ({ priority, style }) => {
  if (priority !== 'urgent' && priority !== 'high') return null;

  const isUrgent = priority === 'urgent';
  return (
    <View
      style={[
        styles.tagBase,
        isUrgent ? styles.urgentTag : styles.warningTag,
        style,
      ]}
    >
      <Text
        style={[
          typography.labelSm,
          { color: isUrgent ? colors.urgentText : colors.warningText },
        ]}
      >
        {isUrgent ? 'Mendesak' : 'Penting'}
      </Text>
    </View>
  );
};

interface ChangeTagProps {
  oldValue?: string;
  newValue?: string;
  prefix?: string;
  inverted?: boolean;
  style?: ViewStyle;
}

export const ChangeTag: React.FC<ChangeTagProps> = ({
  oldValue,
  newValue,
  prefix,
  inverted = false,
  style,
}) => {
  return (
    <View style={[styles.changeWrap, style]}>
      <View style={[styles.tagBase, styles.warningTag]}>
        <Text style={[typography.labelSm, { color: colors.warningText }]}>Berubah</Text>
      </View>
      {oldValue && newValue ? (
        <View style={styles.deltaRow}>
          {prefix ? (
            <Text
              style={[
                typography.bodySm,
                { color: inverted ? colors.tintStrong : colors.textSecondary, marginRight: space.xs },
              ]}
            >
              {prefix}
            </Text>
          ) : null}
          <Text
            style={[
              typography.bodySm,
              styles.oldValue,
              inverted && { color: colors.tintStrong },
            ]}
          >
            {oldValue}
          </Text>
          <ArrowRight
            size={14}
            color={inverted ? colors.white : colors.iconMuted}
            style={styles.arrow}
          />
          <View
            style={[
              styles.newValueBox,
              inverted && { backgroundColor: colors.warningSoft, borderColor: colors.warningBorder },
            ]}
          >
            <Text
              style={[
                typography.labelMd,
                { color: inverted ? colors.warningText : colors.textPrimary },
              ]}
            >
              {newValue}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export type StatusKind =
  | 'assignment_pending'
  | 'assignment_submitted'
  | 'assignment_late'
  | 'assignment_graded'
  | 'bill_unpaid'
  | 'bill_paid'
  | 'bill_overdue'
  | 'bill_installment'
  | 'ticket_submitted'
  | 'ticket_in_progress'
  | 'ticket_need_info'
  | 'ticket_resolved'
  | 'ticket_closed'
  | 'schedule_cancelled'
  | 'schedule_normal';

interface StatusChipProps {
  status: StatusKind;
  customLabel?: string;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, customLabel, style }) => {
  const config = getStatusConfig(status);
  return (
    <View
      style={[
        styles.tagBase,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}
    >
      <Text style={[typography.labelSm, { color: config.text }]}>
        {customLabel || config.label}
      </Text>
    </View>
  );
};

export function mapTicketStatusToKind(status: TicketStatus): StatusKind {
  switch (status) {
    case 'submitted':
      return 'ticket_submitted';
    case 'in_progress':
      return 'ticket_in_progress';
    case 'need_info':
      return 'ticket_need_info';
    case 'resolved':
      return 'ticket_resolved';
    case 'closed':
      return 'ticket_closed';
  }
}

function getStatusConfig(status: StatusKind): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'assignment_late':
    case 'bill_overdue':
    case 'schedule_cancelled':
      return {
        label:
          status === 'assignment_late'
            ? 'Terlambat'
            : status === 'bill_overdue'
            ? 'Lewat Jatuh Tempo'
            : 'Dibatalkan',
        bg: colors.urgentSoft,
        text: colors.urgentText,
        border: colors.urgentBorder,
      };
    case 'bill_unpaid':
    case 'ticket_need_info':
      return {
        label: status === 'bill_unpaid' ? 'Belum Bayar' : 'Butuh Info Tambahan',
        bg: colors.warningSoft,
        text: colors.warningText,
        border: colors.warningBorder,
      };
    case 'assignment_submitted':
    case 'assignment_graded':
    case 'bill_paid':
    case 'ticket_resolved':
      return {
        label:
          status === 'assignment_submitted'
            ? 'Terkumpul'
            : status === 'assignment_graded'
            ? 'Dinilai'
            : status === 'bill_paid'
            ? 'Lunas'
            : 'Selesai',
        bg: colors.successSoft,
        text: colors.successText,
        border: colors.successBorder,
      };
    case 'assignment_pending':
    case 'bill_installment':
    case 'ticket_submitted':
    case 'ticket_in_progress':
    case 'schedule_normal':
      return {
        label:
          status === 'assignment_pending'
            ? 'Belum Dikerjakan'
            : status === 'bill_installment'
            ? 'Cicilan'
            : status === 'ticket_submitted'
            ? 'Terkirim'
            : status === 'ticket_in_progress'
            ? 'Diproses'
            : 'Terjadwal',
        bg: colors.tintSoft,
        text: colors.primary,
        border: colors.tintStrong,
      };
    case 'ticket_closed':
      return {
        label: 'Ditutup',
        bg: colors.surfaceMuted,
        text: colors.textMuted,
        border: colors.border,
      };
  }
}

const styles = StyleSheet.create({
  tagBase: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xxs + 1,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  urgentTag: {
    backgroundColor: colors.urgentSoft,
    borderColor: colors.urgentBorder,
  },
  warningTag: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  changeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldValue: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  arrow: {
    marginHorizontal: space.xs,
  },
  newValueBox: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
