import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  SlidersHorizontal,
  User as UserIcon,
  WifiOff,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import { ListItemSwitch, Button } from '@/components/ui';
import { useAppStore } from '@/store';
import { useAuthActions } from '@/features/useCampusData';

// Pengaturan
export default function SettingsScreen() {
  const router = useRouter();
  const isOffline = useAppStore((s) => s.isOffline);
  const setOffline = useAppStore((s) => s.setOffline);
  const showToast = useAppStore((s) => s.showToast);
  const clearSession = useAppStore((s) => s.clearSession);
  const { logoutMutation } = useAuthActions();

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

  const handleToggleOffline = (val: boolean) => {
    setOffline(val);
    showToast(val ? 'Mode simulasi offline diaktifkan' : 'Kembali online');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={space.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typography.titleMd, { color: colors.textPrimary }]}>Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[typography.labelSm, styles.sectionCaps]}>
          PREFERENSI UTAMA
        </Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings/notifications' as never)}
            style={styles.row}
          >
            <View style={styles.iconBox}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                Preferensi Notifikasi
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                Atur kategori aktif, pengingat kuliah/tugas & jam tenang
              </Text>
            </View>
            <ChevronRight size={18} color={colors.iconMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings/navigation' as never)}
            style={styles.row}
          >
            <View style={styles.iconBox}>
              <SlidersHorizontal size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                Atur Navigasi Bawah
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                Pilih & urutkan 3 menu prioritas di navbar
              </Text>
            </View>
            <ChevronRight size={18} color={colors.iconMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile' as never)}
            style={styles.row}
          >
            <View style={styles.iconBox}>
              <UserIcon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                Profil Akun
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                Lihat informasi akademik & ganti foto profil
              </Text>
            </View>
            <ChevronRight size={18} color={colors.iconMuted} />
          </Pressable>
        </View>

        <Text style={[typography.labelSm, styles.sectionCaps, { marginTop: space.xl }]}>
          KONEKSI & CACHE LOKAL
        </Text>
        <View style={[styles.card, { paddingHorizontal: space.lg }]}>
          <ListItemSwitch
            icon={<WifiOff size={20} color={colors.urgent} />}
            title="Simulasi Mode Offline"
            description="Tampilkan banner offline & gunakan cache jadwal/tugas/materi lokal"
            value={isOffline}
            onValueChange={handleToggleOffline}
          />
        </View>

        <Button
          title="Keluar dari Akun"
          variant="outlineDanger"
          icon={<LogOut size={18} color={colors.urgentText} />}
          onPress={handleLogout}
          style={{ marginTop: space.xxl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: space.minTap,
    height: space.minTap,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
  },
  sectionCaps: {
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    gap: space.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
});
