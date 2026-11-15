import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  Camera,
  Copy,
  CheckCircle2,
  Lock,
  MessageSquare,
  Bell,
  ChevronRight,
  LogOut,
  Info,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store';
import { useAuthActions } from '@/features/useCampusData';

// Profil
export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const { avatarMutation, logoutMutation } = useAuthActions();

  const initials = (user?.name || 'Rina Salsabila')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleCopyNimNip = async () => {
    const val = user?.nimNip || '22053181';
    try {
      await Clipboard.setStringAsync(val);
    } catch {
      // ignore
    }
    showToast(`${user?.role === 'dosen' ? 'NIP' : 'NIM'} disalin ke clipboard`);
  };

  const handleChangePhoto = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        await avatarMutation.mutateAsync(res.assets[0].uri);
      }
    } catch {
      showToast('Gagal memilih foto');
    }
  };

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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={space.iconLg} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typography.titleMd, { color: colors.textPrimary }]}>
          Profil {user?.role === 'dosen' ? 'Dosen' : 'Mahasiswa'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Kartu Identitas */}
        <View style={styles.identityCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={[typography.displayHero, { color: colors.white }]}>
                {initials}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ganti foto profil"
              onPress={handleChangePhoto}
              style={styles.cameraBtn}
            >
              <Camera size={16} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.nameRow}>
            <Text style={[typography.headlineMd, { color: colors.textPrimary }]}>
              {user?.name || 'Rina Salsabila'}
            </Text>
            <CheckCircle2 size={18} color={colors.secondary} />
          </View>

          <View style={styles.statusChipRow}>
            <View style={styles.activeChip}>
              <Text style={[typography.labelSm, { color: colors.successText }]}>
                ● AKTIF KULIAH
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salin NIM atau NIP"
            onPress={handleCopyNimNip}
            style={styles.nimBox}
          >
            <Text style={[typography.labelMd, { color: colors.textPrimary }]}>
              {user?.role === 'dosen' ? 'NIP' : 'NIM'}: {user?.nimNip || '22053181'}
            </Text>
            <Copy size={15} color={colors.primary} style={{ marginLeft: space.xs }} />
          </Pressable>

          <Text style={[typography.titleSm, { color: colors.textPrimary, marginTop: space.md }]}>
            {user?.prodi || 'S1 Teknik Informatika'}
          </Text>
          <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
            {user?.faculty || 'Fakultas Ilmu Komputer'}
          </Text>
          {user?.role !== 'dosen' ? (
            <Text style={[typography.bodySm, { color: colors.textMuted, marginTop: 2 }]}>
              Semester {user?.semester || 5} (Ganjil 2026/2027) · Angkatan {user?.cohortYear || 2024}
            </Text>
          ) : null}
        </View>

        {/* Kelas Kuliah & Dosen Wali */}
        <View style={styles.sectionBlock}>
          <Text style={[typography.headlineSm, { color: colors.textPrimary, marginBottom: space.sm }]}>
            Akademik & Perwalian
          </Text>
          <View style={styles.perwalianCard}>
            <View style={styles.classRow}>
              <View>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Kelas Perkuliahan
                </Text>
                <Text style={[typography.headlineSm, { color: colors.textPrimary, marginTop: 2 }]}>
                  {user?.className || 'TI-3A'}
                </Text>
              </View>
              <View style={styles.regulerBadge}>
                <Text style={[typography.labelSm, { color: colors.primary }]}>
                  Reguler Pagi
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.dpaRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Dosen Pembimbing Akademik (DPA)
                </Text>
                <Text style={[typography.titleSm, { color: colors.textPrimary, marginTop: 2 }]}>
                  {user?.homeroomLecturerName || 'Dr. Bambang Sutrisno, M.Kom.'}
                </Text>
              </View>
              <Button
                title="Hubungi Dosen"
                variant="secondary"
                size="sm"
                icon={<MessageSquare size={15} color={colors.primary} />}
                onPress={() =>
                  router.push('/chat/66666666-6666-6666-6666-666666666601' as never)
                }
              />
            </View>
          </View>
        </View>

        {/* Data Pribadi Read-Only */}
        <View style={styles.sectionBlock}>
          <View style={styles.readonlyHeader}>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Data Pribadi
            </Text>
            <View style={styles.lockRow}>
              <Lock size={13} color={colors.textMuted} />
              <Text style={[typography.bodySm, { color: colors.textMuted, marginLeft: 4 }]}>
                Read-only
              </Text>
            </View>
          </View>

          <View style={styles.readonlyCard}>
            <View style={styles.readonlyItem}>
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                Email Kampus
              </Text>
              <Text style={[typography.titleSm, { color: colors.textPrimary, marginTop: 2 }]}>
                {user?.email || 'rina.salsabila@student.kampus.ac.id'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.readonlyItem}>
              <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                Nomor Telepon / WhatsApp
              </Text>
              <Text style={[typography.titleSm, { color: colors.textPrimary, marginTop: 2 }]}>
                {user?.phone || '+62 812-3456-7890'}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/support/new' as never)}
            style={styles.infoBanner}
          >
            <Info size={18} color={colors.primary} />
            <Text
              style={[
                typography.bodySm,
                { color: colors.textSecondary, marginLeft: space.sm, flex: 1 },
              ]}
            >
              Perubahan data pokok dilakukan melalui loket BAAK atau{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                Layanan Bantuan & Pengaduan
              </Text>
              .
            </Text>
          </Pressable>
        </View>

        {/* Pengaturan Notifikasi & Jam Tenang */}
        <View style={styles.sectionBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pengaturan Notifikasi dan Jam Tenang"
            onPress={() => router.push('/settings/notifications' as never)}
            style={styles.prefCard}
          >
            <View style={styles.prefIcon}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                Pengaturan Notifikasi & Jam Tenang
              </Text>
              <Text style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}>
                Atur kategori pengingat kuliah, tugas & UKT
              </Text>
            </View>
            <ChevronRight size={18} color={colors.iconMuted} />
          </Pressable>
        </View>

        <Button
          title="Keluar dari Akun E-Campuz"
          variant="outlineDanger"
          icon={<LogOut size={18} color={colors.urgentText} />}
          onPress={handleLogout}
          style={{ marginTop: space.xl }}
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
    paddingBottom: space.huge,
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    alignItems: 'center',
    ...elevation.level1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: space.md,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  statusChipRow: {
    flexDirection: 'row',
    marginTop: space.xs,
  },
  activeChip: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  nimBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.input,
    marginTop: space.md,
  },
  sectionBlock: {
    marginTop: space.sectionGap,
  },
  perwalianCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regulerBadge: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.md,
  },
  dpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  readonlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readonlyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  readonlyItem: {
    paddingVertical: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.sm,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  prefIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
