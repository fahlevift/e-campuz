import React, { useMemo, useState } from 'react';
import {
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
  BellOff,
  CheckCheck,
  ChevronRight,
  HelpCircle,
  Pin,
  Search,
  X,
} from 'lucide-react-native';
import { colors, elevation, radius, space, typography } from '@/theme';
import { useChatRoomsData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import { Badge, Card, EmptyState, ErrorState, SectionSkeleton } from '@/components/ui';
import { formatRelativeTime } from '@/utils/format';

export default function ChatListScreen() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const roomsQuery = useChatRoomsData();

  const [activeTab, setActiveTab] = useState<'class' | 'course'>('class');
  const [searchQuery, setSearchQuery] = useState('');

  const rooms = roomsQuery.data ?? [];

  const classRooms = useMemo(() => rooms.filter((r) => r.type === 'class'), [rooms]);
  const courseRooms = useMemo(() => rooms.filter((r) => r.type === 'course'), [rooms]);

  const classUnread = useMemo(
    () => classRooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0),
    [classRooms],
  );
  const courseUnread = useMemo(
    () => courseRooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0),
    [courseRooms],
  );

  const filteredRooms = useMemo(() => {
    const base = searchQuery.trim()
      ? rooms
      : activeTab === 'class'
        ? classRooms
        : courseRooms;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.lastMessage?.text || '').toLowerCase().includes(q) ||
        (r.lastMessage?.senderName || '').toLowerCase().includes(q),
    );
  }, [rooms, classRooms, courseRooms, activeTab, searchQuery]);

  const pinnedBannerRoom = useMemo(
    () => classRooms.find((r) => r.pinnedMessage) ?? rooms.find((r) => r.pinnedMessage),
    [classRooms, rooms],
  );

  const handleMarkAllRead = () => {
    roomsQuery.markAllRoomsReadMutation.mutate(undefined, {
      onSuccess: () => {
        showToast('Semua percakapan ditandai sudah dibaca');
      },
    });
  };

  const getInitials = (name: string, type: 'class' | 'course') => {
    if (type === 'class') return 'TI-3A';
    const words = name.split(' ').filter(Boolean);
    return words
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>TI</Text>
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Pesan & Diskusi</Text>
              {classUnread + courseUnread > 0 ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={styles.headerSubtitle}>Semester Ganjil 2026/2027</Text>
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={roomsQuery.isRefetching}
            onRefresh={() => {
              void roomsQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari obrolan kelas atau mata kuliah..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Segmented Control Kelas | Mata Kuliah */}
        <View style={styles.segmentedContainer}>
          <Pressable
            onPress={() => setActiveTab('class')}
            style={[styles.segmentBtn, activeTab === 'class' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'class' && styles.segmentTextActive,
              ]}
            >
              Kelas
            </Text>
            {classUnread > 0 ? <Badge count={classUnread} color={colors.primary} /> : null}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('course')}
            style={[styles.segmentBtn, activeTab === 'course' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'course' && styles.segmentTextActive,
              ]}
            >
              Mata Kuliah
            </Text>
            {courseUnread > 0 ? (
              <Badge
                count={courseUnread}
                color={activeTab === 'course' ? colors.primary : colors.textMuted}
              />
            ) : null}
          </Pressable>
        </View>

        {/* Banner Pengumuman Kelas Tersemat */}
        {pinnedBannerRoom?.pinnedMessage ? (
          <Pressable
            onPress={() => router.push(`/chat/${pinnedBannerRoom.id}`)}
            style={styles.pinnedBanner}
          >
            <View style={styles.pinnedIconWrap}>
              <Pin size={18} color={colors.warningText} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.pinnedHeaderRow}>
                <Text style={styles.pinnedLabel}>PENGUMUMAN KELAS TERSEMAT</Text>
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>Hari Ini</Text>
                </View>
              </View>
              <Text style={styles.pinnedContent} numberOfLines={2}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {pinnedBannerRoom.pinnedMessage.senderName || 'Dosen'}:{' '}
                </Text>
                {pinnedBannerRoom.pinnedMessage.text || 'Lampiran pengumuman'}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* Section Title + Mark All Read */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim()
              ? 'Hasil Pencarian'
              : activeTab === 'class'
                ? 'Room Kelas Utama'
                : `Room Mata Kuliah (${courseRooms.length})`}
          </Text>
          {classUnread + courseUnread > 0 ? (
            <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>Tandai sudah dibaca</Text>
              <CheckCheck size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {/* Room List States */}
        {roomsQuery.isLoading ? (
          <SectionSkeleton count={3} />
        ) : roomsQuery.isError ? (
          <ErrorState
            message="Gagal memuat daftar room chat."
            onRetry={() => roomsQuery.refetch()}
          />
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            title="Obrolan tidak ditemukan"
            description="Coba kata kunci lain atau periksa tab Kelas dan Mata Kuliah."
          />
        ) : (
          <View style={styles.roomList}>
            {filteredRooms.map((room) => {
              const isMuted = Boolean(room.mutedUntil);
              const unread = room.unreadCount || 0;
              return (
                <Card
                  key={room.id}
                  onPress={() => router.push(`/chat/${room.id}`)}
                  style={styles.roomCard}
                >
                  <View style={styles.roomRow}>
                    <View style={styles.roomAvatarWrap}>
                      <View
                        style={[
                          styles.roomAvatar,
                          room.type === 'course' && { backgroundColor: colors.secondary },
                        ]}
                      >
                        <Text style={styles.roomAvatarText}>
                          {getInitials(room.name, room.type)}
                        </Text>
                      </View>
                      {room.pinnedMessage ? (
                        <View style={styles.pinMiniBadge}>
                          <Pin size={10} color={colors.white} />
                        </View>
                      ) : null}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.roomTopRow}>
                        <Text style={styles.roomTitle} numberOfLines={1}>
                          {room.name}
                        </Text>
                        <View style={styles.roomMetaRight}>
                          {room.type === 'class' ? (
                            <View style={styles.mainClassChip}>
                              <Text style={styles.mainClassChipText}>KELAS UTAMA</Text>
                            </View>
                          ) : room.courseCode ? (
                            <View style={styles.courseCodeChip}>
                              <Text style={styles.courseCodeChipText}>
                                {room.courseCode}
                              </Text>
                            </View>
                          ) : null}
                          {isMuted ? (
                            <BellOff size={13} color={colors.textMuted} />
                          ) : null}
                          {room.lastMessage ? (
                            <Text
                              style={[
                                styles.roomTime,
                                unread > 0 && {
                                  color: colors.primary,
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              {formatRelativeTime(room.lastMessage.createdAt)}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <Text style={styles.roomSubtitle} numberOfLines={1}>
                        {room.lecturerName || room.description || 'Room Resmi'} •{' '}
                        {room.memberIds.length || 38} Anggota
                      </Text>

                      <View style={styles.roomBottomRow}>
                        <Text style={styles.lastMsgText} numberOfLines={1}>
                          {room.lastMessage ? (
                            <>
                              <Text style={styles.lastMsgSender}>
                                {room.lastMessage.senderName || 'Anggota'}:{' '}
                              </Text>
                              {room.lastMessage.text || 'Lampiran dokumen'}
                            </>
                          ) : (
                            'Belum ada percakapan di room ini'
                          )}
                        </Text>
                        {unread > 0 ? <Badge count={unread} color={colors.primary} /> : null}
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Info Keanggotaan Otomatis */}
        <View style={styles.autoJoinNote}>
          <Text style={styles.autoJoinNoteText}>
            Keanggotaan room kelas dan mata kuliah disinkronkan otomatis berdasarkan KRS
            semester aktif.
          </Text>
        </View>

        {/* Kartu Bantuan Akademik Resmi */}
        <Pressable
          onPress={() => router.push('/(tabs)/support')}
          style={styles.helpBanner}
        >
          <View style={styles.helpIconBox}>
            <HelpCircle size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>Butuh bantuan akademik resmi?</Text>
            <Text style={styles.helpSubtitle}>
              Hubungi Layanan Bantuan Akademik atau BAAK
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    ...typography.titleSm,
    color: colors.white,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.unreadDot,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
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
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...elevation.level1,
  },
  segmentText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  pinnedIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.warningBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pinnedLabel: {
    ...typography.labelSm,
    color: colors.warningText,
  },
  todayPill: {
    backgroundColor: colors.warningBorder,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  todayPillText: {
    ...typography.labelBadge,
    color: colors.warningText,
  },
  pinnedContent: {
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markReadText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
  roomList: {
    gap: space.sm,
  },
  roomCard: {
    padding: space.md,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  roomAvatarWrap: {
    position: 'relative',
  },
  roomAvatar: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomAvatarText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
  pinMiniBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  roomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  roomTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
    flex: 1,
  },
  roomMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainClassChip: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  mainClassChipText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  courseCodeChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  courseCodeChipText: {
    ...typography.labelBadge,
    color: colors.textSecondary,
  },
  roomTime: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  roomSubtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },
  roomBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: 4,
  },
  lastMsgText: {
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  lastMsgSender: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  autoJoinNote: {
    paddingHorizontal: space.sm,
    paddingTop: space.xs,
  },
  autoJoinNoteText: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    marginTop: space.xs,
  },
  helpIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    ...typography.titleSm,
    color: colors.textPrimary,
  },
  helpSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
