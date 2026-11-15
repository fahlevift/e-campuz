import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellOff,
  ChevronRight,
  FileText,
  Flag,
  FolderOpen,
  Info,
  Lock,
  Paperclip,
  Pin,
  Search,
  X,
} from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';
import { useChatRoomDetailData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import { Button, Card, EmptyState, ErrorState, SectionSkeleton } from '@/components/ui';
import { formatRelativeTime } from '@/utils/format';

export default function ChatRoomInfoScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const { roomQuery, messagesQuery, muteMutation, reportMutation } =
    useChatRoomDetailData(roomId || '');

  const [memberSearch, setMemberSearch] = useState('');
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Konten tidak relevan di room');

  const room = roomQuery.data;
  const messages = messagesQuery.data ?? [];

  const sharedFiles = useMemo(() => {
    const items: Array<{ name: string; sender: string; date: string }> = [];
    messages.forEach((m) => {
      (m.attachments || []).forEach((att) => {
        items.push({
          name: att,
          sender: m.senderName || 'Dosen',
          date: m.createdAt,
        });
      });
    });
    if (items.length === 0) {
      return [
        {
          name: 'Starter_Pack_State_Mgmt.zip',
          sender: 'Dr. Ir. Ahmad Fauzi, M.Kom.',
          date: new Date().toISOString(),
        },
        {
          name: 'Silabus_Modul_TI3A.pdf',
          sender: 'Dr. Ir. Ahmad Fauzi, M.Kom.',
          date: new Date().toISOString(),
        },
      ];
    }
    return items;
  }, [messages]);

  const allMembers = useMemo(() => {
    if (room?.members && room.members.length > 0) {
      return room.members;
    }
    return [
      {
        userId: '33333333-3333-3333-3333-333333333301',
        name: room?.lecturerName || 'Dr. Ir. Ahmad Fauzi, M.Kom.',
        nimNip: '198402122010121003',
        role: 'dosen' as const,
        isAdmin: true,
      },
      {
        userId: '22222222-2222-2222-2222-222222222202',
        name: 'Ahmad Fadil',
        nimNip: '22051204008',
        role: 'mahasiswa' as const,
        isClassLeader: true,
        isAdmin: true,
      },
      {
        userId: '22222222-2222-2222-2222-222222222201',
        name: 'Rina Salsabila',
        nimNip: '22051204001',
        role: 'mahasiswa' as const,
        isAdmin: false,
      },
      {
        userId: '22222222-2222-2222-2222-222222222203',
        name: 'Budi Santoso',
        nimNip: '22051204015',
        role: 'mahasiswa' as const,
        isAdmin: false,
      },
      {
        userId: '22222222-2222-2222-2222-222222222204',
        name: 'Siti Rahma',
        nimNip: '22051204022',
        role: 'mahasiswa' as const,
        isAdmin: false,
      },
    ];
  }, [room]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return allMembers;
    return allMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.nimNip.toLowerCase().includes(q),
    );
  }, [allMembers, memberSearch]);

  const adminMembers = useMemo(
    () => filteredMembers.filter((m) => m.role === 'dosen' || m.isClassLeader || m.isAdmin),
    [filteredMembers],
  );
  const studentMembers = useMemo(
    () =>
      filteredMembers.filter(
        (m) => m.role === 'mahasiswa' && !m.isClassLeader && !m.isAdmin,
      ),
    [filteredMembers],
  );

  const isMuted = Boolean(room?.mutedUntil);
  const muteStatusLabel = useMemo(() => {
    if (!room?.mutedUntil) return 'Notifikasi pesan aktif';
    if (room.mutedUntil === 'always' || room.mutedUntil.startsWith('2099')) {
      return 'Dibisukan selalu';
    }
    return `Dibisukan hingga ${formatRelativeTime(room.mutedUntil)}`;
  }, [room?.mutedUntil]);

  const getInitials = (text: string) =>
    text
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

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
        <Text style={styles.headerTitle}>Info Room</Text>
        <View style={{ width: 38 }} />
      </View>

      {roomQuery.isLoading ? (
        <View style={styles.pad}>
          <SectionSkeleton count={4} />
        </View>
      ) : roomQuery.isError || !room ? (
        <View style={styles.pad}>
          <ErrorState
            message="Gagal memuat informasi room."
            onRetry={() => roomQuery.refetch()}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Room Identity Card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>
                  {room.type === 'class' ? 'TI' : getInitials(room.name)}
                </Text>
              </View>
              <View style={styles.officialChip}>
                <BadgeCheck size={11} color={colors.white} />
                <Text style={styles.officialChipText}>Resmi</Text>
              </View>
            </View>

            <Text style={styles.roomName}>{room.name}</Text>

            <View style={styles.subtitleMetaRow}>
              <Text style={styles.subtitleText}>
                {room.type === 'class' ? 'Room Kelas Utama' : 'Mata Kuliah Semester 5'} •{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Kelas TI-3A
                </Text>
              </Text>
              {room.courseCode ? (
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{room.courseCode}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.descBox}>
              <Text style={styles.descText}>
                {room.description ||
                  'Ruang koordinasi resmi perkuliahan, pengumuman materi, tanya jawab tugas, dan diskusi akademik terstruktur.'}
              </Text>
            </View>

            {/* 3 Quick Action Buttons */}
            <View style={styles.quickActionRow}>
              <Pressable
                onPress={() => setMuteModalOpen(true)}
                style={styles.quickActionItem}
              >
                <View style={styles.quickActionCircle}>
                  {isMuted ? (
                    <BellOff size={20} color={colors.warningText} />
                  ) : (
                    <Bell size={20} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.quickActionLabel}>
                  {isMuted ? 'Dibisukan' : 'Bisukan'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                style={styles.quickActionItem}
              >
                <View style={styles.quickActionCircle}>
                  <Search size={20} color={colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Cari Pesan</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  showToast(`Menampilkan ${sharedFiles.length} berkas & media perkuliahan`)
                }
                style={styles.quickActionItem}
              >
                <View style={styles.quickActionCircle}>
                  <FolderOpen size={20} color={colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Media & File</Text>
              </Pressable>
            </View>
          </Card>

          {/* Pesan Tersemat */}
          {room.pinnedMessage ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.rowCenter}>
                  <Pin size={15} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Pesan Tersemat (1)</Text>
                </View>
                <View style={styles.importantPill}>
                  <Text style={styles.importantPillText}>PENTING</Text>
                </View>
              </View>

              <Card style={styles.pinnedCard}>
                <View style={styles.pinnedTopRow}>
                  <View style={styles.rowCenter}>
                    <View style={styles.blueDot} />
                    <Text style={styles.pinnedSender}>
                      {room.pinnedMessage.senderName || 'Dosen Pengampu'}
                    </Text>
                  </View>
                  <Text style={styles.pinnedTime}>
                    {formatRelativeTime(room.pinnedMessage.createdAt)}
                  </Text>
                </View>
                <Text style={styles.pinnedBody}>
                  {room.pinnedMessage.text || 'Lampiran pengumuman tersemat'}
                </Text>
                <View style={styles.pinnedFooterRow}>
                  <View style={styles.rowCenter}>
                    <Paperclip size={13} color={colors.textSecondary} />
                    <Text style={styles.pinnedAttachmentLabel}>Pengumuman Resmi</Text>
                  </View>
                  <Pressable
                    onPress={() => router.back()}
                    style={styles.rowCenter}
                  >
                    <Text style={styles.openInChatLink}>Buka di Chat</Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </Pressable>
                </View>
              </Card>
            </View>
          ) : null}

          {/* Media, Dokumen & Link */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Media, Dokumen & Link</Text>
                <Text style={styles.sectionSubtitle}>
                  Arsip perkuliahan bersama kelas ({sharedFiles.length})
                </Text>
              </View>
            </View>

            <View style={styles.filesGrid}>
              {sharedFiles.map((file, idx) => (
                <Pressable
                  key={`${file.name}-${idx}`}
                  onPress={() => showToast(`Mengunduh ${file.name}...`)}
                  style={styles.fileCardItem}
                >
                  <View style={styles.fileIconBox}>
                    <FileText size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileItemTitle} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileItemMeta} numberOfLines={1}>
                      {file.sender}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Pengaturan Notifikasi Room */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pengaturan Notifikasi Room</Text>

            <Pressable
              onPress={() => setMuteModalOpen(true)}
              style={styles.muteRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.muteTitle}>Bisukan Notifikasi</Text>
                <Text style={styles.muteSubtitle}>{muteStatusLabel}</Text>
              </View>
              <View
                style={[
                  styles.mutePillBtn,
                  isMuted && { backgroundColor: colors.warningSoft },
                ]}
              >
                <Text
                  style={[
                    styles.mutePillBtnText,
                    isMuted && { color: colors.warningText },
                  ]}
                >
                  {isMuted ? 'Ubah / Aktifkan' : 'Pilih Durasi'}
                </Text>
              </View>
            </Pressable>

            <View style={styles.mentionInfoBanner}>
              <Info size={16} color={colors.primary} />
              <Text style={styles.mentionInfoText}>
                Mention{' '}
                <Text style={{ fontWeight: '700', color: colors.primary }}>
                  @{user?.name.split(' ')[0] || 'Anda'}
                </Text>{' '}
                dan Pengumuman Penting tetap akan memicu notifikasi sesuai preferensi F-06
                meskipun room dibisukan.
              </Text>
            </View>
          </Card>

          {/* Daftar Anggota (Dikelompokkan Pengajar/Pengurus & Mahasiswa, tanpa ikon tambah kontak) */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.rowCenter}>
                <Text style={styles.sectionTitle}>Anggota</Text>
                <View style={styles.countChip}>
                  <Text style={styles.countChipText}>
                    {room.memberIds.length || 38}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.memberSearchBar}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Cari nama atau NIM/NIP anggota..."
                placeholderTextColor={colors.textMuted}
                style={styles.memberSearchInput}
              />
              {memberSearch ? (
                <Pressable onPress={() => setMemberSearch('')}>
                  <X size={15} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {filteredMembers.length === 0 ? (
              <EmptyState
                title="Anggota tidak ditemukan"
                description="Periksa kembali nama atau NIM/NIP yang dicari."
              />
            ) : (
              <>
                <Text style={styles.groupHeading}>PENGAJAR & PENGURUS KELAS</Text>
                {adminMembers.map((m) => (
                  <View key={m.userId} style={styles.memberRow}>
                    <View
                      style={[
                        styles.memberAvatar,
                        m.role === 'dosen' && { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.memberAvatarText}>
                        {getInitials(m.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberSub}>
                        {m.role === 'dosen' ? 'Dosen Pengampu' : 'Ketua Kelas TI-3A'} •{' '}
                        {m.nimNip}
                      </Text>
                    </View>
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>
                        {m.role === 'dosen' ? 'Admin / Dosen' : 'Admin Kelas'}
                      </Text>
                    </View>
                  </View>
                ))}

                <Text style={[styles.groupHeading, { marginTop: space.md }]}>
                  MAHASISWA TERDAFTAR
                </Text>
                {(showAllMembers ? studentMembers : studentMembers.slice(0, 3)).map(
                  (m) => {
                    const isSelf = m.userId === user?.id;
                    return (
                      <View
                        key={m.userId}
                        style={[styles.memberRow, isSelf && styles.memberRowSelf]}
                      >
                        <View
                          style={[
                            styles.memberAvatar,
                            isSelf && { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.memberAvatarText,
                              !isSelf && { color: colors.primary },
                            ]}
                          >
                            {getInitials(m.name)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.rowCenter}>
                            <Text style={styles.memberName}>{m.name}</Text>
                            {isSelf ? (
                              <View style={styles.selfBadge}>
                                <Text style={styles.selfBadgeText}>(Anda)</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.memberSub}>
                            Mahasiswa • {m.nimNip}
                          </Text>
                        </View>
                      </View>
                    );
                  },
                )}

                <Pressable
                  onPress={() => setShowAllMembers((v) => !v)}
                  style={styles.showMoreBtn}
                >
                  <Text style={styles.showMoreBtnText}>
                    {showAllMembers
                      ? 'Sembunyikan Sebagian Anggota'
                      : '+ Lihat 34 Anggota Lainnya'}
                  </Text>
                </Pressable>
              </>
            )}
          </Card>

          {/* Tindakan Room */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tindakan Room</Text>

            <Pressable
              onPress={() => setReportModalOpen(true)}
              style={styles.reportActionRow}
            >
              <View style={styles.reportIconCircle}>
                <Flag size={18} color={colors.urgent} />
              </View>
              <Text style={styles.reportActionText}>Laporkan Pesan / Room</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>

            <View style={styles.lockFooter}>
              <Lock size={15} color={colors.textMuted} />
              <Text style={styles.lockFooterText}>
                Mahasiswa tergabung otomatis melalui KRS semester aktif dan tidak dapat
                keluar dari room resmi perkuliahan.
              </Text>
            </View>
          </Card>
        </ScrollView>
      )}

      {/* Modal Pilih Durasi Bisukan (8 jam / 1 minggu / Selalu / Matikan) */}
      <Modal
        visible={muteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMuteModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bisukan Notifikasi Room</Text>
            <Text style={styles.modalSubtitle}>
              Pilih durasi bisukan untuk {room?.name}. Mention langsung dan pengumuman
              penting tetap akan memberi tahu Anda.
            </Text>

            {(
              [
                { key: '8h', label: 'Bisukan selama 8 jam' },
                { key: '1w', label: 'Bisukan selama 1 minggu' },
                { key: 'always', label: 'Bisukan selalu' },
                { key: 'off', label: 'Matikan bisukan (Aktifkan notifikasi)' },
              ] as const
            ).map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  muteMutation.mutate(opt.key);
                  setMuteModalOpen(false);
                }}
                style={styles.optionBtn}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    opt.key === 'off' && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}

            <Button
              title="Tutup"
              variant="ghost"
              onPress={() => setMuteModalOpen(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Laporkan Room */}
      <Modal
        visible={reportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Laporkan Pesan / Room</Text>
            <Text style={styles.modalSubtitle}>
              Laporan akan diteruskan ke moderator akademik program studi.
            </Text>

            {[
              'Konten tidak relevan di room',
              'Penyalahgunaan pengumuman kelas',
              'Pelanggaran etika komunikasi akademik',
            ].map((r) => (
              <Pressable
                key={r}
                onPress={() => setReportReason(r)}
                style={[
                  styles.optionBtn,
                  reportReason === r && {
                    borderColor: colors.primary,
                    backgroundColor: colors.tintSoft,
                  },
                ]}
              >
                <Text style={styles.optionBtnText}>{r}</Text>
              </Pressable>
            ))}

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => setReportModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Kirim Laporan"
                variant="danger"
                onPress={() => {
                  reportMutation.mutate({
                    messageId: room?.lastMessage?.id || 'room-report',
                    reason: reportReason,
                  });
                  setReportModalOpen(false);
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: space.huge,
    gap: space.md,
  },
  heroCard: {
    alignItems: 'center',
    padding: space.lg,
    gap: space.sm,
  },
  heroAvatarWrap: {
    alignItems: 'center',
    marginBottom: space.xs,
  },
  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    ...typography.headlineLg,
    color: colors.white,
  },
  officialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: -10,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  officialChipText: {
    ...typography.labelBadge,
    color: colors.white,
  },
  roomName: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.xs,
  },
  subtitleText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  codeBadge: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  codeBadgeText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  descBox: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space.xs,
  },
  descText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: space.sm,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  sectionBlock: {
    gap: space.xs,
  },
  sectionCard: {
    padding: space.md,
    gap: space.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  importantPill: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  importantPillText: {
    ...typography.labelBadge,
    color: colors.warningText,
  },
  pinnedCard: {
    padding: space.md,
    gap: space.xs,
  },
  pinnedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  pinnedSender: {
    ...typography.labelMd,
    color: colors.primary,
  },
  pinnedTime: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  pinnedBody: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  pinnedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pinnedAttachmentLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  openInChatLink: {
    ...typography.labelSm,
    color: colors.primary,
  },
  filesGrid: {
    gap: space.sm,
  },
  fileCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileItemTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  fileItemMeta: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  muteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  muteTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  muteSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mutePillBtn: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  mutePillBtnText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  mentionInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.tintStrong,
  },
  mentionInfoText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  countChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countChipText: {
    ...typography.labelBadge,
    color: colors.textSecondary,
  },
  memberSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    height: 40,
  },
  memberSearchInput: {
    flex: 1,
    ...typography.bodySm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  groupHeading: {
    ...typography.labelBadge,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
  },
  memberRowSelf: {
    backgroundColor: colors.bg,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    ...typography.labelMd,
    color: colors.white,
  },
  memberName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  memberSub: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  adminBadge: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  adminBadgeText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  selfBadge: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  selfBadgeText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  showMoreBtnText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  reportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.urgentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportActionText: {
    ...typography.labelMd,
    color: colors.urgentText,
    flex: 1,
  },
  lockFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.bg,
    padding: space.md,
    borderRadius: radius.md,
  },
  lockFooterText: {
    ...typography.bodySm,
    color: colors.textMuted,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: space.xs,
  },
  optionBtn: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  optionBtnText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
});
