import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  DoorOpen,
  ClipboardList,
  Wallet,
  Megaphone,
  ShieldCheck,
  ArrowRight,
  Clock,
} from 'lucide-react-native';
import { colors, typography, radius, space } from '@/theme';
import { Button, PriorityTag } from '@/components/ui';
import { useAuthActions } from '@/features/useCampusData';

// Izin Notifikasi
export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { completeNotifOnboarding } = useAuthActions();

  const handleComplete = async (allow: boolean) => {
    await completeNotifOnboarding(allow);
    router.replace('/(tabs)/home' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <View style={styles.stepPill}>
            <View style={styles.stepDot} />
            <Text style={[typography.labelSm, { color: colors.primary }]}>
              Langkah 1 dari 1: Pengaturan Awal
            </Text>
          </View>
          <Text style={[typography.titleMd, { color: colors.primary }]}>E-Campuz</Text>
        </View>

        {/* Ilustrasi Preview Kartu Mendesak & Penting */}
        <View style={styles.heroShowcase}>
          <View style={styles.bellCircleWrap}>
            <View style={styles.bellIconBox}>
              <Bell size={30} color={colors.white} />
              <View style={styles.bellRedDot} />
            </View>
          </View>

          <View style={styles.previewCardsRow}>
            <View style={styles.previewCard}>
              <View style={styles.previewCardTop}>
                <PriorityTag priority="urgent" />
                <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                  10m lalu
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[typography.titleSm, { color: colors.textPrimary, marginTop: 6 }]}
              >
                Pemrograman Web
              </Text>
              <View style={styles.deltaMiniRow}>
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.textMuted, textDecorationLine: 'line-through' },
                  ]}
                >
                  Lab 201
                </Text>
                <ArrowRight size={12} color={colors.iconMuted} style={{ marginHorizontal: 3 }} />
                <Text style={[typography.labelSm, { color: colors.primary }]}>
                  Auditorium 3
                </Text>
              </View>
            </View>

            <View style={styles.previewCard}>
              <View style={styles.previewCardTop}>
                <PriorityTag priority="high" />
                <Text style={[typography.bodySm, { color: colors.textMuted }]}>H-1</Text>
              </View>
              <Text
                numberOfLines={1}
                style={[typography.titleSm, { color: colors.textPrimary, marginTop: 6 }]}
              >
                Tugas Analisis Big Data
              </Text>
              <View style={styles.deltaMiniRow}>
                <Clock size={12} color={colors.warningText} />
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.textSecondary, marginLeft: 4 },
                  ]}
                >
                  Besok 23.59 WIB
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[typography.headlineLg, styles.mainHeading]}>
          Jangan Lewatkan Info Kuliah Penting!
        </Text>
        <Text style={[typography.bodyMd, styles.subHeading]}>
          E-Campuz mengirimkan pemberitahuan tepat waktu langsung ke ponsel Anda agar perkuliahan berjalan lancar.
        </Text>

        {/* 4 Manfaat dengan garis kiri berwarna */}
        <View style={styles.benefitsList}>
          <View style={[styles.benefitCard, { borderLeftColor: colors.urgent }]}>
            <View style={[styles.benefitIconBox, { backgroundColor: colors.urgentSoft }]}>
              <DoorOpen size={20} color={colors.urgent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.benefitTitleRow}>
                <Text style={[typography.titleSm, { color: colors.textPrimary, flex: 1 }]}>
                  Perubahan Ruangan & Jadwal
                </Text>
                <PriorityTag priority="urgent" />
              </View>
              <Text style={[typography.bodySm, styles.benefitDesc]}>
                Dapatkan kabar instan jika dosen memindahkan ruangan atau jam kuliah agar tidak salah gedung.
              </Text>
            </View>
          </View>

          <View style={[styles.benefitCard, { borderLeftColor: colors.warning }]}>
            <View style={[styles.benefitIconBox, { backgroundColor: colors.warningSoft }]}>
              <ClipboardList size={20} color={colors.warningText} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.benefitTitleRow}>
                <Text style={[typography.titleSm, { color: colors.textPrimary, flex: 1 }]}>
                  Pengingat Deadline Tugas
                </Text>
                <PriorityTag priority="high" />
              </View>
              <Text style={[typography.bodySm, styles.benefitDesc]}>
                Notifikasi berkala H-3, H-1, dan 6 jam sebelum tenggat tugas mata kuliah.
              </Text>
            </View>
          </View>

          <View style={[styles.benefitCard, { borderLeftColor: colors.secondary }]}>
            <View style={[styles.benefitIconBox, { backgroundColor: colors.tintSoft }]}>
              <Wallet size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                Jatuh Tempo Pembayaran UKT
              </Text>
              <Text style={[typography.bodySm, styles.benefitDesc]}>
                Pemberitahuan sebelum jatuh tempo agar tidak terkena denda atau KRS terkunci.
              </Text>
            </View>
          </View>

          <View style={[styles.benefitCard, { borderLeftColor: colors.primary }]}>
            <View style={[styles.benefitIconBox, { backgroundColor: colors.tintSoft }]}>
              <Megaphone size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                Pengumuman Dosen & Chat Kelas
              </Text>
              <Text style={[typography.bodySm, styles.benefitDesc]}>
                Pesan penting tersemat dan mention dari dosen wali atau ketua kelas.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoNoteBox}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={[typography.bodySm, { color: colors.textSecondary, marginLeft: space.sm, flex: 1 }]}>
            Notifikasi dapat Anda sesuaikan atau atur jam tenangnya kapan saja melalui menu Pengaturan.
          </Text>
        </View>

        <Button
          title="Izinkan Notifikasi"
          onPress={() => handleComplete(true)}
          icon={<Bell size={18} color={colors.white} />}
          style={{ marginTop: space.xl }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nanti Saja"
          onPress={() => handleComplete(false)}
          style={styles.skipBtn}
        >
          <Text style={[typography.labelMd, { color: colors.textSecondary }]}>
            Nanti Saja (Atur Manual)
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginRight: space.xs,
  },
  heroShowcase: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    padding: space.lg,
    alignItems: 'center',
  },
  bellCircleWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.tintStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  bellIconBox: {
    width: 60,
    height: 60,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellRedDot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.urgent,
    borderWidth: 2,
    borderColor: colors.white,
    position: 'absolute',
    top: -3,
    right: -3,
  },
  previewCardsRow: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
  },
  previewCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm + 2,
  },
  previewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deltaMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mainHeading: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: space.xl,
  },
  subHeading: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.xs,
  },
  benefitsList: {
    marginTop: space.xl,
    gap: space.itemGap,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: space.priorityStripe,
    padding: space.lg,
    gap: space.md,
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  benefitDesc: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginTop: space.lg,
  },
  skipBtn: {
    minHeight: space.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
});
