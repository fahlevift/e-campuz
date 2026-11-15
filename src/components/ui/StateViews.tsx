import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { Inbox, AlertTriangle } from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import { Button } from './Button';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SectionSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <Skeleton width={90} height={16} borderRadius={radius.full} />
            <Skeleton width={60} height={14} />
          </View>
          <Skeleton width="80%" height={18} style={{ marginTop: space.sm }} />
          <Skeleton width="60%" height={14} style={{ marginTop: space.xs }} />
        </View>
      ))}
    </View>
  );
};

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  style,
}) => {
  return (
    <View style={[styles.stateBox, style]}>
      <View style={styles.iconCircle}>
        {icon || <Inbox size={space.iconLg} color={colors.iconMuted} />}
      </View>
      <Text style={[typography.titleMd, styles.stateTitle]}>{title}</Text>
      {description ? (
        <Text style={[typography.bodyMd, styles.stateDesc]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={{ marginTop: space.md }}
        />
      ) : null}
    </View>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal memuat data',
  message = 'Periksa koneksi internet Anda lalu coba lagi.',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.stateBox, styles.errorBox, style]}>
      <View style={[styles.iconCircle, styles.errorIconCircle]}>
        <AlertTriangle size={space.iconLg} color={colors.urgent} />
      </View>
      <Text style={[typography.titleMd, styles.stateTitle]}>{title}</Text>
      <Text style={[typography.bodyMd, styles.stateDesc]}>{message}</Text>
      <Button
        title="Coba Lagi"
        onPress={onRetry}
        variant="primary"
        size="sm"
        style={{ marginTop: space.md }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonList: {
    gap: space.itemGap,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    borderColor: colors.urgentBorder,
    backgroundColor: colors.urgentSoft,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  errorIconCircle: {
    backgroundColor: colors.white,
  },
  stateTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateDesc: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.xs,
  },
});
