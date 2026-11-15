import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Home,
  Calendar,
  BookOpen,
  MessageSquare,
  ClipboardList,
  Wallet,
  LifeBuoy,
  Bell,
  User as UserIcon,
  LayoutGrid,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { NavItemKey } from '@/types';
import { Badge } from './Badge';

export interface NavItemConfig {
  key: 'home' | NavItemKey | 'menu';
  label: string;
  route: string;
}

export const NAV_ITEM_META: Record<
  NavItemKey,
  { label: string; route: string; description: string }
> = {
  jadwal: {
    label: 'Jadwal',
    route: '/(tabs)/schedule',
    description: 'Jadwal kuliah mingguan & perubahan ruangan',
  },
  pembelajaran: {
    label: 'Pembelajaran',
    route: '/(tabs)/learning',
    description: 'Materi, tugas & diskusi mata kuliah',
  },
  chat: {
    label: 'Chat',
    route: '/(tabs)/chat',
    description: 'Room chat kelas & mata kuliah',
  },
  tugas: {
    label: 'Tugas',
    route: '/(tabs)/tasks',
    description: 'Daftar semua tugas & tenggat waktu',
  },
  keuangan: {
    label: 'Keuangan',
    route: '/(tabs)/finance',
    description: 'Tagihan UKT, nomor VA & riwayat bayar',
  },
  layanan: {
    label: 'Layanan',
    route: '/(tabs)/support',
    description: 'FAQ akademik & tiket pengaduan',
  },
  notifikasi: {
    label: 'Notifikasi',
    route: '/notifications',
    description: 'Pusat informasi & pengingat terkelompok',
  },
  profil: {
    label: 'Profil',
    route: '/profile',
    description: 'Data akademik & identitas kampus',
  },
};

export function renderNavIcon(
  key: 'home' | NavItemKey | 'menu',
  color: string,
  size: number = space.iconLg
) {
  switch (key) {
    case 'home':
      return <Home size={size} color={color} />;
    case 'jadwal':
      return <Calendar size={size} color={color} />;
    case 'pembelajaran':
      return <BookOpen size={size} color={color} />;
    case 'chat':
      return <MessageSquare size={size} color={color} />;
    case 'tugas':
      return <ClipboardList size={size} color={color} />;
    case 'keuangan':
      return <Wallet size={size} color={color} />;
    case 'layanan':
      return <LifeBuoy size={size} color={color} />;
    case 'notifikasi':
      return <Bell size={size} color={color} />;
    case 'profil':
      return <UserIcon size={size} color={color} />;
    case 'menu':
      return <LayoutGrid size={size} color={color} />;
  }
}

interface BottomNavProps {
  slots: [NavItemKey, NavItemKey, NavItemKey];
  activeKey: 'home' | NavItemKey | 'menu';
  badges?: Partial<Record<'home' | NavItemKey | 'menu', number>>;
  dots?: Partial<Record<'home' | NavItemKey | 'menu', boolean>>;
  onSelect: (key: 'home' | NavItemKey | 'menu', route: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  slots,
  activeKey,
  badges = {},
  dots = {},
  onSelect,
}) => {
  const fullItems: NavItemConfig[] = [
    { key: 'home', label: 'Beranda', route: '/(tabs)/home' },
    ...slots.map((k) => ({
      key: k,
      label: NAV_ITEM_META[k].label,
      route: NAV_ITEM_META[k].route,
    })),
    { key: 'menu', label: 'Menu', route: '/(tabs)/menu' },
  ];

  return (
    <View style={styles.container}>
      {fullItems.map((item) => {
        const isActive = activeKey === item.key;
        const badgeCount = badges[item.key] || 0;
        const hasDot = Boolean(dots[item.key]);
        const iconColor = isActive ? colors.primary : colors.iconMuted;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            onPress={() => onSelect(item.key, item.route)}
            style={styles.slot}
          >
            <View
              style={[
                styles.activeIndicator,
                isActive && { backgroundColor: colors.primary },
              ]}
            />
            <View style={styles.iconWrapper}>
              {renderNavIcon(item.key, iconColor, 22)}
              {badgeCount > 0 ? (
                <Badge count={badgeCount} style={styles.badgePos} />
              ) : hasDot ? (
                <Badge dot color={colors.unreadDot} style={styles.dotPos} />
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={[
                typography.labelSm,
                {
                  color: isActive ? colors.primary : colors.iconMuted,
                  fontWeight: isActive ? '700' : '600',
                  marginTop: 3,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: space.navbarHeight,
    backgroundColor: colors.navbarBg,
    paddingBottom: space.xs,
    ...elevation.level3,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: space.navbarHeight,
    paddingHorizontal: 2,
  },
  activeIndicator: {
    width: 24,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePos: {
    position: 'absolute',
    top: -6,
    right: -12,
  },
  dotPos: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
});
