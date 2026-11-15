import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Wallet,
  LifeBuoy,
  User as UserIcon,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { Badge, Button } from '@/components/ui';
import { useAppStore } from '@/store';
import {
  useNotificationsData,
  useChatRoomsData,
  useAssignmentsData,
  useBillsData,
  useSupportData,
  useAuthActions,
} from '@/features/useCampusData';

// Menu Semua Fitur
export default function MenuScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const { logoutMutation } = useAuthActions();
  const { activeUnreadCount } = useNotificationsData();
  const { totalUnreadChat } = useChatRoomsData();
  const { data: assignments } = useAssignmentsData();
  const { data: bills } = useBillsData();
  const { ticketsQuery } = useSupportData();

  const pendingTasks = (assignments || []).filter((a) => !a.submission).length;
  const activeBills = (bills || []).filter((b) => b.status !== 'paid').length;
  const openTickets = (ticketsQuery.data || []).filter((t) => t.status !== 'closed').length;

  const initials = (user?.name || 'Rina Salsabila')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const clearSession = useAppStore((s) => s.clearSession);

  const handleLogout = async () => {
    clearSession();
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore signOut network errors
    } finally {
      router.replace('/(auth)/login' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.miniAvatar}>
            <Text style={[typography.labelSm, { color: colors.white }]}>{initials}</Text>
          </View>
          <Text style={[typography.headlineMd, { color: colors.primary }]}>Semua Fitur</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka Pusat Notifikasi"
          onPress={() => router.push('/notifications' as never)}
          style={styles.bellHit}
        >
          <Bell size={space.iconLg} color={colors.textPrimary} />
          {activeUnreadCount > 0 ? (
            <Badge count={activeUnreadCount} style={styles.bellBadge} />
          ) : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Kartu Profil Ringkas */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka Profil"
          onPress={() => router.push('/profile' as never)}
          style={styles.profileCard}
        >
          <View style={styles.profileAvatar}>
            <Text style={[typography.headlineSm, { color: colors.white }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[typography.titleMd, { color: colors.textPrimary }]}>
                {user?.name || 'Rina Salsabila'}
              </Text>
              <View style={styles.activePill}>
                <Text style={[typography.labelBadge, { color: colors.primary }]}>
                  {user?.role === 'dosen' ? 'Dosen' : 'Aktif'}
                </Text>
              </View>
            </View>
            <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
              {user?.role === 'dosen' ? 'NIP' : 'NIM'} {user?.nimNip || '22053181'}
            </Text>
            <Text style={[typography.bodySm, { color: colors.textMuted }]}>
              {user?.prodi || 'S1 Teknik Informatika'}
              {user?.semester ? ` · Sem. ${user.semester}` : ''}
            </Text>
          </View>
          <View style={styles.profileLinkRow}>
            <Text style={[typography.labelMd, { color: colors.primary }]}>Profil</Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </Pressable>

        {/* Banner Biru Atur Navigasi Bawah */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atur Navigasi Bawah"
          onPress={() => router.push('/settings/navigation' as never)}
          style={styles.navBanner}
        >
          <View style={styles.navBannerPill}>
            <SlidersHorizontal size={12} color={colors.white} />
            <Text style={[typography.labelBadge, { color: colors.white, marginLeft: 4 }]}>
              KUSTOMISASI NAVBAR 5 SLOT
            </Text>
          </View>
          <Text style={[typography.headlineSm, { color: colors.white, marginTop: space.xs }]}>
            Atur Navigasi Bawah
          </Text>
          <Text style={[typography.bodySm, { color: colors.tintStrong, marginTop: 4 }]}>
            Sesuaikan 3 menu favorit Anda di bilah bawah agar kuliah makin cepat & ringkas.
          </Text>
          <View style={styles.navBannerFooter}>
            <Text style={[typography.labelMd, { color: colors.white }]}>
              Ketuk untuk atur tata letak
            </Text>
            <ChevronRight size={18} color={colors.white} />
          </View>
        </Pressable>

        {/* Grup 1: Akademik */}
        <View style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupBar, { backgroundColor: colors.primary }]} />
            <Text style={[typography.titleMd, { color: colors.textPrimary }]}>Akademik</Text>
          </View>

          <View style={styles.listCard}>
            <MenuListItem
              icon={<Calendar size={20} color={colors.primary} />}
              iconBg={colors.tintSoft}
              title="Jadwal"
              subtitle="Jadwal mingguan & perubahan ruangan"
              badgeText="Hari Ini"
              badgeBg={colors.successSoft}
              badgeColor={colors.successText}
              onPress={() => router.push('/(tabs)/schedule' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<BookOpen size={20} color={colors.primary} />}
              iconBg={colors.tintSoft}
              title="Pembelajaran"
              subtitle="Materi, tugas & diskusi"
              badgeText="Materi Baru"
              badgeBg={colors.tintSoft}
              badgeColor={colors.primary}
              onPress={() => router.push('/(tabs)/learning' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<ClipboardList size={20} color={colors.warningText} />}
              iconBg={colors.warningSoft}
              title="Tugas"
              subtitle="Daftar tugas & tenggat terdekat"
              badgeText={pendingTasks > 0 ? `${pendingTasks} Pending` : undefined}
              badgeBg={colors.warningSoft}
              badgeColor={colors.warningText}
              onPress={() => router.push('/(tabs)/tasks' as never)}
            />
          </View>
        </View>

        {/* Grup 2: Komunikasi (Chat, Notifikasi) */}
        <View style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupBar, { backgroundColor: colors.secondary }]} />
            <Text style={[typography.titleMd, { color: colors.textPrimary }]}>Komunikasi</Text>
          </View>

          <View style={styles.listCard}>
            <MenuListItem
              icon={<MessageSquare size={20} color={colors.primary} />}
              iconBg={colors.tintSoft}
              title="Chat"
              subtitle="Room chat kelas & mata kuliah"
              badgeText={totalUnreadChat > 0 ? `${totalUnreadChat} Baru` : undefined}
              badgeBg={colors.tintStrong}
              badgeColor={colors.primary}
              onPress={() => router.push('/(tabs)/chat' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<Bell size={20} color={colors.urgent} />}
              iconBg={colors.urgentSoft}
              title="Notifikasi"
              subtitle="Perubahan ruang & pengingat terkelompok"
              badgeText={activeUnreadCount > 0 ? `${activeUnreadCount} Baru` : undefined}
              badgeBg={colors.urgentSoft}
              badgeColor={colors.urgentText}
              onPress={() => router.push('/notifications' as never)}
            />
          </View>
        </View>

        {/* Grup 3: Administrasi (Keuangan, Layanan Bantuan) */}
        <View style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupBar, { backgroundColor: colors.warning }]} />
            <Text style={[typography.titleMd, { color: colors.textPrimary }]}>Administrasi</Text>
          </View>

          <View style={styles.listCard}>
            <MenuListItem
              icon={<Wallet size={20} color={colors.warningText} />}
              iconBg={colors.warningSoft}
              title="Keuangan"
              subtitle="Tagihan UKT, Virtual Account & riwayat bayar"
              badgeText={activeBills > 0 ? 'Tagihan Aktif' : 'Lunas'}
              badgeBg={activeBills > 0 ? colors.warningSoft : colors.successSoft}
              badgeColor={activeBills > 0 ? colors.warningText : colors.successText}
              onPress={() => router.push('/(tabs)/finance' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<LifeBuoy size={20} color={colors.tertiary} />}
              iconBg={colors.tertiarySoft}
              title="Layanan Bantuan"
              subtitle="FAQ akademik & tiket pengaduan"
              badgeText={openTickets > 0 ? `${openTickets} Tiket` : undefined}
              badgeBg={colors.tintSoft}
              badgeColor={colors.primary}
              onPress={() => router.push('/(tabs)/support' as never)}
            />
          </View>
        </View>

        {/* Grup 4: Akun (Profil, Atur Navigasi, Preferensi Notifikasi, Pengaturan, Keluar) */}
        <View style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupBar, { backgroundColor: colors.iconMuted }]} />
            <Text style={[typography.titleMd, { color: colors.textPrimary }]}>Akun</Text>
          </View>

          <View style={styles.listCard}>
            <MenuListItem
              icon={<UserIcon size={20} color={colors.textSecondary} />}
              iconBg={colors.surfaceMuted}
              title="Profil"
              subtitle="Identitas akademik & perwalian"
              onPress={() => router.push('/profile' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<SlidersHorizontal size={20} color={colors.white} />}
              iconBg={colors.primary}
              title="Atur Navigasi"
              subtitle="Ubah 3 slot favorit bilah bawah"
              badgeText="Kustom"
              badgeBg={colors.primary}
              badgeColor={colors.white}
              onPress={() => router.push('/settings/navigation' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<Bell size={20} color={colors.textSecondary} />}
              iconBg={colors.surfaceMuted}
              title="Preferensi Notifikasi"
              subtitle="Kategori push, pengingat & jam tenang"
              onPress={() => router.push('/settings/notifications' as never)}
            />
            <View style={styles.divider} />
            <MenuListItem
              icon={<Settings size={20} color={colors.textSecondary} />}
              iconBg={colors.surfaceMuted}
              title="Pengaturan"
              subtitle="Preferensi aplikasi & sinkronisasi offline"
              onPress={() => router.push('/settings' as never)}
            />
          </View>
        </View>

        <Button
          title="Keluar dari Akun"
          onPress={handleLogout}
          variant="outlineDanger"
          icon={<LogOut size={18} color={colors.urgentText} />}
          style={{ marginTop: space.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuListItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeBg?: string;
  badgeColor?: string;
  onPress: () => void;
}

const MenuListItem: React.FC<MenuListItemProps> = ({
  icon,
  iconBg,
  title,
  subtitle,
  badgeText,
  badgeBg,
  badgeColor,
  onPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    onPress={onPress}
    style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.85 }]}
  >
    <View style={[styles.menuIconBox, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={[typography.titleSm, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
        {subtitle}
      </Text>
    </View>
    {badgeText ? (
      <View style={[styles.menuBadge, { backgroundColor: badgeBg || colors.tintSoft }]}>
        <Text style={[typography.labelBadge, { color: badgeColor || colors.primary }]}>
          {badgeText}
        </Text>
      </View>
    ) : null}
    <ChevronRight size={18} color={colors.iconMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellHit: {
    width: space.minTap,
    height: space.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
    ...elevation.level1,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  activePill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  profileLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: space.lg,
    marginTop: space.lg,
    ...elevation.level2,
  },
  navBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  navBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  groupSection: {
    marginTop: space.sectionGap,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginBottom: space.sm,
  },
  groupBar: {
    width: 4,
    height: 18,
    borderRadius: radius.full,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 66,
  },
});
