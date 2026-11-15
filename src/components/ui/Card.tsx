import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, space, elevation } from '@/theme';

export type CardVariant = 'default' | 'urgent' | 'warning' | 'muted' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  accessibilityLabel,
}) => {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'default' ? styles.defaultVariant : {},
    variant === 'elevated' ? styles.elevatedVariant : {},
    variant === 'urgent' ? styles.urgentVariant : {},
    variant === 'warning' ? styles.warningVariant : {},
    variant === 'muted' ? styles.mutedVariant : {},
    style || {},
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    padding: space.lg,
    backgroundColor: colors.surface,
  },
  defaultVariant: {
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.level1,
  },
  elevatedVariant: {
    borderWidth: 1,
    borderColor: colors.tintStrong,
    ...elevation.level2,
  },
  urgentVariant: {
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.urgent,
    backgroundColor: colors.surface,
  },
  warningVariant: {
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderLeftWidth: space.priorityStripe,
    borderLeftColor: colors.warning,
    backgroundColor: colors.surface,
  },
  mutedVariant: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.92,
  },
});
