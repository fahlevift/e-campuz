import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  HelpCircle,
  History,
  Hourglass,
  Info,
  MessageSquare,
  Percent,
  Wallet,
} from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';
import { useBillsData, useNotificationsData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import {
  Badge,
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
  formatDateIdShort,
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

export default function FinanceScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const billsQuery = useBillsData();
  const { activeUnreadCount } = useNotificationsData();

  const [showFirstYear, setShowFirstYear] = useState(false);

  const bills = billsQuery.data ?? [];

  const activeBill = useMemo(
    () => bills.find((b) => b.status !== 'paid') ?? bills[0],
    [bills],
  );
  const paidBills = useMemo(
    () => bills.filter((b) => b.status === 'paid'),
    [bills],
  );

  const handleCopyVa = async (vaNumber: string) => {
    try {
      await Clipboard.setStringAsync(vaNumber);
    } catch {
      // clipboard fallback
    }
    showToast('Nomor Virtual Account berhasil disalin');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Keuangan & UKT</Text>
          <View style={styles.rowCenter}>
            <View style={styles.blueDot} />
            <Text style={styles.headerSubtitle}>Semester Gasal 2026/2027</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.iconBtn}
          accessibilityLabel="Buka Pusat Notifikasi"
        >
          <Bell size={20} color={colors.textPrimary} />
          {activeUnreadCount > 0 ? (
            <View style={styles.bellBadgeWrap}>
              <Badge count={activeUnreadCount} />
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={billsQuery.isRefetching}
            onRefresh={() => {
              void billsQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Identitas Mahasiswa */}
        <View style={styles.studentBar}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>RS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>
              {user?.name || 'Rina Salsabila'}
            </Text>
            <Text style={styles.studentSub}>
              NIM {user?.nimNip || '22051204001'} • {user?.prodi || 'Teknik Informatika'}
            </Text>
          </View>
          <View style={styles.regulerBadge}>
            <BadgeCheck size={13} color={colors.primary} />
            <Text style={styles.regulerBadgeText}>Reguler Aktif</Text>
          </View>
        </View>

        {billsQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : billsQuery.isError ? (
          <ErrorState
            message="Gagal memuat data tagihan UKT."
            onRetry={() => billsQuery.refetch()}
          />
        ) : !activeBill ? (
          <EmptyState
            title="Belum ada data tagihan"
            description="Tagihan UKT semester berjalan belum diterbitkan oleh BAAK."
          />
        ) : (
          <>
            {/* Banner Peringatan Akademik */}
            {activeBill.status !== 'paid' ? (
              <View style={styles.warningBanner}>
                <AlertCircle size={18} color={colors.urgentText} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowCenter}>
                    <Text style={styles.warningTitle}>PERINGATAN AKADEMIK</Text>
                    <View style={styles.redMiniDot} />
                  </View>
                  <Text style={styles.warningBody}>
                    Pelunasan UKT diperlukan sebelum{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {formatDateIdLong(activeBill.dueDate)}
                    </Text>{' '}
                    untuk validasi pengisian KRS Semester Genap dan akses ujian akhir.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Kartu Tagihan Aktif */}
            <Card style={styles.activeBillCard}>
              <View style={styles.billTopRow}>
                <View>
                  <Text style={styles.activeLabel}>TAGIHAN AKTIF</Text>
                  <Text style={styles.billTitle}>
                    Tagihan UKT {activeBill.semester}
                  </Text>
                </View>
                <StatusChip status={mapBillStatusToKind(activeBill.status)} />
              </View>

              <View style={styles.amountWrap}>
                <Text style={styles.totalLabel}>Total Pembayaran:</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.heroAmount}>
                    {formatRupiah(activeBill.amount)}
                  </Text>
                  <Text style={styles.perSemesterText}>/ semester</Text>
                </View>
              </View>

              {activeBill.status !== 'paid' ? (
                <View style={styles.duePill}>
                  <Hourglass size={14} color={colors.urgentText} />
                  <Text style={styles.duePillText}>
                    Jatuh Tempo: {formatDateIdShort(activeBill.dueDate)} (
                    {formatRemainingTime(activeBill.dueDate).label})
                  </Text>
                </View>
              ) : null}

              {/* Box Nomor Virtual Account */}
              <View style={styles.vaContainer}>
                <View style={styles.vaHeaderRow}>
                  <View style={styles.rowCenter}>
                    <View style={styles.bankLogoBox}>
                      <Text style={styles.bankLogoText}>
                        {activeBill.bankName || 'BNI'}
                      </Text>
                    </View>
                    <Text style={styles.vaTitleText}>Nomor Virtual Account</Text>
                  </View>
                  <View style={styles.rowCenter}>
                    <View style={styles.greenDot} />
                    <Text style={styles.autoVerifyText}>Otomatis Terverifikasi</Text>
                  </View>
                </View>

                <View style={styles.vaNumberBox}>
                  <Text style={styles.vaNumberText}>
                    {formatVaDisplay(activeBill.vaNumber)}
                  </Text>
                  <Pressable
                    onPress={() => handleCopyVa(activeBill.vaNumber)}
                    style={styles.copyBtn}
                  >
                    <Copy size={14} color={colors.primary} />
                    <Text style={styles.copyBtnText}>Salin</Text>
                  </Pressable>
                </View>

                <View style={styles.vaHintRow}>
                  <Info size={13} color={colors.textMuted} />
                  <Text style={styles.vaHintText}>
                    Dapat dibayar dari m-Banking BNI, ATM BNI, atau transfer antar
                    bank.
                  </Text>
                </View>
              </View>

              {/* Tombol Utama: Lihat Detail Tagihan */}
              <Pressable
                onPress={() => router.push(`/finance/${activeBill.id}`)}
                style={styles.detailPrimaryBtn}
              >
                <Text style={styles.detailPrimaryBtnText}>Lihat Detail Tagihan</Text>
                <ArrowRight size={17} color={colors.white} />
              </Pressable>

              {/* Tombol Ajukan Cicilan & Keringanan UKT */}
              <View style={styles.secondaryBtnsRow}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/support/new',
                      params: {
                        category: 'Keuangan/UKT',
                        kind: 'bantuan',
                        title: `Permohonan Pengajuan Cicilan UKT ${activeBill.semester}`,
                      },
                    })
                  }
                  style={styles.secondaryActionBtn}
                >
                  <FileText size={15} color={colors.primary} />
                  <Text style={styles.secondaryActionText}>Ajukan Cicilan</Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/support/new',
                      params: {
                        category: 'Keuangan/UKT',
                        kind: 'bantuan',
                        title: `Permohonan Keringanan UKT ${activeBill.semester}`,
                      },
                    })
                  }
                  style={styles.secondaryActionBtn}
                >
                  <HelpCircle size={15} color={colors.primary} />
                  <Text style={styles.secondaryActionText}>Keringanan UKT</Text>
                </Pressable>
              </View>
            </Card>

            {/* Rincian Komponen Biaya */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Rincian Komponen Biaya</Text>
              <Text style={styles.uktGroupLabel}>Kelompok UKT: 4 (Empat)</Text>
            </View>

            <View style={styles.summaryMiniRow}>
              <Card style={styles.summaryMiniCard}>
                <Wallet size={18} color={colors.primary} />
                <Text style={styles.summaryMiniLabel}>Total Biaya</Text>
                <Text style={styles.summaryMiniValue}>Rp4,5jt</Text>
              </Card>
              <Card style={styles.summaryMiniCard}>
                <BadgeCheck size={18} color={colors.success} />
                <Text style={styles.summaryMiniLabel}>Beasiswa</Text>
                <Text style={styles.summaryMiniValue}>Rp0</Text>
              </Card>
              <Card style={styles.summaryMiniCard}>
                <Percent size={18} color={colors.secondary} />
                <Text style={styles.summaryMiniLabel}>Potongan</Text>
                <Text style={styles.summaryMiniValue}>Rp0</Text>
              </Card>
            </View>

            {/* Riwayat Transaksi Pembayaran */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Riwayat Transaksi Pembayaran</Text>
                <Text style={styles.sectionSubtitle}>
                  Bukti resmi validasi BAAK Kampus
                </Text>
              </View>
            </View>

            <View style={styles.historyList}>
              {paidBills.map((item) => (
                <Card
                  key={item.id}
                  onPress={() => router.push(`/finance/${item.id}`)}
                  style={styles.historyCard}
                >
                  <View style={styles.historyTopRow}>
                    <Text style={styles.historySemesterTitle}>{item.semester}</Text>
                    <Text style={styles.historyAmount}>
                      {formatRupiah(item.amount)}
                    </Text>
                  </View>

                  <View style={styles.historyMidRow}>
                    <View style={styles.rowCenter}>
                      <StatusChip status="bill_paid" />
                      <Text style={styles.historyPaidDate}>
                        {formatDateIdShort(item.paidAt || item.dueDate)}
                      </Text>
                    </View>
                    <Text style={styles.historyViaText}>
                      via {item.bankName || 'BNI'} VA
                    </Text>
                  </View>

                  <View style={styles.historyFooterRow}>
                    <Text style={styles.invoiceCodeText}>
                      {item.invoiceCode || 'INV/2026/GNP/0912'}
                    </Text>
                    <Pressable
                      onPress={() =>
                        showToast(
                          `Mengunduh bukti lunas ${item.semester} (PDF)...`,
                        )
                      }
                      style={styles.downloadPdfBtn}
                    >
                      <Download size={13} color={colors.primary} />
                      <Text style={styles.downloadPdfText}>Unduh Bukti PDF</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}

              {/* Accordion Semester 1 & 2 */}
              <Pressable
                onPress={() => setShowFirstYear((v) => !v)}
                style={styles.firstYearAccordion}
              >
                <View style={styles.rowCenter}>
                  <History size={16} color={colors.textPrimary} />
                  <Text style={styles.firstYearText}>
                    Lihat Semester 1 & 2 (Tahun Pertama)
                  </Text>
                </View>
                {showFirstYear ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </Pressable>

              {showFirstYear ? (
                <Card style={styles.historyCard}>
                  <View style={styles.historyTopRow}>
                    <Text style={styles.historySemesterTitle}>
                      Semester 1 & 2 (TA 2024/2025)
                    </Text>
                    <Text style={styles.historyAmount}>Rp9.000.000</Text>
                  </View>
                  <View style={styles.historyMidRow}>
                    <StatusChip status="bill_paid" />
                    <Text style={styles.historyViaText}>2 Semester Terverifikasi</Text>
                  </View>
                </Card>
              ) : null}
            </View>

            {/* Kartu Bantuan Pembayaran */}
            <Card style={styles.helpFinanceCard}>
              <View style={styles.helpFinanceRow}>
                <View style={styles.helpIconCircle}>
                  <HelpCircle size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpFinanceTitle}>
                    Butuh Bantuan Pembayaran?
                  </Text>
                  <Text style={styles.helpFinanceBody}>
                    Ada kendala pembayaran atau verifikasi otomatis belum terupdate?
                    Hubungi unit layanan resmi.
                  </Text>
                  <View style={styles.helpBtnsWrap}>
                    <Pressable
                      onPress={() => router.push('/(tabs)/support')}
                      style={styles.loketPill}
                    >
                      <Building2 size={14} color={colors.primary} />
                      <Text style={styles.loketPillText}>Loket BAAK Gedung A</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        showToast('Membuka layanan WhatsApp Helpdesk Keuangan...')
                      }
                      style={styles.waPill}
                    >
                      <MessageSquare size={14} color={colors.successText} />
                      <Text style={styles.waPillText}>WhatsApp Helpdesk</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Card>

            {/* Tautan Cara Pembayaran */}
            <Pressable
              onPress={() => router.push(`/finance/${activeBill.id}`)}
              style={styles.guideBottomLink}
            >
              <HelpCircle size={15} color={colors.primary} />
              <Text style={styles.guideBottomLinkText}>
                Cara Pembayaran via ATM & Mobile Banking
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
    gap: space.sm,
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
    position: 'relative',
  },
  bellBadgeWrap: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.huge,
    gap: space.md,
  },
  studentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
  studentName: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  studentSub: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  regulerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  regulerBadgeText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.urgentSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.urgent,
  },
  warningTitle: {
    ...typography.labelSm,
    color: colors.urgentText,
  },
  redMiniDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.urgent,
  },
  warningBody: {
    ...typography.bodySm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  activeBillCard: {
    padding: space.lg,
    gap: space.md,
  },
  billTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  activeLabel: {
    ...typography.labelBadge,
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  billTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  amountWrap: {
    gap: 2,
  },
  totalLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroAmount: {
    ...typography.displayHero,
    color: colors.primary,
  },
  perSemesterText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.urgentSoft,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  duePillText: {
    ...typography.labelSm,
    color: colors.urgentText,
  },
  vaContainer: {
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  vaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankLogoBox: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  bankLogoText: {
    ...typography.labelBadge,
    color: colors.white,
  },
  vaTitleText: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  autoVerifyText: {
    ...typography.labelBadge,
    color: colors.successText,
  },
  vaNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  vaNumberText: {
    ...typography.codeVa,
    color: colors.textPrimary,
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  copyBtnText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  vaHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaHintText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  detailPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    height: 48,
  },
  detailPrimaryBtnText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
  secondaryBtnsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    borderRadius: radius.input,
    height: 42,
  },
  secondaryActionText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  uktGroupLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  summaryMiniRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  summaryMiniCard: {
    flex: 1,
    padding: space.md,
    gap: 4,
  },
  summaryMiniLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryMiniValue: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  historyList: {
    gap: space.sm,
  },
  historyCard: {
    padding: space.md,
    gap: space.sm,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historySemesterTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  historyAmount: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  historyMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyPaidDate: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  historyViaText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  historyFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  invoiceCodeText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  downloadPdfText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  firstYearAccordion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.md,
  },
  firstYearText: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  helpFinanceCard: {
    padding: space.md,
    backgroundColor: colors.tintSoft,
    borderColor: colors.tintStrong,
  },
  helpFinanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  helpIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpFinanceTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  helpFinanceBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  helpBtnsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  loketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.input,
  },
  loketPillText: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  waPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.input,
  },
  waPillText: {
    ...typography.labelSm,
    color: colors.successText,
  },
  guideBottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.xs,
  },
  guideBottomLinkText: {
    ...typography.labelSm,
    color: colors.primary,
  },
});
