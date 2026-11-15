import { Platform, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  primary: '#1E40AF',
  primaryPressed: '#1D4ED8',
  secondary: '#2563EB',
  tertiary: '#0D9488',
  tintSoft: '#EFF6FF',
  tintStrong: '#DBEAFE',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  iconMuted: '#64748B',
  urgent: '#EF4444',
  urgentText: '#DC2626',
  urgentSoft: '#FEF2F2',
  urgentBorder: '#FCA5A5',
  warning: '#F59E0B',
  warningText: '#D97706',
  warningSoft: '#FFFBEB',
  warningBorder: '#FCD34D',
  success: '#10B981',
  successText: '#059669',
  successSoft: '#ECFDF5',
  successBorder: '#6EE7B7',
  unreadDot: '#3B82F6',
  chatCategory: '#7C3AED',
  chatCategorySoft: '#F5F3FF',
  tertiarySoft: '#F0FDFA',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  navbarBg: 'rgba(255, 255, 255, 0.94)',
} as const;

export const notifCategoryColors = {
  SCHEDULE: { icon: colors.primary, bg: colors.tintSoft },
  SCHEDULE_URGENT: { icon: colors.urgent, bg: colors.urgentSoft },
  ASSIGNMENT: { icon: colors.warning, bg: colors.warningSoft },
  FINANCE: { icon: colors.warningText, bg: colors.warningSoft },
  LEARNING: { icon: colors.primary, bg: colors.tintSoft },
  CHAT: { icon: colors.chatCategory, bg: colors.chatCategorySoft },
  SUPPORT: { icon: colors.tertiary, bg: colors.tertiarySoft },
  ANNOUNCEMENT: { icon: colors.textSecondary, bg: colors.surfaceMuted },
} as const;

export const fonts = {
  jakartaRegular: 'PlusJakartaSans_400Regular',
  jakartaMedium: 'PlusJakartaSans_500Medium',
  jakartaSemiBold: 'PlusJakartaSans_600SemiBold',
  jakartaBold: 'PlusJakartaSans_700Bold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
} as const;

export const typography: Record<string, TextStyle> = {
  displayHero: {
    fontFamily: fonts.jakartaBold,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
  },
  headlineLg: {
    fontFamily: fonts.jakartaBold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  headlineMd: {
    fontFamily: fonts.jakartaSemiBold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  headlineSm: {
    fontFamily: fonts.jakartaSemiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  titleMd: {
    fontFamily: fonts.jakartaSemiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  titleSm: {
    fontFamily: fonts.jakartaSemiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  titleSmUnread: {
    fontFamily: fonts.jakartaBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  bodyLg: {
    fontFamily: fonts.interRegular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMd: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySm: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  labelMd: {
    fontFamily: fonts.jakartaSemiBold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  labelSm: {
    fontFamily: fonts.jakartaBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  labelBadge: {
    fontFamily: fonts.jakartaBold,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  codeVa: {
    fontFamily: fonts.interBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 1.44,
  },
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  screenMargin: 16,
  sectionGap: 24,
  itemGap: 12,
  quickAccessGutter: 12,
  controlHeight: 48,
  minTap: 44,
  navbarHeight: 56,
  priorityStripe: 4,
  unreadDotSize: 8,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  input: 10,
  card: 16,
  sheet: 24,
  full: 999,
} as const;

export const elevation: Record<'level0' | 'level1' | 'level2' | 'level3' | 'level4', ViewStyle> = {
  level0: {},
  level1: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }) as ViewStyle,
  level2: Platform.select({
    ios: {
      shadowColor: '#1E40AF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }) as ViewStyle,
  level3: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  level4: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }) as ViewStyle,
};

export const theme = {
  colors,
  notifCategoryColors,
  fonts,
  typography,
  space,
  radius,
  elevation,
};

export default theme;
