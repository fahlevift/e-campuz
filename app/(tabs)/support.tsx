import React, { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  HelpCircle,
  Laptop,
  LucideIcon,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Phone,
  PlusCircle,
  Search,
  Ticket as TicketIcon,
  Wallet,
  X,
} from 'lucide-react-native';
import { colors, elevation, radius, space, typography } from '@/theme';
import { useSupportData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import {
  Card,
  EmptyState,
  ErrorState,
  SectionSkeleton,
  StatusChip,
  mapTicketStatusToKind,
} from '@/components/ui';
import { TicketCategory } from '@/types';
import { formatRelativeTime } from '@/utils/format';

const CATEGORIES: Array<{
  key: TicketCategory;
  label: string;
  icon: LucideIcon;
  tint: string;
  iconColor: string;
}> = [
  {
    key: 'Akademik & KRS',
    label: 'Akademik &\nKRS',
    icon: BookOpen,
    tint: colors.tintSoft,
    iconColor: colors.primary,
  },
  {
    key: 'Nilai',
    label: 'Nilai &\nTranskrip',
    icon: BarChart3,
    tint: colors.chatCategorySoft,
    iconColor: colors.chatCategory,
  },
  {
    key: 'Keuangan/UKT',
    label: 'Keuangan &\nUKT',
    icon: Wallet,
    tint: colors.successSoft,
    iconColor: colors.successText,
  },
  {
    key: 'Akun & IT',
    label: 'Akun & IT\nKampus',
    icon: Laptop,
    tint: colors.tertiarySoft,
    iconColor: colors.tertiary,
  },
  {
    key: 'Fasilitas',
    label: 'Fasilitas &\nLab',
    icon: Building2,
    tint: colors.warningSoft,
    iconColor: colors.warningText,
  },
  {
    key: 'Lainnya',
    label: 'Lainnya &\nAspirasi',
    icon: MessageSquarePlus,
    tint: colors.surfaceMuted,
    iconColor: colors.textSecondary,
  },
];

export default function SupportHomeScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const { faqsQuery, ticketsQuery } = useSupportData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active' | 'done'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [showAllTickets, setShowAllTickets] = useState(false);

  const faqs = faqsQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];

  const activeTicketCount = useMemo(
    () =>
      tickets.filter((t) =>
        ['submitted', 'in_progress', 'need_info'].includes(t.status),
      ).length,
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (ticketFilter === 'active') {
        return ['submitted', 'in_progress', 'need_info'].includes(t.status);
      }
      if (ticketFilter === 'done') {
        return ['resolved', 'closed'].includes(t.status);
      }
      return true;
    });
  }, [tickets, selectedCategory, ticketFilter]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter((f) => {
      if (selectedCategory && f.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        f.question.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    });
  }, [faqs, searchQuery, selectedCategory]);

  const visibleTickets = showAllTickets
    ? filteredTickets
    : filteredTickets.slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Layanan Bantuan</Text>
          <Text style={styles.headerSubtitle}>
            Pusat Bantuan & Pengaduan Akademik
          </Text>
        </View>
        <View style={styles.activePill}>
          <TicketIcon size={14} color={colors.primary} />
          <Text style={styles.activePillText}>{activeTicketCount} Aktif</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={faqsQuery.isRefetching || ticketsQuery.isRefetching}
            onRefresh={() => {
              faqsQuery.refetch();
              ticketsQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari topik bantuan, kendala, atau FAQ..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Hero Banner Portal Pengaduan BAAK */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.portalPill}>
                <Text style={styles.portalPillText}>PORTAL PENGADUAN BAAK</Text>
              </View>
              <Text style={styles.heroTitle}>Punya Masalah Akademik?</Text>
              <Text style={styles.heroSubtitle}>
                Sampaikan kendala KRS, nilai, UKT, atau fasilitas langsung ke petugas resmi.
              </Text>
            </View>
            <View style={styles.heroIconBox}>
              <HelpCircle size={26} color={colors.white} />
            </View>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/support/new',
                  params: selectedCategory ? { category: selectedCategory } : {},
                })
              }
              style={styles.createTicketBtn}
            >
              <PlusCircle size={18} color={colors.primary} />
              <Text style={styles.createTicketBtnText}>+ Buat Tiket Baru</Text>
            </Pressable>

            <Pressable
              onPress={() => showToast('Menghubungi Hotline BAAK (021-555-0192)...')}
              style={styles.hotlineBtn}
            >
              <Phone size={16} color={colors.white} />
              <Text style={styles.hotlineBtnText}>Hotline</Text>
            </Pressable>
          </View>
        </View>

        {/* Kategori Layanan (Grid 3x2) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Kategori Layanan</Text>
          {selectedCategory ? (
            <Pressable onPress={() => setSelectedCategory(null)}>
              <Text style={styles.resetFilterText}>Reset Filter ({selectedCategory})</Text>
            </Pressable>
          ) : (
            <View style={styles.bidangChip}>
              <Text style={styles.bidangChipText}>6 Bidang</Text>
            </View>
          )}
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() =>
                  setSelectedCategory((prev) => (prev === cat.key ? null : cat.key))
                }
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardActive,
                ]}
              >
                <View style={[styles.catIconBox, { backgroundColor: cat.tint }]}>
                  <IconComp size={22} color={cat.iconColor} />
                </View>
                <Text style={styles.catLabel}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tiket Pengaduan Saya */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.rowCenter}>
            <Text style={styles.sectionTitle}>Tiket Pengaduan Saya</Text>
            {activeTicketCount > 0 ? <View style={styles.blueDot} /> : null}
          </View>
          <Text style={styles.userSubLabel}>
            {user?.role === 'dosen' ? 'Dosen' : 'Mahasiswa'}: {user?.name || 'Tamu'}
          </Text>
        </View>

        {/* Filter Status Tiket */}
        <View style={styles.filterChipsRow}>
          {(
            [
              { key: 'all', label: `Semua (${tickets.length})` },
              { key: 'active', label: `Aktif (${activeTicketCount})` },
              {
                key: 'done',
                label: `Selesai (${tickets.length - activeTicketCount})`,
              },
            ] as const
          ).map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setTicketFilter(f.key)}
              style={[
                styles.filterChip,
                ticketFilter === f.key && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  ticketFilter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {ticketsQuery.isLoading ? (
          <SectionSkeleton count={2} />
        ) : ticketsQuery.isError ? (
          <ErrorState
            message="Gagal memuat daftar tiket bantuan."
            onRetry={() => ticketsQuery.refetch()}
          />
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            title="Belum ada tiket pada filter ini"
            description="Buat tiket baru jika Anda mengalami kendala akademik, pembayaran, atau fasilitas."
            actionLabel="+ Buat Tiket Baru"
            onAction={() => router.push('/support/new')}
          />
        ) : (
          <View style={styles.ticketList}>
            {visibleTickets.map((ticket) => {
              const latestHistory =
                ticket.history[ticket.history.length - 1] || ticket.history[0];
              const isNeedInfo = ticket.status === 'need_info';
              return (
                <Card
                  key={ticket.id}
                  onPress={() => router.push(`/support/ticket/${ticket.id}`)}
                  style={[
                    styles.ticketCard,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: isNeedInfo ? colors.primary : colors.warning,
                    },
                  ]}
                >
                  <View style={styles.ticketTopRow}>
                    <Text style={styles.ticketCode}>#{ticket.code}</Text>
                    <StatusChip status={mapTicketStatusToKind(ticket.status)} />
                  </View>

                  <Text style={styles.ticketTitle}>{ticket.title}</Text>

                  <View style={styles.ticketMetaRow}>
                    <View style={styles.catMiniPill}>
                      <Text style={styles.catMiniPillText}>
                        Kategori: {ticket.category}
                      </Text>
                    </View>
                    <Text style={styles.ticketTimeText}>
                      • {formatRelativeTime(ticket.createdAt)}
                    </Text>
                  </View>

                  {latestHistory?.note ? (
                    <View
                      style={[
                        styles.ticketNoteBox,
                        isNeedInfo && {
                          backgroundColor: colors.tintSoft,
                          borderColor: colors.tintStrong,
                        },
                      ]}
                    >
                      <Text style={styles.ticketNoteText} numberOfLines={2}>
                        <Text style={{ fontWeight: '700' }}>
                          {isNeedInfo ? 'Tindakan Mahasiswa: ' : 'Catatan: '}
                        </Text>
                        {latestHistory.note}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.ticketFooterRow}>
                    <Text style={styles.stageText}>
                      Tahap {Math.min(ticket.history.length, 4)} dari 4
                    </Text>
                    <View style={styles.rowCenter}>
                      <Text style={styles.detailLinkText}>
                        {isNeedInfo ? 'Unggah Berkas / Balas' : 'Detail Progres'}
                      </Text>
                      <ChevronRight size={15} color={colors.primary} />
                    </View>
                  </View>
                </Card>
              );
            })}

            {filteredTickets.length > 2 ? (
              <Pressable
                onPress={() => setShowAllTickets((v) => !v)}
                style={styles.allTicketsBtn}
              >
                <Text style={styles.allTicketsBtnText}>
                  {showAllTickets
                    ? 'Sembunyikan Sebagian Tiket'
                    : `Lihat Semua Riwayat Tiket (${filteredTickets.length}) →`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Pertanyaan Populer (FAQ) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pertanyaan Populer (FAQ)</Text>
          {selectedCategory ? (
            <Text style={styles.faqFilterIndicator}>{selectedCategory}</Text>
          ) : null}
        </View>

        {faqsQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : filteredFaqs.length === 0 ? (
          <EmptyState
            title="FAQ tidak ditemukan"
            description="Tidak ada artikel FAQ yang cocok dengan kata kunci pencarian Anda."
          />
        ) : (
          <View style={styles.faqList}>
            {filteredFaqs.map((faq) => {
              const expanded = expandedFaqId === faq.id;
              return (
                <Card key={faq.id} style={styles.faqCard}>
                  <Pressable
                    onPress={() =>
                      setExpandedFaqId((prev) => (prev === faq.id ? null : faq.id))
                    }
                    style={styles.faqHeaderRow}
                  >
                    <View style={styles.faqCategoryBadge}>
                      <Text style={styles.faqCategoryBadgeText}>{faq.category}</Text>
                    </View>
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    {expanded ? (
                      <ChevronUp size={18} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    )}
                  </Pressable>

                  {expanded ? (
                    <View style={styles.faqExpandedBody}>
                      <Text style={styles.faqSummaryText}>{faq.summary}</Text>
                      <Pressable
                        onPress={() => router.push(`/support/faq/${faq.id}`)}
                        style={styles.readFullFaqBtn}
                      >
                        <Text style={styles.readFullFaqText}>
                          Baca Panduan & Langkah Lengkap →
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        {/* Kontak BAAK & Helpdesk IT */}
        <Card style={styles.contactCard}>
          <View style={styles.contactTopRow}>
            <View style={styles.contactIconCircle}>
              <HelpCircle size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Kontak BAAK & Helpdesk IT</Text>
              <Text style={styles.contactSubtitle}>Pelayanan Terpadu Satu Pintu</Text>
            </View>
            <View style={styles.openStatusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.openStatusText}>Buka</Text>
            </View>
          </View>

          <View style={styles.hoursBox}>
            <Clock size={15} color={colors.textSecondary} />
            <Text style={styles.hoursText}>
              Operasional:{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                Senin - Jumat, 08.00 - 16.00 WIB
              </Text>
            </Text>
          </View>

          <View style={styles.contactBtnsRow}>
            <Pressable
              onPress={() => {
                Linking.openURL('https://wa.me/6281122334455').catch(() =>
                  showToast('Membuka WhatsApp BAAK...'),
                );
              }}
              style={styles.waBtn}
            >
              <MessageSquare size={16} color={colors.successText} />
              <Text style={styles.waBtnText}>WhatsApp BAAK</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Linking.openURL('mailto:helpdesk@ecampuz.ac.id').catch(() =>
                  showToast('Membuka aplikasi email ke helpdesk@ecampuz.ac.id'),
                );
              }}
              style={styles.emailBtn}
            >
              <Mail size={16} color={colors.primary} />
              <Text style={styles.emailBtnText}>Email Helpdesk</Text>
            </Pressable>
          </View>
        </Card>
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
  backBtn: {
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
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  activePillText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.huge,
    gap: space.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
    ...elevation.level2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  portalPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: space.xs,
  },
  portalPillText: {
    ...typography.labelBadge,
    color: colors.white,
  },
  heroTitle: {
    ...typography.headlineSm,
    color: colors.white,
  },
  heroSubtitle: {
    ...typography.bodySm,
    color: colors.tintStrong,
    marginTop: 4,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  createTicketBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    height: 44,
  },
  createTicketBtnText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  hotlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: space.md,
    borderRadius: radius.input,
    height: 44,
  },
  hotlineBtnText: {
    ...typography.labelMd,
    color: colors.white,
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
  resetFilterText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  bidangChip: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  bidangChipText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    gap: space.sm,
  },
  categoryCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.tintSoft,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    ...typography.labelSm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  userSubLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: space.xs,
  },
  filterChip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  ticketList: {
    gap: space.sm,
  },
  ticketCard: {
    padding: space.md,
    gap: space.sm,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketCode: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  ticketTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  catMiniPill: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  catMiniPillText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  ticketTimeText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  ticketNoteBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketNoteText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stageText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  detailLinkText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  allTicketsBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm + 2,
    alignItems: 'center',
  },
  allTicketsBtnText: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  faqFilterIndicator: {
    ...typography.labelSm,
    color: colors.primary,
  },
  faqList: {
    gap: space.sm,
  },
  faqCard: {
    padding: space.md,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  faqCategoryBadge: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  faqCategoryBadgeText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  faqQuestionText: {
    ...typography.labelMd,
    color: colors.textPrimary,
    flex: 1,
  },
  faqExpandedBody: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  faqSummaryText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  readFullFaqBtn: {
    alignSelf: 'flex-start',
  },
  readFullFaqText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  contactCard: {
    padding: space.md,
    gap: space.md,
    marginTop: space.xs,
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  contactSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  openStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  openStatusText: {
    ...typography.labelBadge,
    color: colors.successText,
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg,
    padding: space.sm,
    borderRadius: radius.md,
  },
  hoursText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  contactBtnsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.successSoft,
    paddingVertical: space.sm + 2,
    borderRadius: radius.input,
  },
  waBtnText: {
    ...typography.labelMd,
    color: colors.successText,
  },
  emailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.tintSoft,
    paddingVertical: space.sm + 2,
    borderRadius: radius.input,
  },
  emailBtnText: {
    ...typography.labelMd,
    color: colors.primary,
  },
});
