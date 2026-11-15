import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';
import { useBillDetailData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import {
  Card,
  EmptyState,
  ErrorState,
  SectionSkeleton,
  StatusChip,
  StatusKind,
} from '@/components/ui';
import { Bill } from '@/types';
import {
  formatDateIdLong,
  formatRemainingTime,
  formatRupiah,
} from '@/utils/format';

function mapBillStatusToKind(status: Bill['status']): StatusKind {
  switch (status) {
    case 'paid':
      return 'bill_paid';
    case 'overdue':
      return 'bill_overdue';
    case 'installment':
      return 'bill_installment';
    default:
      return 'bill_unpaid';
  }
}

function formatVaDisplay(va: string): string {
  return va.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export default function BillDetailScreen() {
  const { billId } = useLocalSearchParams<{ billId: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const billQuery = useBillDetailData(billId || '');

  const [selectedBank, setSelectedBank] = useState<'BNI' | 'Mandiri' | 'BRI'>('BNI');
  const [expandedMethod, setExpandedMethod] = useState<
    'mbanking' | 'atm' | 'ibanking' | null
  >('mbanking');

  const bill = billQuery.data;

  const components = useMemo(() => {
    if (bill?.components && bill.components.length > 0) {
      return bill.components;
    }
    return [
      { label: 'Sumbangan Pembinaan Pendidikan (SPP Tetap)', amount: 2500000 },
      { label: 'SPP Variabel (SKS Tatap Muka)', amount: 1500000 },
      { label: 'Iuran Praktikum & Lab Terpadu', amount: 350000 },
      { label: 'Asuransi & Pelayanan Kesehatan Mahasiswa', amount: 150000 },
      { label: 'Biaya Administrasi Bank', amount: 0 },
    ];
  }, [bill]);

  const handleCopyText = async (val: string, label: string) => {
    try {
      await Clipboard.setStringAsync(val);
    } catch {
      // fallback
    }
    showToast(`${label} berhasil disalin`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Tagihan UKT</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/support')}
          style={styles.iconBtn}
          accessibilityLabel="Bantuan Pembayaran"
        >
          <HelpCircle size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {billQuery.isLoading ? (
        <View style={styles.pad}>
          <SectionSkeleton count={4} />
        </View>
      ) : billQuery.isError ? (
        <View style={styles.pad}>
          <ErrorState
            message="Gagal memuat detail tagihan UKT."
            onRetry={() => billQuery.refetch()}
          />
        </View>
      ) : !bill ? (
        <View style={styles.pad}>
          <EmptyState
            title="Tagihan tidak ditemukan"
            description="Data rincian tagihan UKT ini tidak ditemukan di sistem."
          />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header Identitas Tagihan */}
            <Card style={styles.identityCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.semesterUpperLabel}>
                  {bill.semester.toUpperCase()}
                </Text>
                <Text style={styles.uktMainTitle}>Biaya Kuliah Tunggal (UKT)</Text>
                <Text style={styles.studentMeta}>
                  NIM: {user?.nimNip || '22051204001'} •{' '}
                  {user?.prodi || 'Teknik Informatika'}
                </Text>
              </View>
              <View style={styles.campusIconBox}>
                <Building2 size={22} color={colors.primary} />
              </View>
            </Card>

            {/* Kartu Status & Batas Akhir */}
            <Card
              style={[
                styles.statusCard,
                {
                  borderLeftWidth: 4,
                  borderLeftColor:
                    bill.status === 'paid' ? colors.success : colors.warning,
                },
              ]}
            >
              <View style={styles.statusTopRow}>
                <StatusChip status={mapBillStatusToKind(bill.status)} />
                {bill.status !== 'paid' ? (
                  <View style={styles.rowCenter}>
                    <Clock size={13} color={colors.warningText} />
                    <Text style={styles.countdownUpper}>
                      {formatRemainingTime(bill.dueDate).label.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.dueSubLabel}>
                {bill.status === 'paid'
                  ? 'Tanggal Pelunasan:'
                  : 'Batas Akhir Pembayaran:'}
              </Text>
              <Text style={styles.dueDateValue}>
                {formatDateIdLong(bill.paidAt || bill.dueDate)} •{' '}
                <Text style={{ color: colors.urgentText }}>23:59 WIB</Text>
              </Text>
            </Card>

            {/* Kartu Virtual Account & Nominal */}
            <Card style={styles.vaMainCard}>
              <View style={styles.vaTopHeader}>
                <View style={styles.rowCenter}>
                  <View style={styles.bankBadge}>
                    <Text style={styles.bankBadgeText}>{selectedBank}</Text>
                  </View>
                  <View>
                    <Text style={styles.vaBankTitle}>
                      Virtual Account {selectedBank}
                    </Text>
                    <Text style={styles.vaBankSub}>Metode Terpilih (Otomatis)</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldCaption}>Nomor Rekening Virtual Account</Text>
              <View style={styles.vaCopyBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vaCodeLarge}>
                    {formatVaDisplay(bill.vaNumber)}
                  </Text>
                  <Text style={styles.vaAccountHolder}>
                    Nama: E-CAMPUZ - {(user?.name || 'RINA SALSABILA').toUpperCase()}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    handleCopyText(bill.vaNumber, 'Nomor Virtual Account')
                  }
                  style={styles.copyActionBtn}
                >
                  <Copy size={14} color={colors.primary} />
                  <Text style={styles.copyActionText}>Salin</Text>
                </Pressable>
              </View>

              <View style={styles.nominalRow}>
                <View>
                  <Text style={styles.fieldCaption}>Total Nominal Tagihan</Text>
                  <Text style={styles.nominalLargeValue}>
                    {formatRupiah(bill.amount)}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    handleCopyText(String(bill.amount), 'Nominal pembayaran')
                  }
                  style={styles.copyActionBtn}
                >
                  <Copy size={14} color={colors.primary} />
                  <Text style={styles.copyActionText}>Salin Jumlah</Text>
                </Pressable>
              </View>

              <View style={styles.verifyHintBox}>
                <ShieldCheck size={16} color={colors.primary} />
                <Text style={styles.verifyHintText}>
                  Transfer sesuai nominal tepat hingga digit terakhir agar diverifikasi
                  otomatis oleh SIAKAD.
                </Text>
              </View>
            </Card>

            {/* Rincian Komponen Tagihan */}
            <Card style={styles.breakdownCard}>
              <View style={styles.breakdownHeaderRow}>
                <View style={styles.rowCenter}>
                  <FileText size={16} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Rincian Komponen Tagihan</Text>
                </View>
                <View style={styles.itemCountPill}>
                  <Text style={styles.itemCountPillText}>
                    {components.length} Item
                  </Text>
                </View>
              </View>

              <View style={styles.componentsList}>
                {components.map((comp, idx) => (
                  <View key={idx} style={styles.componentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compLabel}>{comp.label}</Text>
                      <Text style={styles.compSub}>
                        {comp.amount === 0
                          ? 'Subsidi Kampus Kerjasama Himbara'
                          : 'Komponen biaya akademik semester aktif'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.compAmount,
                        comp.amount === 0 && { color: colors.successText },
                      ]}
                    >
                      {comp.amount === 0 ? 'Rp0 (GRATIS)' : formatRupiah(comp.amount)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalFooterRow}>
                <Text style={styles.totalFooterLabel}>Total Pembayaran</Text>
                <Text style={styles.totalFooterValue}>
                  {formatRupiah(bill.amount)}
                </Text>
              </View>
            </Card>

            {/* Pilihan Bank & Metode Pembayaran */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pilihan Bank & Metode</Text>
              <Text style={styles.allMethodsLabel}>Semua Metode Resmi</Text>
            </View>

            <View style={styles.bankTabsRow}>
              {(['BNI', 'Mandiri', 'BRI'] as const).map((bank) => {
                const active = selectedBank === bank;
                return (
                  <Pressable
                    key={bank}
                    onPress={() => setSelectedBank(bank)}
                    style={[styles.bankTab, active && styles.bankTabActive]}
                  >
                    <Text
                      style={[
                        styles.bankTabText,
                        active && styles.bankTabTextActive,
                      ]}
                    >
                      {bank === 'BNI' ? 'BNI (Utama)' : `Bank ${bank}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Accordion Panduan Pembayaran */}
            <Card style={styles.guideAccordionCard}>
              {/* 1. Mobile Banking */}
              <Pressable
                onPress={() =>
                  setExpandedMethod((m) => (m === 'mbanking' ? null : 'mbanking'))
                }
                style={styles.accordionHeader}
              >
                <View style={styles.rowCenter}>
                  <Smartphone size={18} color={colors.primary} />
                  <Text style={styles.accordionTitle}>
                    {selectedBank} Mobile Banking
                  </Text>
                </View>
                {expandedMethod === 'mbanking' ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </Pressable>

              {expandedMethod === 'mbanking' ? (
                <View style={styles.stepsWrap}>
                  {[
                    {
                      t: `Buka dan Masuk ke Aplikasi ${selectedBank} Mobile Banking`,
                      d: 'Masukkan User ID dan MPIN Anda dengan aman.',
                    },
                    {
                      t: 'Pilih Menu Pembayaran > Biaya Pendidikan',
                      d: 'Pilih institusi jenis Perguruan Tinggi.',
                    },
                    {
                      t: 'Pilih Nama Kampus & Masukkan Nomor VA',
                      d: `Pilih E-CAMPUZ UNIVERSITAS dan tempel nomor ${bill.vaNumber}.`,
                    },
                    {
                      t: 'Verifikasi Data dan Tagihan',
                      d: `Pastikan nama penerima ${user?.name || 'Rina Salsabila'} dan nominal ${formatRupiah(bill.amount)} telah sesuai.`,
                    },
                    {
                      t: 'Konfirmasi & Simpan Bukti Transaksi',
                      d: 'Simpan struk digital sebagai bukti sah pembayaran.',
                    },
                  ].map((s, idx) => (
                    <View key={idx} style={styles.guideStepRow}>
                      <View style={styles.guideStepCircle}>
                        <Text style={styles.guideStepNum}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.guideStepTitle}>{s.t}</Text>
                        <Text style={styles.guideStepDesc}>{s.d}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.divider} />

              {/* 2. ATM */}
              <Pressable
                onPress={() =>
                  setExpandedMethod((m) => (m === 'atm' ? null : 'atm'))
                }
                style={styles.accordionHeader}
              >
                <View style={styles.rowCenter}>
                  <CreditCard size={18} color={colors.primary} />
                  <Text style={styles.accordionTitle}>ATM {selectedBank}</Text>
                </View>
                {expandedMethod === 'atm' ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </Pressable>

              {expandedMethod === 'atm' ? (
                <View style={styles.stepsWrap}>
                  {[
                    'Masukkan kartu ATM dan PIN Anda.',
                    'Pilih Menu Lain > Pembayaran > Universitas > Virtual Account Billing.',
                    `Masukkan nomor Virtual Account ${bill.vaNumber}.`,
                    `Periksa kesesuaian nama dan nominal ${formatRupiah(bill.amount)}, lalu tekan Ya.`,
                  ].map((stepText, idx) => (
                    <View key={idx} style={styles.guideStepRow}>
                      <View style={styles.guideStepCircle}>
                        <Text style={styles.guideStepNum}>{idx + 1}</Text>
                      </View>
                      <Text style={[styles.guideStepDesc, { flex: 1 }]}>
                        {stepText}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.divider} />

              {/* 3. Internet Banking */}
              <Pressable
                onPress={() =>
                  setExpandedMethod((m) => (m === 'ibanking' ? null : 'ibanking'))
                }
                style={styles.accordionHeader}
              >
                <View style={styles.rowCenter}>
                  <Laptop size={18} color={colors.primary} />
                  <Text style={styles.accordionTitle}>
                    {selectedBank} Internet Banking
                  </Text>
                </View>
                {expandedMethod === 'ibanking' ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </Pressable>

              {expandedMethod === 'ibanking' ? (
                <View style={styles.stepsWrap}>
                  {[
                    `Login ke portal ${selectedBank} Internet Banking.`,
                    'Pilih menu Transaksi > Pembelian / Pembayaran > Virtual Account.',
                    `Masukkan nomor VA ${bill.vaNumber} dan konfirmasi dengan token otentikasi.`,
                  ].map((stepText, idx) => (
                    <View key={idx} style={styles.guideStepRow}>
                      <View style={styles.guideStepCircle}>
                        <Text style={styles.guideStepNum}>{idx + 1}</Text>
                      </View>
                      <Text style={[styles.guideStepDesc, { flex: 1 }]}>
                        {stepText}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>

            {/* Kartu Mengalami Kendala Finansial */}
            <Card style={styles.financialReliefCard}>
              <View style={styles.reliefRow}>
                <View style={styles.reliefIconCircle}>
                  <HelpCircle size={20} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reliefTitle}>
                    Mengalami Kendala Finansial?
                  </Text>
                  <Text style={styles.reliefBody}>
                    Anda berhak mengajukan skema{' '}
                    <Text style={{ fontWeight: '700' }}>cicilan 2 termin</Text> atau
                    penundaan pembayaran sebelum masa KRS berakhir sesuai SK Rektor No.
                    412.
                  </Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/support/new',
                        params: {
                          category: 'Keuangan/UKT',
                          kind: 'bantuan',
                          title: `Permohonan Keringanan / Cicilan UKT ${bill.semester}`,
                        },
                      })
                    }
                    style={styles.reliefLinkRow}
                  >
                    <Text style={styles.reliefLinkText}>
                      Ajukan Keringanan / Cicilan UKT
                    </Text>
                    <ArrowRight size={15} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </Card>

            <Text style={styles.reconcileNote}>
              Rekonsiliasi otomatis SIAKAD dalam 15 menit setelah pembayaran berhasil.
            </Text>
          </ScrollView>

          {/* Bottom Bar: Cek Status + Unduh Invoice PDF */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => {
                billQuery.refetch();
                showToast('Status pembayaran terbaru telah diperiksa');
              }}
              style={styles.checkStatusBtn}
            >
              <RefreshCw size={16} color={colors.textPrimary} />
              <Text style={styles.checkStatusText}>Cek Status</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                showToast(`Mengunduh Invoice Resmi ${bill.semester} (PDF)...`)
              }
              style={styles.downloadInvoiceBtn}
            >
              <Download size={16} color={colors.white} />
              <Text style={styles.downloadInvoiceText}>Unduh Invoice PDF</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  pad: {
    padding: space.lg,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    backgroundColor: colors.tintSoft,
    borderColor: colors.tintStrong,
  },
  semesterUpperLabel: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  uktMainTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
    marginTop: 2,
  },
  studentMeta: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  campusIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    padding: space.md,
    gap: 6,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownUpper: {
    ...typography.labelBadge,
    color: colors.warningText,
  },
  dueSubLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dueDateValue: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  vaMainCard: {
    padding: space.md,
    gap: space.md,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
  },
  vaTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  bankBadgeText: {
    ...typography.labelSm,
    color: colors.white,
  },
  vaBankTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  vaBankSub: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  fieldCaption: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  vaCopyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginTop: -6,
  },
  vaCodeLarge: {
    ...typography.codeVa,
    color: colors.textPrimary,
  },
  vaAccountHolder: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  copyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.input,
  },
  copyActionText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  nominalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nominalLargeValue: {
    ...typography.headlineLg,
    color: colors.primary,
    marginTop: 2,
  },
  verifyHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.tintSoft,
    padding: space.sm + 2,
    borderRadius: radius.md,
  },
  verifyHintText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  breakdownCard: {
    padding: space.md,
    gap: space.md,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  itemCountPill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  itemCountPillText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  componentsList: {
    gap: space.sm,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  compLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  compSub: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 1,
  },
  compAmount: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  totalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalFooterLabel: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  totalFooterValue: {
    ...typography.headlineSm,
    color: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  allMethodsLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  bankTabsRow: {
    flexDirection: 'row',
    gap: space.xs,
  },
  bankTab: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bankTabText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  bankTabTextActive: {
    color: colors.white,
  },
  guideAccordionCard: {
    padding: space.md,
    gap: space.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accordionTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  stepsWrap: {
    gap: space.sm,
    paddingTop: space.xs,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  guideStepCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  guideStepNum: {
    ...typography.labelBadge,
    color: colors.white,
  },
  guideStepTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  guideStepDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  financialReliefCard: {
    padding: space.md,
    backgroundColor: colors.tintSoft,
    borderColor: colors.tintStrong,
  },
  reliefRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  reliefIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reliefTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  reliefBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reliefLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: space.sm,
  },
  reliefLinkText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  reconcileNote: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    height: 46,
  },
  checkStatusText: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  downloadInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    height: 46,
  },
  downloadInvoiceText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
});
