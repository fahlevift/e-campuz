import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Lightbulb,
  CheckCircle2,
  Eye,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { NAV_ITEM_META, renderNavIcon, Button } from '@/components/ui';
import { useNavPreferenceActions } from '@/features/useCampusData';
import { NavItemKey } from '@/types';

const ALL_NAV_KEYS: NavItemKey[] = [
  'jadwal',
  'pembelajaran',
  'chat',
  'tugas',
  'keuangan',
  'layanan',
  'notifikasi',
  'profil',
];

// Atur Navigasi
export default function NavigationSettingsScreen() {
  const router = useRouter();
  const { navSlots, updateSlots, resetToDefault } = useNavPreferenceActions();
  const [pendingAddKey, setPendingAddKey] = useState<NavItemKey | null>(null);

  const otherKeys = ALL_NAV_KEYS.filter((k) => !navSlots.includes(k));

  const moveSlot = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx > 2) return;
    const next = [...navSlots] as [NavItemKey, NavItemKey, NavItemKey];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    updateSlots(next);
  };

  const handleRemoveSlot = (keyToRemove: NavItemKey) => {
    const fallback = otherKeys[0];
    if (!fallback) return;
    const next = navSlots.map((k) => (k === keyToRemove ? fallback : k)) as [
      NavItemKey,
      NavItemKey,
      NavItemKey,
    ];
    updateSlots(next);
  };

  const handleReplaceSlot = (slotIndexToReplace: number) => {
    if (!pendingAddKey) return;
    const next = [...navSlots] as [NavItemKey, NavItemKey, NavItemKey];
    next[slotIndexToReplace] = pendingAddKey;
    updateSlots(next);
    setPendingAddKey(null);
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
        <Text style={[typography.titleMd, { color: colors.textPrimary, flex: 1 }]}>
          Atur Navigasi Bawah
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset Default"
          onPress={resetToDefault}
        >
          <Text style={[typography.labelMd, { color: colors.primary }]}>Reset Default</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            Pilih dan urutkan <Text style={{ fontWeight: '700', color: colors.textPrimary }}>3 menu favorit</Text> yang ingin Anda tampilkan pada bilah navigasi bawah. Slot{' '}
            <Text style={{ fontWeight: '700', color: colors.primary }}>Beranda</Text> dan{' '}
            <Text style={{ fontWeight: '700', color: colors.primary }}>Menu</Text> bersifat tetap.
          </Text>
        </View>

        {/* Pratinjau Bilah Bawah (Live Preview) */}
        <View style={styles.previewHeader}>
          <View style={styles.previewLabelRow}>
            <Eye size={16} color={colors.textPrimary} />
            <Text style={[typography.titleSm, { color: colors.textPrimary, marginLeft: 6 }]}>
              Pratinjau Bilah Bawah
            </Text>
          </View>
          <View style={styles.livePill}>
            <Text style={[typography.labelBadge, { color: colors.primary }]}>LIVE PREVIEW</Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text
            style={[
              typography.labelSm,
              { color: colors.textSecondary, textAlign: 'center', marginBottom: space.md },
            ]}
          >
            Simulasi Tampilan 5 Slot
          </Text>
          <View style={styles.previewSlotsRow}>
            {/* Slot 1 Tetap */}
            <View style={styles.previewSlotFixed}>
              <View style={styles.fixedBadge}>
                <Text style={[typography.labelBadge, { color: colors.white }]}>TETAP</Text>
              </View>
              {renderNavIcon('home', colors.iconMuted, 20)}
              <Text style={[typography.bodySm, { color: colors.textMuted, marginTop: 4 }]}>
                Beranda
              </Text>
            </View>

            {/* Slot 2-4 Pilihan */}
            {navSlots.map((slotKey, idx) => (
              <View key={slotKey} style={styles.previewSlotCustom}>
                <View style={styles.numberBadge}>
                  <Text style={[typography.labelBadge, { color: colors.white }]}>
                    {idx + 1}
                  </Text>
                </View>
                {renderNavIcon(slotKey, colors.primary, 20)}
                <Text
                  numberOfLines={1}
                  style={[typography.labelSm, { color: colors.primary, marginTop: 4 }]}
                >
                  {NAV_ITEM_META[slotKey].label}
                </Text>
              </View>
            ))}

            {/* Slot 5 Tetap */}
            <View style={styles.previewSlotFixed}>
              <View style={styles.fixedBadge}>
                <Text style={[typography.labelBadge, { color: colors.white }]}>TETAP</Text>
              </View>
              {renderNavIcon('menu', colors.iconMuted, 20)}
              <Text style={[typography.bodySm, { color: colors.textMuted, marginTop: 4 }]}>
                Menu
              </Text>
            </View>
          </View>
        </View>

        {/* Di Navbar Saat Ini */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Di Navbar Saat Ini
            </Text>
            <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
              Maksimal 3 menu pilihan aktif
            </Text>
          </View>
          <View style={styles.filledChip}>
            <Text style={[typography.labelSm, { color: colors.successText }]}>
              3 / 3 Terisi
            </Text>
          </View>
        </View>

        <View style={styles.itemsStack}>
          {navSlots.map((slotKey, index) => (
            <View key={slotKey} style={styles.activeSlotCard}>
              <GripVertical size={18} color={colors.iconMuted} />
              <View style={styles.slotIconBox}>
                {renderNavIcon(slotKey, colors.primary, 20)}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.slotTitleRow}>
                  <View style={styles.slotNumberPill}>
                    <Text style={[typography.labelBadge, { color: colors.white }]}>
                      Slot {index + 2}
                    </Text>
                  </View>
                  <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                    {NAV_ITEM_META[slotKey].label}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}
                >
                  {NAV_ITEM_META[slotKey].description}
                </Text>
              </View>

              <View style={styles.reorderActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Geser ${NAV_ITEM_META[slotKey].label} ke atas`}
                  disabled={index === 0}
                  onPress={() => moveSlot(index, -1)}
                  style={[styles.iconBtn, index === 0 && { opacity: 0.3 }]}
                >
                  <ArrowUp size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Geser ${NAV_ITEM_META[slotKey].label} ke bawah`}
                  disabled={index === 2}
                  onPress={() => moveSlot(index, 1)}
                  style={[styles.iconBtn, index === 2 && { opacity: 0.3 }]}
                >
                  <ArrowDown size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ganti ${NAV_ITEM_META[slotKey].label}`}
                  onPress={() => handleRemoveSlot(slotKey)}
                  style={styles.iconBtn}
                >
                  <X size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Menu Lainnya */}
        <View style={[styles.sectionHeaderRow, { marginTop: space.sectionGap }]}>
          <View>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Menu Lainnya
            </Text>
            <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
              Tersedia untuk menggantikan slot navigasi
            </Text>
          </View>
        </View>

        <View style={styles.itemsStack}>
          {otherKeys.map((itemKey) => (
            <View key={itemKey} style={styles.otherItemCard}>
              <View style={styles.slotIconBox}>
                {renderNavIcon(itemKey, colors.primary, 20)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  {NAV_ITEM_META[itemKey].label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[typography.bodySm, { color: colors.textSecondary, marginTop: 2 }]}
                >
                  {NAV_ITEM_META[itemKey].description}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tambah ${NAV_ITEM_META[itemKey].label} ke navbar`}
                onPress={() => setPendingAddKey(itemKey)}
                style={styles.addBtn}
              >
                <Plus size={15} color={colors.primary} />
                <Text style={[typography.labelMd, { color: colors.primary, marginLeft: 4 }]}>
                  Tambah
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Kotak Peringatan Kuning & Konfirmasi Tersimpan Otomatis */}
        <View style={styles.warningNoteCard}>
          <Lightbulb size={18} color={colors.warningText} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.warningText, marginLeft: space.sm, flex: 1 },
            ]}
          >
            Jika 3 slot navbar sudah terisi, menambahkan menu baru akan meminta Anda memilih menu mana yang ingin diganti.
          </Text>
        </View>

        <View style={styles.autoSaveBanner}>
          <CheckCircle2 size={18} color={colors.success} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.successText, marginLeft: space.sm, flex: 1 },
            ]}
          >
            Perubahan tersimpan otomatis & tersinkronisasi ke akun Anda tanpa perlu restart aplikasi.
          </Text>
        </View>

        <Button
          title="Selesai"
          onPress={() => router.back()}
          style={{ marginTop: space.lg }}
        />

        <Pressable
          accessibilityRole="button"
          onPress={resetToDefault}
          style={styles.resetFooterBtn}
        >
          <Text style={[typography.labelMd, { color: colors.textSecondary }]}>
            Kembalikan ke Default
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal Pilih Item yang Diganti */}
      <Modal
        visible={Boolean(pendingAddKey)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingAddKey(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={[typography.headlineSm, { color: colors.textPrimary }]}>
              Pilih Slot yang Ingin Diganti
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { color: colors.textSecondary, marginTop: space.xs },
              ]}
            >
              Navbar sudah penuh (3 menu). Pilih menu mana yang akan digantikan oleh{' '}
              <Text style={{ fontWeight: '700', color: colors.primary }}>
                {pendingAddKey ? NAV_ITEM_META[pendingAddKey].label : ''}
              </Text>
              :
            </Text>

            <View style={styles.modalOptions}>
              {navSlots.map((slotKey, idx) => (
                <Pressable
                  key={slotKey}
                  accessibilityRole="button"
                  onPress={() => handleReplaceSlot(idx)}
                  style={styles.modalOptionRow}
                >
                  <View style={styles.slotIconBox}>
                    {renderNavIcon(slotKey, colors.primary, 20)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                      Slot {idx + 2}: {NAV_ITEM_META[slotKey].label}
                    </Text>
                    <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                      Ketuk untuk mengganti dengan{' '}
                      {pendingAddKey ? NAV_ITEM_META[pendingAddKey].label : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Button
              title="Batal"
              variant="ghost"
              onPress={() => setPendingAddKey(null)}
              style={{ marginTop: space.md }}
            />
          </View>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.lg,
    paddingBottom: space.huge,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    padding: space.lg,
    ...elevation.level2,
  },
  previewSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  previewSlotFixed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    paddingVertical: space.sm + 2,
    paddingHorizontal: 2,
  },
  previewSlotCustom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.input,
    paddingVertical: space.sm + 2,
    paddingHorizontal: 2,
  },
  fixedBadge: {
    backgroundColor: colors.iconMuted,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginBottom: 4,
  },
  numberBadge: {
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.md,
  },
  filledChip: {
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  itemsStack: {
    gap: space.itemGap,
  },
  activeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    ...elevation.level1,
  },
  slotIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  slotNumberPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  reorderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.input,
  },
  warningNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radius.card,
    padding: space.md,
    marginTop: space.xl,
  },
  autoSaveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.card,
    padding: space.md,
    marginTop: space.md,
  },
  resetFooterBtn: {
    minHeight: space.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.screenMargin,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    padding: space.xl,
    ...elevation.level4,
  },
  modalOptions: {
    marginTop: space.lg,
    gap: space.sm,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.md,
  },
});
