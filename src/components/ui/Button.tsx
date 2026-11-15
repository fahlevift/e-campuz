import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, radius, space } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outlineDanger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'md' | 'sm';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  rightIcon,
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        variant === 'primary' && styles.primary,
        variant === 'primary' && pressed && !isDisabled && styles.primaryPressed,
        variant === 'secondary' && styles.secondary,
        variant === 'secondary' && pressed && !isDisabled && styles.secondaryPressed,
        variant === 'ghost' && styles.ghost,
        variant === 'ghost' && pressed && !isDisabled && styles.ghostPressed,
        variant === 'danger' && styles.danger,
        variant === 'outlineDanger' && styles.outlineDanger,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text
            style={[
              size === 'sm' ? typography.labelMd : typography.titleSm,
              variant === 'primary' && styles.textPrimaryVariant,
              variant === 'secondary' && styles.textSecondaryVariant,
              variant === 'ghost' && styles.textGhostVariant,
              variant === 'danger' && styles.textPrimaryVariant,
              variant === 'outlineDanger' && styles.textOutlineDanger,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: space.lg,
  },
  sizeMd: {
    minHeight: space.controlHeight,
    paddingVertical: space.md,
  },
  sizeSm: {
    minHeight: space.minTap,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: space.sm,
  },
  iconRight: {
    marginLeft: space.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.tintSoft,
  },
  secondaryPressed: {
    backgroundColor: colors.tintStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  danger: {
    backgroundColor: colors.urgent,
  },
  outlineDanger: {
    backgroundColor: colors.urgentSoft,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimaryVariant: {
    color: colors.white,
  },
  textSecondaryVariant: {
    color: colors.primary,
  },
  textGhostVariant: {
    color: colors.textSecondary,
  },
  textOutlineDanger: {
    color: colors.urgentText,
  },
});
