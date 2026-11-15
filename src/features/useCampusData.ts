import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '@/store';
import {
  loginWithNimNip,
  logoutUser,
  restoreSession,
  updateProfileAvatar,
  getHasSeenNotifPermission,
  setHasSeenNotifPermission,
  fetchNavPreferences,
  saveNavPreferences,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  fetchNotificationPreferences,
  saveNotificationPreferences,
  subscribeRealtimeUpdates,
  fetchSchedules,
  fetchScheduleById,
  submitScheduleChange,
  fetchCourses,
  fetchCourseById,
  fetchMaterials,
  fetchMaterialById,
  markMaterialAsRead,
  toggleMaterialOfflineDownload,
  uploadCourseMaterial,
  deleteCourseMaterial,
  fetchAssignments,
  fetchAssignmentById,
  createCourseAssignment,
  submitStudentAssignment,
  fetchSubmissionsForAssignment,
  gradeStudentSubmission,
  fetchChatRooms,
  fetchChatRoomById,
  markChatRoomRead,
  fetchChatMessages,
  sendChatMessage,
  togglePinMessage,
  toggleMessageAnnouncement,
  deleteMessageByAdmin,
  reportChatMessage,
  setRoomMuteDuration,
  fetchBills,
  fetchBillById,
  fetchFaqs,
  fetchFaqById,
  fetchTickets,
  fetchTicketById,
  createSupportTicket,
  addTicketReply,
  updateTicketStatus,
  submitTicketRating,
  fetchCampusAnnouncements,
  getCourseChatRoomId,
} from '@/services';

export { getCourseChatRoomId };
import {
  Role,
  NavItemKey,
  NotificationPreferences,
  ChatMessage,
  TicketStatus,
} from '@/types';

export function useRealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeRealtimeUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleDetail'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courseDetail'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materialDetail'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoomDetail'] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['billDetail'] });
      queryClient.invalidateQueries({ queryKey: ['campusAnnouncements'] });
    });
    return unsubscribe;
  }, [queryClient]);
}

export function useAuthBootstrap() {
  const setUser = useAppStore((s) => s.setUser);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const setNavSlots = useAppStore((s) => s.setNavSlots);
  const setNotifPrefs = useAppStore((s) => s.setNotifPrefs);
  const setHasSeenNotifOnboarding = useAppStore((s) => s.setHasSeenNotifOnboarding);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const restored = await restoreSession();
        if (restored && mounted) {
          setUser(restored);
          const [slots, prefs, seenPerm] = await Promise.all([
            fetchNavPreferences(restored.id),
            fetchNotificationPreferences(restored.id),
            getHasSeenNotifPermission(restored.id),
          ]);
          if (mounted) {
            setNavSlots(slots);
            setNotifPrefs(prefs);
            setHasSeenNotifOnboarding(seenPerm);
          }
        }
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setUser, setHydrated, setNavSlots, setNotifPrefs, setHasSeenNotifOnboarding]);
}

export function useAuthActions() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setNavSlots = useAppStore((s) => s.setNavSlots);
  const setNotifPrefs = useAppStore((s) => s.setNotifPrefs);
  const setHasSeenNotifOnboarding = useAppStore((s) => s.setHasSeenNotifOnboarding);
  const clearSession = useAppStore((s) => s.clearSession);
  const showToast = useAppStore((s) => s.showToast);

  const loginMutation = useMutation({
    mutationFn: async (params: { nimNip: string; password: string; role: Role }) => {
      const loggedInUser = await loginWithNimNip(
        params.nimNip,
        params.password,
        params.role
      );
      const [slots, prefs, seenPerm] = await Promise.all([
        fetchNavPreferences(loggedInUser.id),
        fetchNotificationPreferences(loggedInUser.id),
        getHasSeenNotifPermission(loggedInUser.id),
      ]);
      setUser(loggedInUser);
      setNavSlots(slots);
      setNotifPrefs(prefs);
      setHasSeenNotifOnboarding(seenPerm);
      return { user: loggedInUser, seenPerm };
    },
  });

  const logoutMutation = useMutation({
    onMutate: () => {
      clearSession();
      queryClient.clear();
    },
    mutationFn: async () => {
      await logoutUser();
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (avatarUri: string) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi tidak ditemukan');
      const updatedUri = await updateProfileAvatar(activeUser.id, avatarUri);
      setUser({ ...activeUser, avatarUrl: updatedUri });
      showToast('Foto profil berhasil diperbarui');
      return updatedUri;
    },
  });

  const completeNotifOnboarding = async (requestSystemDialog: boolean) => {
    if (requestSystemDialog) {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {
        // ignore in web/simulator
      }
    }
    if (user) {
      await setHasSeenNotifPermission(user.id);
    }
    setHasSeenNotifOnboarding(true);
  };

  return {
    loginMutation,
    logoutMutation,
    avatarMutation,
    completeNotifOnboarding,
  };
}

export function useNavPreferenceActions() {
  const user = useAppStore((s) => s.user);
  const navSlots = useAppStore((s) => s.navSlots);
  const setNavSlots = useAppStore((s) => s.setNavSlots);
  const resetNavSlots = useAppStore((s) => s.resetNavSlots);
  const showToast = useAppStore((s) => s.showToast);

  const updateSlots = async (nextSlots: [NavItemKey, NavItemKey, NavItemKey]) => {
    setNavSlots(nextSlots);
    if (user) {
      await saveNavPreferences(user.id, nextSlots);
    }
    showToast('Tersimpan ke akun');
  };

  const resetToDefault = async () => {
    resetNavSlots();
    if (user) {
      await saveNavPreferences(user.id, ['jadwal', 'pembelajaran', 'chat']);
    }
    showToast('Navigasi dikembalikan ke default');
  };

  return {
    navSlots,
    updateSlots,
    resetToDefault,
  };
}

export function useNotificationsData() {
  const user = useAppStore((s) => s.user);
  const notifPrefs = useAppStore((s) => s.notifPrefs);
  const setNotifPrefs = useAppStore((s) => s.setNotifPrefs);
  const showToast = useAppStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user?.id),
  });

  // Badge di lonceng = total belum dibaca dari kategori yang aktif
  const activeUnreadCount = (query.data || []).filter((n) => {
    if (n.isRead) return false;
    const catPref = notifPrefs.categories[n.category];
    return catPref ? catPref.enabled : true;
  }).length;

  const markReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead?: boolean }) =>
      markNotificationRead(id, isRead ?? true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Semua notifikasi ditandai dibaca');
    },
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Notifikasi dihapus');
    },
  });

  const savePreferences = async (nextPrefs: NotificationPreferences) => {
    setNotifPrefs(nextPrefs);
    if (user) {
      await saveNotificationPreferences(user.id, nextPrefs);
    }
    showToast('Tersimpan');
  };

  return {
    ...query,
    activeUnreadCount,
    notifPrefs,
    markReadMutation,
    markAllReadMutation,
    deleteNotifMutation,
    savePreferences,
  };
}

export function useSchedulesData() {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const query = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (params: {
      scheduleId: string;
      field: 'room' | 'time' | 'day' | 'cancel';
      newValue: string;
      scope: 'once' | 'permanent';
      reason?: string;
      broadcastToChat: boolean;
    }) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi dosen tidak ditemukan');
      return submitScheduleChange({ ...params, actor: activeUser });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleDetail'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      showToast('Perubahan jadwal disimpan & notifikasi dikirim');
    },
  });

  return {
    ...query,
    updateScheduleMutation,
  };
}

export function useScheduleDetailData(scheduleId: string) {
  return useQuery({
    queryKey: ['scheduleDetail', scheduleId],
    queryFn: () => fetchScheduleById(scheduleId),
    enabled: Boolean(scheduleId),
  });
}

export function useCoursesData() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });
}

export function useCourseDetailData(courseId: string) {
  const user = useAppStore((s) => s.user);

  const courseQuery = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: () => fetchCourseById(courseId),
    enabled: Boolean(courseId),
  });

  const materialsQuery = useQuery({
    queryKey: ['materials', courseId],
    queryFn: () => fetchMaterials(courseId),
    enabled: Boolean(courseId),
  });

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', courseId, user?.id],
    queryFn: () => fetchAssignments(courseId, user?.id),
    enabled: Boolean(courseId),
  });

  return {
    courseQuery,
    materialsQuery,
    assignmentsQuery,
  };
}

export function useMaterialsData(courseId?: string) {
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const query = useQuery({
    queryKey: ['materials', courseId || 'all'],
    queryFn: () => fetchMaterials(courseId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (params: {
      courseId: string;
      meeting: number;
      title: string;
      description?: string;
      type: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
      url: string;
      sizeBytes?: number;
      notifyStudents: boolean;
    }) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi dosen tidak ditemukan');
      return uploadCourseMaterial({ ...params, uploader: activeUser });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Materi berhasil diunggah');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => deleteCourseMaterial(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showToast('Materi dihapus');
    },
  });

  const toggleOfflineMutation = useMutation({
    mutationFn: (materialId: string) => toggleMaterialOfflineDownload(materialId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materialDetail'] });
      showToast(
        updated?.isDownloadedOffline
          ? 'Materi disimpan untuk akses offline'
          : 'Unduhan offline dihapus'
      );
    },
  });

  return {
    ...query,
    uploadMutation,
    deleteMutation,
    toggleOfflineMutation,
  };
}

export function useMaterialDetailData(materialId: string) {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['materialDetail', materialId],
    queryFn: async () => {
      await markMaterialAsRead(materialId, user?.id);
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      return fetchMaterialById(materialId);
    },
    enabled: Boolean(materialId),
  });

  return query;
}

export function useAssignmentsData(courseId?: string) {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const query = useQuery({
    queryKey: ['assignments', courseId || 'all', user?.id],
    queryFn: () => fetchAssignments(courseId, user?.id),
  });

  const createMutation = useMutation({
    mutationFn: async (params: {
      courseId: string;
      title: string;
      description: string;
      attachments: string[];
      dueAt: string;
      allowLate: boolean;
      submissionType: 'file' | 'text';
    }) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi dosen tidak ditemukan');
      return createCourseAssignment({ ...params, creator: activeUser });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Tugas berhasil diterbitkan');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (params: {
      assignmentId: string;
      files?: string[];
      text?: string;
      notes?: string;
    }) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi mahasiswa tidak ditemukan');
      return submitStudentAssignment({ ...params, student: activeUser });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showToast('Jawaban tugas berhasil dikumpulkan');
    },
  });

  return {
    ...query,
    createMutation,
    submitMutation,
  };
}

export function useAssignmentDetailData(assignmentId: string) {
  const user = useAppStore((s) => s.user);
  return useQuery({
    queryKey: ['assignmentDetail', assignmentId, user?.id],
    queryFn: () => fetchAssignmentById(assignmentId, user?.id),
    enabled: Boolean(assignmentId),
  });
}

export function useSubmissionsListData(assignmentId: string) {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const query = useQuery({
    queryKey: ['assignmentSubmissions', assignmentId],
    queryFn: () => fetchSubmissionsForAssignment(assignmentId),
    enabled: Boolean(assignmentId),
  });

  const gradeMutation = useMutation({
    mutationFn: async (params: {
      studentId: string;
      studentName: string;
      studentNim: string;
      score: number;
      feedback?: string;
    }) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi dosen tidak ditemukan');
      return gradeStudentSubmission({
        assignmentId,
        ...params,
        lecturer: activeUser,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Nilai & komentar berhasil disimpan');
    },
  });

  return {
    ...query,
    gradeMutation,
  };
}

export function useChatRoomsData() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['chatRooms', user?.id],
    queryFn: fetchChatRooms,
    refetchInterval: 3500,
  });

  const markAllRoomsReadMutation = useMutation({
    mutationFn: async () => {
      const rooms = query.data || [];
      for (const r of rooms) {
        if ((r.unreadCount || 0) > 0) {
          await markChatRoomRead(r.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const totalUnreadChat = (query.data || []).reduce(
    (acc, r) => acc + (r.unreadCount || 0),
    0
  );

  return {
    ...query,
    totalUnreadChat,
    markAllRoomsReadMutation,
  };
}

export function useChatRoomDetailData(roomId: string) {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const roomQuery = useQuery({
    queryKey: ['chatRoomDetail', roomId, user?.id],
    queryFn: async () => {
      await markChatRoomRead(roomId);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      return fetchChatRoomById(roomId);
    },
    enabled: Boolean(roomId),
    refetchInterval: 4000,
  });

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', roomId, user?.id],
    queryFn: () => fetchChatMessages(roomId),
    enabled: Boolean(roomId),
    refetchInterval: 2500,
  });

  const sendMutation = useMutation({
    mutationFn: async (params: {
      text?: string;
      attachments?: string[];
      replyToMessage?: ChatMessage | null;
      mentions?: string[];
      isAnnouncement?: boolean;
    }) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi tidak ditemukan');
      return sendChatMessage({
        roomId,
        sender: activeUser,
        ...params,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoomDetail'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim pesan');
    },
  });

  const pinMutation = useMutation({
    mutationFn: (messageId: string) => togglePinMessage(roomId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRoomDetail'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      showToast('Pesan tersemat diperbarui');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Gagal menyematkan pesan');
    },
  });

  const announcementMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const activeUser = user || (await restoreSession());
      if (!activeUser) throw new Error('Sesi tidak ditemukan');
      return toggleMessageAnnouncement(roomId, messageId, activeUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoomDetail'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Status pengumuman diperbarui');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status pengumuman');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => deleteMessageByAdmin(roomId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoomDetail'] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      showToast('Pesan dihapus');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus pesan');
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({ messageId, reason }: { messageId: string; reason: string }) =>
      reportChatMessage(roomId, messageId, reason, user?.id || 'guest'),
    onSuccess: () => {
      showToast('Laporan pesan dikirim ke moderator');
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim laporan');
    },
  });

  const muteMutation = useMutation({
    mutationFn: (duration: 'off' | '8h' | '1w' | 'always') =>
      setRoomMuteDuration(roomId, duration, user?.id),
    onSuccess: (_val, duration) => {
      queryClient.invalidateQueries({ queryKey: ['chatRoomDetail', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      const label =
        duration === 'off'
          ? 'Notifikasi room diaktifkan'
          : duration === '8h'
          ? 'Room dibisukan selama 8 jam'
          : duration === '1w'
          ? 'Room dibisukan selama 1 minggu'
          : 'Room dibisukan selalu';
      showToast(label);
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui pengaturan bisu');
    },
  });

  return {
    roomQuery,
    messagesQuery,
    sendMutation,
    pinMutation,
    announcementMutation,
    deleteMutation,
    reportMutation,
    muteMutation,
  };
}

export function useBillsData() {
  const user = useAppStore((s) => s.user);
  return useQuery({
    queryKey: ['bills', user?.id],
    queryFn: () => fetchBills(user?.id),
  });
}

export function useBillDetailData(billId: string) {
  return useQuery({
    queryKey: ['billDetail', billId],
    queryFn: () => fetchBillById(billId),
    enabled: Boolean(billId),
  });
}

export function useSupportData() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const faqsQuery = useQuery({
    queryKey: ['faqs'],
    queryFn: fetchFaqs,
  });

  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });

  const createTicketMutation = useMutation({
    mutationFn: (params: {
      kind: 'bantuan' | 'pengaduan';
      category: string;
      courseId?: string;
      courseName?: string;
      title: string;
      description: string;
      attachments: string[];
      anonymous: boolean;
      guestNimNip?: string;
    }) => createSupportTicket({ ...params, user }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showToast(`Tiket ${created.code} berhasil dibuat`);
    },
  });

  return {
    faqsQuery,
    ticketsQuery,
    createTicketMutation,
  };
}

export function useFaqDetailData(faqId: string) {
  return useQuery({
    queryKey: ['faqDetail', faqId],
    queryFn: () => fetchFaqById(faqId),
    enabled: Boolean(faqId),
  });
}

export function useTicketDetailData(ticketId: string) {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const query = useQuery({
    queryKey: ['ticketDetail', ticketId],
    queryFn: () => fetchTicketById(ticketId),
    enabled: Boolean(ticketId),
  });

  const replyMutation = useMutation({
    mutationFn: (params: { message: string; attachments?: string[] }) =>
      addTicketReply({
        ticketId,
        message: params.message,
        attachments: params.attachments,
        sender: user,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Balasan terkirim');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ nextStatus, note }: { nextStatus: TicketStatus; note?: string }) =>
      updateTicketStatus({
        ticketId,
        nextStatus,
        note,
        userId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Status tiket diperbarui');
    },
  });

  const ratingMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      submitTicketRating({
        ticketId,
        rating,
        comment,
        userId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Penilaian layanan berhasil dikirim');
    },
  });

  return {
    ...query,
    replyMutation,
    statusMutation,
    ratingMutation,
  };
}

export function useCampusAnnouncementsData() {
  return useQuery({
    queryKey: ['campusAnnouncements'],
    queryFn: fetchCampusAnnouncements,
  });
}
