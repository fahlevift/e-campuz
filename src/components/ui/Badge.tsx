import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, radius, space } from '@/theme';

interface BadgeProps {
  count?: number;
  dot?: boolean;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  count = 0,
  dot = false,
  color = colors.urgent,
  textColor = colors.white,
  style,
}) => {
  if (dot) {
    return (
      <View
        accessibilityLabel="Ada pembaruan belum dibaca"
        style={[styles.dot, { backgroundColor: color }, style]}
      />
    );
  }

  if (count <= 0) return null;

  const display = count > 99 ? '99+' : String(count);

  return (
    <View
      accessibilityLabel={`${display} belum dibaca`}
      style={[styles.badge, { backgroundColor: color }, style]}
    >
      <Text style={[typography.labelBadge, { color: textColor }]}>{display}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: space.unreadDotSize,
    height: space.unreadDotSize,
    borderRadius: radius.full,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    paddingHorizontal: space.xs + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
