import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase, secureStorage } from '@/lib/supabase';
import {
  User,
  Role,
  Course,
  ScheduleItem,
  ScheduleChange,
  Material,
  Assignment,
  Submission,
  AppNotification,
  NotificationPreferences,
  NavItemKey,
  ChatRoom,
  ChatRoomMemberInfo,
  ChatMessage,
  Bill,
  FAQItem,
  Ticket,
  TicketStatus,
  CampusAnnouncement,
} from '@/types';
import {
  SEED_USERS,
  SEED_COURSES,
  SEED_SCHEDULES,
  SEED_MATERIALS,
  SEED_ASSIGNMENTS,
  SEED_SUBMISSIONS,
  SEED_NOTIFICATIONS,
  SEED_CHAT_ROOMS,
  SEED_CHAT_MESSAGES,
  SEED_BILLS,
  SEED_FAQS,
  SEED_TICKETS,
  SEED_ANNOUNCEMENTS,
} from './seedData';
import {
  DEFAULT_NAV_SLOTS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/store';

const STORAGE_KEYS = {
  SESSION_USER: 'ecampuz_session_user_v1',
  NOTIF_ONBOARDING_PREFIX: 'ecampuz_notif_onboarding_',
  NAV_PREF_PREFIX: 'ecampuz_nav_pref_',
  NOTIF_PREF_PREFIX: 'ecampuz_notif_pref_',
  CACHE_SCHEDULES: 'ecampuz_cache_schedules_v1',
  CACHE_COURSES: 'ecampuz_cache_courses_v1',
  CACHE_MATERIALS: 'ecampuz_cache_materials_v1',
  CACHE_ASSIGNMENTS: 'ecampuz_cache_assignments_v1',
  CACHE_SUBMISSIONS: 'ecampuz_cache_submissions_v1',
  CACHE_NOTIFS: 'ecampuz_cache_notifs_v1',
  CACHE_ROOMS: 'ecampuz_cache_rooms_v1',
  CACHE_MESSAGES: 'ecampuz_cache_messages_v1',
  CACHE_BILLS: 'ecampuz_cache_bills_v1',
  CACHE_FAQS: 'ecampuz_cache_faqs_v1',
  CACHE_TICKETS: 'ecampuz_cache_tickets_v1',
};

type RealtimeListener = () => void;
const localListeners = new Set<RealtimeListener>();
function emitLocalChange() {
  localListeners.forEach((fn) => fn());
}

async function readCache<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      await AsyncStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export async function triggerLocalPushIfAllowed(
  userId: string,
  notif: AppNotification
): Promise<void> {
  try {
    const prefs = await fetchNotificationPreferences(userId);
    if (!prefs.pushEnabled) return;
    const catPref = prefs.categories[notif.category];
    if (!catPref?.enabled) return;
    if (catPref.types[notif.type] === false) return;

    if (prefs.quietHours.enabled) {
      if (notif.priority !== 'urgent' || !prefs.quietHours.allowUrgent) {
        return;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notif.title,
        body: notif.body,
        data: { deepLink: notif.deepLink, notificationId: notif.id },
      },
      trigger: null,
    });
  } catch {
    // Expo Go / Simulator fallback
  }
}

async function appendNotificationToCache(
  notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>,
  userId?: string
): Promise<AppNotification> {
  const list = await readCache<AppNotification[]>(
    STORAGE_KEYS.CACHE_NOTIFS,
    SEED_NOTIFICATIONS
  );
  const created: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [created, ...list];
  await writeCache(STORAGE_KEYS.CACHE_NOTIFS, updated);
  if (userId) {
    await triggerLocalPushIfAllowed(userId, created);
  }
  emitLocalChange();
  return created;
}

// ============================================================================
// AUTENTIKASI & PROFIL
// ============================================================================

export async function loginWithNimNip(
  nimNip: string,
  password: string,
  expectedRole?: Role
): Promise<User> {
  const trimmed = nimNip.trim();
  if (!trimmed || !password) {
    throw new Error('NIM atau password salah');
  }

  // 1. Coba resolve email & signIn via Supabase
  try {
    const { data: emailFromRpc } = await supabase.rpc('resolve_login_email', {
      p_nim_nip: trimmed,
    });

    if (emailFromRpc) {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: emailFromRpc,
        password,
      });

      if (!authErr && authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, classes:class_id(name)')
          .eq('id', authData.user.id)
          .single();

        if (profile) {
          const userObj: User = {
            id: profile.id,
            role: profile.role as Role,
            name: profile.name,
            nimNip: profile.nim_nip,
            email: profile.email,
            phone: profile.phone || undefined,
            prodi: profile.prodi,
            faculty: profile.faculty,
            semester: profile.semester || undefined,
            cohortYear: profile.cohort_year || undefined,
            classId: profile.class_id || undefined,
            className: profile.classes?.name || 'TI-3A',
            isClassLeader: profile.is_class_leader,
            avatarUrl: profile.avatar_url || undefined,
          };
          await secureStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(userObj));
          return userObj;
        }
      }
    }
  } catch {
    // Fallback ke kredensial seed lokal jika server Supabase belum aktif
  }

  // 2. Fallback akun kampus terverifikasi (sesuai supabase/seed.sql)
  const seedAccount = SEED_USERS[trimmed];
  if (!seedAccount || seedAccount.password !== password) {
    throw new Error('NIM atau password salah');
  }
  if (expectedRole && seedAccount.role !== expectedRole) {
    throw new Error(
      expectedRole === 'dosen'
        ? 'Akun ini terdaftar sebagai Mahasiswa. Silakan pilih peran Mahasiswa.'
        : 'Akun ini terdaftar sebagai Dosen. Silakan pilih peran Dosen.'
    );
  }

  const { password: _pw, ...userClean } = seedAccount;
  await secureStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(userClean));
  return userClean;
}

export async function restoreSession(): Promise<User | null> {
  try {
    await ensureSupabaseSession();
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, classes:class_id(name)')
        .eq('id', data.session.user.id)
        .single();
      if (profile) {
        const userObj: User = {
          id: profile.id,
          role: profile.role as Role,
          name: profile.name,
          nimNip: profile.nim_nip,
          email: profile.email,
          phone: profile.phone || undefined,
          prodi: profile.prodi,
          faculty: profile.faculty,
          semester: profile.semester || undefined,
          cohortYear: profile.cohort_year || undefined,
          classId: profile.class_id || undefined,
          className: profile.classes?.name || 'TI-3A',
          isClassLeader: profile.is_class_leader,
          avatarUrl: profile.avatar_url || undefined,
        };
        await secureStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(userObj));
        return userObj;
      }
    }
  } catch {
    // baca dari secureStorage
  }

  const saved = await secureStorage.getItem(STORAGE_KEYS.SESSION_USER);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  isLoggingOut = true;
  try {
    await secureStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    await Promise.race([
      supabase.auth.signOut({ scope: 'local' }),
      new Promise<void>((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch {
    // ignore network error
  } finally {
    isLoggingOut = false;
    emitLocalChange();
  }
}

export async function updateProfileAvatar(userId: string, avatarUri: string): Promise<string> {
  try {
    const uid = (await getSupabaseUserId()) || userId;
    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUri })
      .eq('id', uid);
  } catch {
    // fallback cache
  }
  const saved = await secureStorage.getItem(STORAGE_KEYS.SESSION_USER);
  if (saved) {
    const parsed = JSON.parse(saved) as User;
    parsed.avatarUrl = avatarUri;
    await secureStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(parsed));
  }
  await broadcastRealtimeSync({ scope: 'profile', userId });
  emitLocalChange();
  return avatarUri;
}

export async function getHasSeenNotifPermission(userId: string): Promise<boolean> {
  const val = await AsyncStorage.getItem(`${STORAGE_KEYS.NOTIF_ONBOARDING_PREFIX}${userId}`);
  return val === 'true';
}

export async function setHasSeenNotifPermission(userId: string): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEYS.NOTIF_ONBOARDING_PREFIX}${userId}`, 'true');
}

// ============================================================================
// NAVBAR PRIORITAS
// ============================================================================

export async function fetchNavPreferences(
  userId: string
): Promise<[NavItemKey, NavItemKey, NavItemKey]> {
  try {
    const uid = (await getSupabaseUserId()) || userId;
    const { data, error } = await supabase
      .from('nav_preferences')
      .select('slots')
      .eq('user_id', uid)
      .single();
    if (!error && data?.slots?.length === 3) {
      const slots = data.slots as [NavItemKey, NavItemKey, NavItemKey];
      await writeCache(`${STORAGE_KEYS.NAV_PREF_PREFIX}${uid}`, slots);
      return slots;
    }
  } catch {
    // fallback
  }
  return readCache<[NavItemKey, NavItemKey, NavItemKey]>(
    `${STORAGE_KEYS.NAV_PREF_PREFIX}${userId}`,
    DEFAULT_NAV_SLOTS
  );
}

export async function saveNavPreferences(
  userId: string,
  slots: [NavItemKey, NavItemKey, NavItemKey]
): Promise<[NavItemKey, NavItemKey, NavItemKey]> {
  await writeCache(`${STORAGE_KEYS.NAV_PREF_PREFIX}${userId}`, slots);
  try {
    const uid = (await getSupabaseUserId()) || userId;
    await supabase.from('nav_preferences').upsert({
      user_id: uid,
      slots,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // tersimpan di akun lokal dan disinkronkan
  }
  return slots;
}

// ============================================================================
// NOTIFIKASI & PREFERENSI NOTIFIKASI
// ============================================================================

export async function fetchNotifications(userId?: string): Promise<AppNotification[]> {
  try {
    const uid = (await getSupabaseUserId()) || userId;
    if (uid) {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AppNotification[] = data.map((row) => ({
          id: row.id,
          category: row.category,
          type: row.type,
          priority: row.priority,
          title: row.title,
          body: row.body,
          deepLink: row.deep_link,
          isRead: row.is_read,
          createdAt: row.created_at,
          meta: row.meta || {},
        }));
        await writeCache(STORAGE_KEYS.CACHE_NOTIFS, mapped);
        return mapped;
      }
    }
  } catch {
    // fallback cache
  }
  const notifs = await readCache<AppNotification[]>(
    STORAGE_KEYS.CACHE_NOTIFS,
    SEED_NOTIFICATIONS
  );
  // Filter pengingat tugas yang sudah dikumpulkan
  const submissions = await readCache<Submission[]>(
    STORAGE_KEYS.CACHE_SUBMISSIONS,
    SEED_SUBMISSIONS
  );
  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignmentId));

  return notifs.filter((n) => {
    if (
      n.type === 'ASSIGNMENT_DUE_REMINDER' &&
      n.meta?.assignmentId &&
      submittedAssignmentIds.has(n.meta.assignmentId)
    ) {
      return false;
    }
    return true;
  });
}

export async function markNotificationRead(
  notificationId: string,
  isRead: boolean = true
): Promise<void> {
  const list = await readCache<AppNotification[]>(
    STORAGE_KEYS.CACHE_NOTIFS,
    SEED_NOTIFICATIONS
  );
  const updated = list.map((item) =>
    item.id === notificationId ? { ...item, isRead } : item
  );
  await writeCache(STORAGE_KEYS.CACHE_NOTIFS, updated);
  try {
    await getSupabaseUserId();
    await supabase
      .from('app_notifications')
      .update({ is_read: isRead })
      .eq('id', notificationId);
  } catch {
    // ignore
  }
  emitLocalChange();
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  const list = await readCache<AppNotification[]>(
    STORAGE_KEYS.CACHE_NOTIFS,
    SEED_NOTIFICATIONS
  );
  const updated = list.map((item) => ({ ...item, isRead: true }));
  await writeCache(STORAGE_KEYS.CACHE_NOTIFS, updated);
  try {
    const uid = (await getSupabaseUserId()) || userId;
    if (uid) {
      await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('user_id', uid);
    }
  } catch {
    // ignore
  }
  emitLocalChange();
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const list = await readCache<AppNotification[]>(
    STORAGE_KEYS.CACHE_NOTIFS,
    SEED_NOTIFICATIONS
  );
  const updated = list.filter((item) => item.id !== notificationId);
  await writeCache(STORAGE_KEYS.CACHE_NOTIFS, updated);
  try {
    await getSupabaseUserId();
    await supabase.from('app_notifications').delete().eq('id', notificationId);
  } catch {
    // ignore
  }
  emitLocalChange();
}

export async function fetchNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    const uid = (await getSupabaseUserId()) || userId;
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (!error && data) {
      const prefs: NotificationPreferences = {
        pushEnabled: data.push_enabled,
        categories: data.categories,
        classReminderMinutes: data.class_reminder_minutes,
        assignmentReminders: data.assignment_reminders,
        mutedCourseIdsForMaterial: data.muted_course_ids_for_material || [],
        quietHours: data.quiet_hours,
      };
      await writeCache(`${STORAGE_KEYS.NOTIF_PREF_PREFIX}${uid}`, prefs);
      return prefs;
    }
  } catch {
    // fallback
  }
  return readCache<NotificationPreferences>(
    `${STORAGE_KEYS.NOTIF_PREF_PREFIX}${userId}`,
    DEFAULT_NOTIFICATION_PREFERENCES
  );
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: NotificationPreferences
): Promise<NotificationPreferences> {
  await writeCache(`${STORAGE_KEYS.NOTIF_PREF_PREFIX}${userId}`, prefs);
  try {
    const uid = (await getSupabaseUserId()) || userId;
    await supabase.from('notification_preferences').upsert({
      user_id: uid,
      push_enabled: prefs.pushEnabled,
      categories: prefs.categories,
      class_reminder_minutes: prefs.classReminderMinutes,
      assignment_reminders: prefs.assignmentReminders,
      muted_course_ids_for_material: prefs.mutedCourseIdsForMaterial,
      quiet_hours: prefs.quietHours,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // saved locally
  }
  return prefs;
}

let sharedRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function broadcastRealtimeSync(payload: Record<string, unknown> = {}): Promise<void> {
  try {
    if (sharedRealtimeChannel) {
      await sharedRealtimeChannel.send({
        type: 'broadcast',
        event: 'sync',
        payload: { ...payload, ts: Date.now() },
      });
    }
  } catch {
    // ignore broadcast transport error
  }
}

export function subscribeRealtimeUpdates(onUpdate: () => void): () => void {
  localListeners.add(onUpdate);
  let disposed = false;

  const setupChannel = async (accessToken?: string) => {
    if (disposed) return;
    try {
      if (accessToken) {
        supabase.realtime.setAuth(accessToken);
      } else {
        await ensureSupabaseSession();
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          supabase.realtime.setAuth(data.session.access_token);
        }
      }
    } catch {
      // ignore session lookup failure
    }
    if (disposed) return;

    if (sharedRealtimeChannel) {
      supabase.removeChannel(sharedRealtimeChannel);
      sharedRealtimeChannel = null;
    }

    const tables = [
      'app_notifications',
      'chat_messages',
      'chat_rooms',
      'chat_room_members',
      'schedule_items',
      'schedule_changes',
      'materials',
      'assignments',
      'submissions',
      'tickets',
      'ticket_messages',
      'bills',
      'campus_announcements',
    ];

    let ch = supabase
      .channel('ecampuz-live-sync', {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'sync' }, () => {
        emitLocalChange();
      });

    for (const table of tables) {
      ch = ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          emitLocalChange();
        }
      );
    }

    sharedRealtimeChannel = ch.subscribe();
  };

  void setupChannel();

  const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
    if (disposed) return;
    if (
      event === 'INITIAL_SESSION' ||
      event === 'SIGNED_IN' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'SIGNED_OUT'
    ) {
      void setupChannel(session?.access_token);
      emitLocalChange();
    }
  });

  return () => {
    disposed = true;
    localListeners.delete(onUpdate);
    authSub?.subscription?.unsubscribe();
    if (localListeners.size === 0 && sharedRealtimeChannel) {
      supabase.removeChannel(sharedRealtimeChannel);
      sharedRealtimeChannel = null;
    }
  };
}

// ============================================================================
// JADWAL & PERUBAHAN JADWAL/RUANGAN
// ============================================================================

export async function fetchSchedules(): Promise<ScheduleItem[]> {
  try {
    await getSupabaseUserId();
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*, courses(*), schedule_changes(*)')
      .order('start_time', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: ScheduleItem[] = data.map((row) => ({
        id: row.id,
        courseId: row.course_id,
        courseCode: row.courses?.code || 'IF3201',
        courseName: row.courses?.name || 'Mata Kuliah',
        courseSks: row.courses?.sks || 3,
        className: 'TI-3A',
        lecturerNames: ['Dr. Ir. Ahmad Fauzi, M.Kom.'],
        day: row.day,
        startTime: String(row.start_time).slice(0, 5),
        endTime: String(row.end_time).slice(0, 5),
        room: row.room,
        type: row.type,
        onlineUrl: row.online_url || undefined,
        status: row.status,
        changes: (row.schedule_changes || [])
          .sort(
            (a: any, b: any) =>
              new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
          )
          .map((c: Record<string, unknown>) => ({
            id: String(c.id),
            field: c.field as ScheduleChange['field'],
            oldValue: String(c.old_value),
            newValue: String(c.new_value),
            scope: c.scope as ScheduleChange['scope'],
            date: c.effective_date ? String(c.effective_date) : undefined,
            reason: c.reason ? String(c.reason) : undefined,
            changedBy: String(c.changed_by),
            changedByName: 'Dosen Pengampu',
            changedAt: String(c.changed_at),
            broadcastToChat: Boolean(c.broadcast_to_chat),
          })),
      }));
      await writeCache(STORAGE_KEYS.CACHE_SCHEDULES, mapped);
      return mapped;
    }
  } catch {
    // fallback cache
  }
  return readCache<ScheduleItem[]>(STORAGE_KEYS.CACHE_SCHEDULES, SEED_SCHEDULES);
}

export async function fetchScheduleById(id: string): Promise<ScheduleItem | null> {
  const list = await fetchSchedules();
  return list.find((s) => s.id === id) || null;
}

export async function submitScheduleChange(params: {
  scheduleId: string;
  field: 'room' | 'time' | 'day' | 'cancel';
  newValue: string;
  scope: 'once' | 'permanent';
  reason?: string;
  broadcastToChat: boolean;
  actor: User;
}): Promise<ScheduleItem> {
  const list = await fetchSchedules();
  const target = list.find((s) => s.id === params.scheduleId);
  if (!target) {
    throw new Error('Jadwal tidak ditemukan');
  }

  const oldValue =
    params.field === 'room'
      ? target.room
      : params.field === 'time'
      ? `${target.startTime}–${target.endTime}`
      : params.field === 'day'
      ? `Hari ke-${target.day}`
      : 'Terjadwal';

  const newChange: ScheduleChange = {
    id: `chg-${Date.now()}`,
    field: params.field,
    oldValue,
    newValue: params.newValue,
    scope: params.scope,
    date: new Date().toISOString().slice(0, 10),
    reason: params.reason,
    changedBy: params.actor.id,
    changedByName: params.actor.name,
    changedAt: new Date().toISOString(),
    broadcastToChat: params.broadcastToChat,
  };

  let savedToSupabase = false;
  try {
    const uid = (await getSupabaseUserId()) || params.actor.id;
    const { error } = await supabase.from('schedule_changes').insert({
      schedule_item_id: params.scheduleId,
      field: params.field,
      old_value: oldValue,
      new_value: params.newValue,
      scope: params.scope,
      effective_date: new Date().toISOString().slice(0, 10),
      reason: params.reason || null,
      broadcast_to_chat: params.broadcastToChat,
      changed_by: uid,
    });
    if (!error) {
      savedToSupabase = true;
      if (params.field === 'time' && params.newValue.includes('–')) {
        const [newStart, newEnd] = params.newValue.split('–').map((s) => s.trim());
        if (newStart && newEnd) {
          await supabase
            .from('schedule_items')
            .update({ start_time: newStart, end_time: newEnd, status: 'changed' })
            .eq('id', params.scheduleId);
        }
      }
    }
  } catch {
    // fallback cache update
  }

  const updatedItem: ScheduleItem = {
    ...target,
    room: params.field === 'room' ? params.newValue : target.room,
    startTime:
      params.field === 'time' && params.newValue.includes('–')
        ? params.newValue.split('–')[0].trim()
        : target.startTime,
    endTime:
      params.field === 'time' && params.newValue.includes('–')
        ? params.newValue.split('–')[1].trim()
        : target.endTime,
    status: params.field === 'cancel' ? 'cancelled' : 'changed',
    changes: [newChange, ...(target.changes || [])],
  };

  const nextSchedules = list.map((s) => (s.id === params.scheduleId ? updatedItem : s));
  await writeCache(STORAGE_KEYS.CACHE_SCHEDULES, nextSchedules);

  // Trigger Notifikasi Otomatis
  const isRoom = params.field === 'room';
  const isCancel = params.field === 'cancel';
  if (!savedToSupabase) {
    await appendNotificationToCache(
      {
        category: 'SCHEDULE',
        type: isRoom
          ? 'ROOM_CHANGED'
          : isCancel
          ? 'CLASS_CANCELLED'
          : 'SCHEDULE_CHANGED',
        priority: isRoom ? 'urgent' : 'high',
        title: isRoom
          ? 'Ruangan Kuliah Berubah'
          : isCancel
          ? 'Pertemuan Kuliah Dibatalkan'
          : 'Jadwal Kuliah Berubah',
        body: `${target.courseName}: ${oldValue} → ${params.newValue}`,
        deepLink: `/schedule/${target.id}`,
        meta: {
          courseName: target.courseName || 'Mata Kuliah',
          oldValue,
          newValue: params.newValue,
          field: params.field,
        },
      },
      params.actor.id
    );

    if (params.broadcastToChat) {
      await sendChatMessage({
        roomId: '66666666-6666-6666-6666-666666666601',
        sender: params.actor,
        text: `[Perubahan ${isRoom ? 'Ruangan' : 'Jadwal'}] ${target.courseName}: ${oldValue} → ${
          params.newValue
        }.${params.reason ? ` Catatan: ${params.reason}` : ''}`,
        isAnnouncement: true,
      });
    }
  }

  await broadcastRealtimeSync({ scope: 'schedule', scheduleId: params.scheduleId });
  emitLocalChange();
  return updatedItem;
}

// ============================================================================
// PEMBELAJARAN (MATERI & TUGAS)
// ============================================================================

export async function fetchCourses(): Promise<Course[]> {
  try {
    const [coursesRes, materialsList, assignmentsList] = await Promise.all([
      supabase.from('courses').select('*, course_lecturers(lecturer_id, profiles:lecturer_id(name))'),
      fetchMaterials(),
      fetchAssignments(),
    ]);
    if (!coursesRes.error && coursesRes.data && coursesRes.data.length > 0) {
      const mapped: Course[] = coursesRes.data.map((row: any) => {
        const lectRows = Array.isArray(row.course_lecturers) ? row.course_lecturers : [];
        const lecturerIds =
          lectRows.length > 0
            ? lectRows.map((l: any) => l.lecturer_id)
            : ['33333333-3333-3333-3333-333333333301'];
        const lecturerNames =
          lectRows.length > 0
            ? lectRows.map((l: any) => l.profiles?.name || 'Dr. Ir. Ahmad Fauzi, M.Kom.')
            : ['Dr. Ir. Ahmad Fauzi, M.Kom.'];
        const unreadMat = materialsList.filter((m) => m.courseId === row.id && !m.isRead).length;
        const activeAss = assignmentsList.filter(
          (a) => a.courseId === row.id && !a.submission
        ).length;
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          sks: row.sks,
          lecturerIds,
          lecturerNames,
          classId: row.class_id,
          className: 'TI-3A',
          semester: row.semester,
          description: row.description || undefined,
          rpsUrl: row.rps_url || undefined,
          currentMeeting: 7,
          totalMeetings: 16,
          unreadMaterialCount: unreadMat,
          activeAssignmentCount: activeAss,
        };
      });
      await writeCache(STORAGE_KEYS.CACHE_COURSES, mapped);
      return mapped;
    }
  } catch {
    // fallback
  }
  const courses = await readCache<Course[]>(STORAGE_KEYS.CACHE_COURSES, SEED_COURSES);
  const materials = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
  const assignments = await readCache<Assignment[]>(
    STORAGE_KEYS.CACHE_ASSIGNMENTS,
    SEED_ASSIGNMENTS
  );
  const submissions = await readCache<Submission[]>(
    STORAGE_KEYS.CACHE_SUBMISSIONS,
    SEED_SUBMISSIONS
  );

  return courses.map((c) => {
    const unreadMat = materials.filter((m) => m.courseId === c.id && !m.isRead).length;
    const activeAss = assignments.filter(
      (a) => a.courseId === c.id && !submissions.some((s) => s.assignmentId === a.id)
    ).length;
    return {
      ...c,
      unreadMaterialCount: unreadMat,
      activeAssignmentCount: activeAss,
    };
  });
}

export async function fetchCourseById(courseId: string): Promise<Course | null> {
  const courses = await fetchCourses();
  return courses.find((c) => c.id === courseId) || null;
}

export async function fetchMaterials(courseId?: string): Promise<Material[]> {
  try {
    const currentUserId = await getSupabaseUserId();
    const [matRes, readsRes] = await Promise.all([
      supabase
        .from('materials')
        .select('*, courses:course_id(code, name), profiles:uploaded_by(name)')
        .order('uploaded_at', { ascending: false }),
      currentUserId
        ? supabase.from('material_reads').select('material_id').eq('user_id', currentUserId)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    if (!matRes.error && matRes.data && matRes.data.length > 0) {
      const cached = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
      const offlineMap = new Map(cached.map((c) => [c.id, Boolean(c.isDownloadedOffline)]));
      const readSet = new Set((readsRes.data || []).map((r: any) => r.material_id));

      const mapped: Material[] = matRes.data.map((row: any) => ({
        id: row.id,
        courseId: row.course_id,
        courseCode: row.courses?.code || 'IF3201',
        courseName: row.courses?.name || 'Mata Kuliah',
        meeting: Number(row.meeting),
        title: row.title,
        description: row.description || undefined,
        type: row.type,
        url: row.url,
        sizeBytes: row.size_bytes ? Number(row.size_bytes) : undefined,
        uploadedBy: row.uploaded_by,
        uploadedByName: row.profiles?.name || 'Dosen Pengampu',
        uploadedAt: row.uploaded_at,
        isRead: readSet.has(row.id) || Boolean(offlineMap.get(row.id)),
        isDownloadedOffline: Boolean(offlineMap.get(row.id)),
      }));

      await writeCache(STORAGE_KEYS.CACHE_MATERIALS, mapped);
      if (!courseId) return mapped;
      return mapped
        .filter((m) => m.courseId === courseId)
        .sort((a, b) => b.meeting - a.meeting);
    }
  } catch {
    // fallback cache
  }

  const all = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
  if (!courseId) {
    return [...all].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }
  return all
    .filter((m) => m.courseId === courseId)
    .sort((a, b) => b.meeting - a.meeting);
}

export async function fetchMaterialById(materialId: string): Promise<Material | null> {
  const all = await fetchMaterials();
  return all.find((m) => m.id === materialId) || null;
}

export async function markMaterialAsRead(materialId: string, userId?: string): Promise<void> {
  const all = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
  const next = all.map((m) => (m.id === materialId ? { ...m, isRead: true } : m));
  await writeCache(STORAGE_KEYS.CACHE_MATERIALS, next);
  try {
    const uid = userId || (await getSupabaseUserId());
    if (uid && isUuid(materialId)) {
      await supabase.from('material_reads').upsert({
        material_id: materialId,
        user_id: uid,
      });
    }
  } catch {
    // ignore
  }
}

export async function toggleMaterialOfflineDownload(materialId: string): Promise<Material | null> {
  const all = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
  let updatedItem: Material | null = null;
  const next = all.map((m) => {
    if (m.id === materialId) {
      updatedItem = { ...m, isDownloadedOffline: !m.isDownloadedOffline, isRead: true };
      return updatedItem;
    }
    return m;
  });
  await writeCache(STORAGE_KEYS.CACHE_MATERIALS, next);
  return updatedItem;
}

export async function uploadCourseMaterial(params: {
  courseId: string;
  meeting: number;
  title: string;
  description?: string;
  type: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
  url: string;
  sizeBytes?: number;
  notifyStudents: boolean;
  uploader: User;
}): Promise<Material> {
  const courses = await fetchCourses();
  const course = courses.find((c) => c.id === params.courseId);

  let insertedRow: any = null;
  try {
    const uid = (await getSupabaseUserId()) || params.uploader.id;
    const { data, error } = await supabase
      .from('materials')
      .insert({
        course_id: params.courseId,
        meeting: params.meeting,
        title: params.title,
        description: params.description || null,
        type: params.type,
        url: params.url,
        size_bytes: params.sizeBytes || 2450000,
        notify_students: params.notifyStudents,
        uploaded_by: uid,
      })
      .select('*')
      .single();
    if (!error && data) {
      insertedRow = data;
    }
  } catch {
    // fallback cache
  }

  const all = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
  const created: Material = {
    id: insertedRow?.id || `mat-${Date.now()}`,
    courseId: params.courseId,
    courseCode: course?.code || 'IF3201',
    courseName: course?.name || 'Mata Kuliah',
    meeting: params.meeting,
    title: params.title,
    description: params.description,
    type: params.type,
    url: params.url,
    sizeBytes: params.sizeBytes || 2450000,
    uploadedBy: params.uploader.id,
    uploadedByName: params.uploader.name,
    uploadedAt: insertedRow?.uploaded_at || new Date().toISOString(),
    isRead: false,
    isDownloadedOffline: false,
  };
  await writeCache(STORAGE_KEYS.CACHE_MATERIALS, [created, ...all]);

  if (params.notifyStudents && !insertedRow) {
    await appendNotificationToCache(
      {
        category: 'LEARNING',
        type: 'MATERIAL_UPLOADED',
        priority: 'low',
        title: `Materi Baru: Pertemuan ${params.meeting}`,
        body: `${course?.name || 'Mata Kuliah'} — ${params.title}`,
        deepLink: `/learning/${params.courseId}/material/${created.id}`,
      },
      params.uploader.id
    );
  }

  await broadcastRealtimeSync({ scope: 'material', courseId: params.courseId });
  emitLocalChange();
  return created;
}

export async function deleteCourseMaterial(materialId: string): Promise<void> {
  const all = await readCache<Material[]>(STORAGE_KEYS.CACHE_MATERIALS, SEED_MATERIALS);
  await writeCache(
    STORAGE_KEYS.CACHE_MATERIALS,
    all.filter((m) => m.id !== materialId)
  );
  try {
    await getSupabaseUserId();
    if (isUuid(materialId)) {
      await supabase.from('materials').delete().eq('id', materialId);
    }
  } catch {
    // ignore
  }
  await broadcastRealtimeSync({ scope: 'material', materialId });
  emitLocalChange();
}

export async function fetchAssignments(
  courseId?: string,
  studentId?: string
): Promise<Assignment[]> {
  try {
    const activeStudentId = studentId || (await getSupabaseUserId());
    const [asgRes, subRes] = await Promise.all([
      supabase
        .from('assignments')
        .select('*, courses:course_id(code, name)')
        .order('due_at', { ascending: true }),
      supabase
        .from('submissions')
        .select('*, profiles:student_id(name, nim_nip)'),
    ]);

    if (!asgRes.error && asgRes.data && asgRes.data.length > 0) {
      const subRows = subRes.data || [];
      const mappedSubs: Submission[] = subRows.map((s: any) => ({
        id: s.id,
        assignmentId: s.assignment_id,
        studentId: s.student_id,
        studentName: s.profiles?.name || 'Mahasiswa',
        studentNim: s.profiles?.nim_nip || '-',
        submittedAt: s.submitted_at,
        files: Array.isArray(s.files) ? s.files : [],
        text: s.text_answer || undefined,
        notes: s.notes || undefined,
        status: s.status,
        score: s.score !== null && s.score !== undefined ? Number(s.score) : undefined,
        feedback: s.feedback || undefined,
        gradedAt: s.graded_at || undefined,
      }));
      await writeCache(STORAGE_KEYS.CACHE_SUBMISSIONS, mappedSubs);

      const mappedAsg: Assignment[] = asgRes.data.map((row: any) => {
        const subForAsg = mappedSubs.filter((s) => s.assignmentId === row.id);
        const mySub = activeStudentId
          ? subForAsg.find((s) => s.studentId === activeStudentId)
          : subForAsg[0];
        return {
          id: row.id,
          courseId: row.course_id,
          courseCode: row.courses?.code || 'IF3201',
          courseName: row.courses?.name || 'Mata Kuliah',
          title: row.title,
          description: row.description,
          attachments: Array.isArray(row.attachments) ? row.attachments : [],
          dueAt: row.due_at,
          allowLate: Boolean(row.allow_late),
          submissionType: row.submission_type,
          submission: mySub,
          submittedCount: subForAsg.length,
          totalStudentsCount: 32,
        };
      });
      await writeCache(STORAGE_KEYS.CACHE_ASSIGNMENTS, mappedAsg);

      const filtered = courseId
        ? mappedAsg.filter((a) => a.courseId === courseId)
        : mappedAsg;
      return filtered.sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      );
    }
  } catch {
    // fallback cache
  }

  const assignments = await readCache<Assignment[]>(
    STORAGE_KEYS.CACHE_ASSIGNMENTS,
    SEED_ASSIGNMENTS
  );
  const submissions = await readCache<Submission[]>(
    STORAGE_KEYS.CACHE_SUBMISSIONS,
    SEED_SUBMISSIONS
  );

  const enriched = assignments.map((a) => {
    const sub = submissions.find(
      (s) =>
        s.assignmentId === a.id &&
        (!studentId || s.studentId === studentId || s.studentId === '22222222-2222-2222-2222-222222222201')
    );
    return {
      ...a,
      submission: sub,
    };
  });

  const filtered = courseId
    ? enriched.filter((a) => a.courseId === courseId)
    : enriched;

  return filtered.sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );
}

export async function fetchAssignmentById(
  assignmentId: string,
  studentId?: string
): Promise<Assignment | null> {
  const list = await fetchAssignments(undefined, studentId);
  return list.find((a) => a.id === assignmentId) || null;
}

export async function createCourseAssignment(params: {
  courseId: string;
  title: string;
  description: string;
  attachments: string[];
  dueAt: string;
  allowLate: boolean;
  submissionType: 'file' | 'text';
  creator: User;
}): Promise<Assignment> {
  const courses = await fetchCourses();
  const course = courses.find((c) => c.id === params.courseId);

  let insertedRow: any = null;
  try {
    const uid = (await getSupabaseUserId()) || params.creator.id;
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        course_id: params.courseId,
        title: params.title,
        description: params.description,
        attachments: params.attachments,
        due_at: params.dueAt,
        allow_late: params.allowLate,
        submission_type: params.submissionType,
        created_by: uid,
      })
      .select('*')
      .single();
    if (!error && data) {
      insertedRow = data;
    }
  } catch {
    // fallback
  }

  const all = await readCache<Assignment[]>(
    STORAGE_KEYS.CACHE_ASSIGNMENTS,
    SEED_ASSIGNMENTS
  );
  const created: Assignment = {
    id: insertedRow?.id || `asg-${Date.now()}`,
    courseId: params.courseId,
    courseCode: course?.code || 'IF3201',
    courseName: course?.name || 'Mata Kuliah',
    title: params.title,
    description: params.description,
    attachments: params.attachments,
    dueAt: params.dueAt,
    allowLate: params.allowLate,
    submissionType: params.submissionType,
    submittedCount: 0,
    totalStudentsCount: 32,
  };
  await writeCache(STORAGE_KEYS.CACHE_ASSIGNMENTS, [created, ...all]);

  if (!insertedRow) {
    await appendNotificationToCache(
      {
        category: 'ASSIGNMENT',
        type: 'ASSIGNMENT_NEW',
        priority: 'normal',
        title: 'Tugas Baru Tersedia',
        body: `${course?.name || 'Mata Kuliah'}: ${params.title}`,
        deepLink: `/learning/${params.courseId}/assignment/${created.id}`,
        meta: { assignmentId: created.id },
      },
      params.creator.id
    );
  }

  await broadcastRealtimeSync({ scope: 'assignment', courseId: params.courseId });
  emitLocalChange();
  return created;
}

export async function submitStudentAssignment(params: {
  assignmentId: string;
  student: User;
  files?: string[];
  text?: string;
  notes?: string;
}): Promise<Submission> {
  const assignment = await fetchAssignmentById(params.assignmentId, params.student.id);
  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  const isAfterDeadline = new Date().getTime() > new Date(assignment.dueAt).getTime();
  if (isAfterDeadline && !assignment.allowLate) {
    throw new Error('Batas waktu pengumpulan tugas telah berakhir.');
  }

  const status: Submission['status'] = isAfterDeadline ? 'late' : 'submitted';
  let savedRow: any = null;

  try {
    const uid = (await getSupabaseUserId()) || params.student.id;
    const { data, error } = await supabase
      .from('submissions')
      .upsert(
        {
          assignment_id: params.assignmentId,
          student_id: uid,
          files: params.files || [],
          text_answer: params.text || null,
          notes: params.notes || null,
          status,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,student_id' }
      )
      .select('*')
      .single();
    if (!error && data) {
      savedRow = data;
    }
  } catch {
    // fallback
  }

  const allSubs = await readCache<Submission[]>(
    STORAGE_KEYS.CACHE_SUBMISSIONS,
    SEED_SUBMISSIONS
  );
  const existingIdx = allSubs.findIndex(
    (s) => s.assignmentId === params.assignmentId && s.studentId === params.student.id
  );

  const created: Submission = {
    id: savedRow?.id || (existingIdx >= 0 ? allSubs[existingIdx].id : `sub-${Date.now()}`),
    assignmentId: params.assignmentId,
    studentId: params.student.id,
    studentName: params.student.name,
    studentNim: params.student.nimNip,
    submittedAt: savedRow?.submitted_at || new Date().toISOString(),
    files: params.files,
    text: params.text,
    notes: params.notes,
    status,
  };

  const nextSubs =
    existingIdx >= 0
      ? allSubs.map((s, i) => (i === existingIdx ? created : s))
      : [created, ...allSubs];

  await writeCache(STORAGE_KEYS.CACHE_SUBMISSIONS, nextSubs);
  await broadcastRealtimeSync({ scope: 'submission', assignmentId: params.assignmentId });
  emitLocalChange();
  return created;
}

export async function fetchSubmissionsForAssignment(
  assignmentId: string
): Promise<
  Array<{
    studentId: string;
    studentName: string;
    studentNim: string;
    submission?: Submission;
  }>
> {
  try {
    await getSupabaseUserId();
    if (isUuid(assignmentId)) {
      const [studentsRes, subsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, nim_nip')
          .eq('role', 'mahasiswa')
          .order('nim_nip', { ascending: true }),
        supabase
          .from('submissions')
          .select('*, profiles:student_id(name, nim_nip)')
          .eq('assignment_id', assignmentId),
      ]);

      if (!studentsRes.error && studentsRes.data && studentsRes.data.length > 0) {
        const subMap = new Map<string, Submission>();
        for (const s of subsRes.data || []) {
          subMap.set(s.student_id, {
            id: s.id,
            assignmentId: s.assignment_id,
            studentId: s.student_id,
            studentName: s.profiles?.name || 'Mahasiswa',
            studentNim: s.profiles?.nim_nip || '-',
            submittedAt: s.submitted_at,
            files: Array.isArray(s.files) ? s.files : [],
            text: s.text_answer || undefined,
            notes: s.notes || undefined,
            status: s.status,
            score: s.score !== null && s.score !== undefined ? Number(s.score) : undefined,
            feedback: s.feedback || undefined,
            gradedAt: s.graded_at || undefined,
          });
        }
        return studentsRes.data.map((stu: any) => ({
          studentId: stu.id,
          studentName: stu.name,
          studentNim: stu.nim_nip,
          submission: subMap.get(stu.id),
        }));
      }
    }
  } catch {
    // fallback cache
  }

  const allSubs = await readCache<Submission[]>(
    STORAGE_KEYS.CACHE_SUBMISSIONS,
    SEED_SUBMISSIONS
  );
  const students = [
    {
      studentId: '22222222-2222-2222-2222-222222222201',
      studentName: 'Rina Salsabila',
      studentNim: '22053181',
    },
    {
      studentId: '22222222-2222-2222-2222-222222222202',
      studentName: 'Ahmad Fadil',
      studentNim: '22053182',
    },
    {
      studentId: '22222222-2222-2222-2222-222222222203',
      studentName: 'Dimas Pratama',
      studentNim: '22053183',
    },
    {
      studentId: '22222222-2222-2222-2222-222222222204',
      studentName: 'Nadia Putri Lestari',
      studentNim: '22053184',
    },
  ];

  return students.map((stu) => ({
    ...stu,
    submission: allSubs.find(
      (s) => s.assignmentId === assignmentId && s.studentId === stu.studentId
    ),
  }));
}

export async function gradeStudentSubmission(params: {
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  score: number;
  feedback?: string;
  lecturer: User;
}): Promise<Submission> {
  if (params.score < 0 || params.score > 100) {
    throw new Error('Nilai harus di antara 0 hingga 100');
  }

  const allSubs = await readCache<Submission[]>(
    STORAGE_KEYS.CACHE_SUBMISSIONS,
    SEED_SUBMISSIONS
  );
  const existingIdx = allSubs.findIndex(
    (s) => s.assignmentId === params.assignmentId && s.studentId === params.studentId
  );

  const graded: Submission =
    existingIdx >= 0
      ? {
          ...allSubs[existingIdx],
          status: 'graded',
          score: params.score,
          feedback: params.feedback,
          gradedAt: new Date().toISOString(),
        }
      : {
          id: `sub-${Date.now()}`,
          assignmentId: params.assignmentId,
          studentId: params.studentId,
          studentName: params.studentName,
          studentNim: params.studentNim,
          submittedAt: new Date().toISOString(),
          status: 'graded',
          score: params.score,
          feedback: params.feedback,
          gradedAt: new Date().toISOString(),
        };

  const nextSubs =
    existingIdx >= 0
      ? allSubs.map((s, i) => (i === existingIdx ? graded : s))
      : [graded, ...allSubs];

  await writeCache(STORAGE_KEYS.CACHE_SUBMISSIONS, nextSubs);

  let updatedInDb = false;
  try {
    const uid = (await getSupabaseUserId()) || params.lecturer.id;
    const { error } = await supabase
      .from('submissions')
      .upsert(
        {
          assignment_id: params.assignmentId,
          student_id: params.studentId,
          status: 'graded',
          score: params.score,
          feedback: params.feedback || null,
          graded_by: uid,
          graded_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,student_id' }
      );
    if (!error) {
      updatedInDb = true;
    }
  } catch {
    // ignore
  }

  const assignment = await fetchAssignmentById(params.assignmentId);
  if (assignment && !updatedInDb) {
    await appendNotificationToCache(
      {
        category: 'ASSIGNMENT',
        type: 'ASSIGNMENT_GRADED',
        priority: 'normal',
        title: 'Tugas Telah Dinilai',
        body: `${assignment.title} — Nilai: ${params.score}/100`,
        deepLink: `/learning/${assignment.courseId}/assignment/${assignment.id}`,
      },
      params.studentId
    );
  }

  await broadcastRealtimeSync({ scope: 'grade', assignmentId: params.assignmentId });
  emitLocalChange();
  return graded;
}

// ============================================================================
// ROOM CHAT KELAS & MATA KULIAH
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value?: string | null): boolean {
  return Boolean(value && UUID_REGEX.test(value));
}

let isLoggingOut = false;
let pendingSessionPromise: Promise<string | null> | null = null;

async function ensureSupabaseSession(): Promise<string | null> {
  if (isLoggingOut) return null;
  try {
    const savedRaw = await secureStorage.getItem(STORAGE_KEYS.SESSION_USER);
    const savedUser: User | null = savedRaw ? (JSON.parse(savedRaw) as User) : null;

    const { data } = await supabase.auth.getSession();
    const activeUser = data?.session?.user;

    if (activeUser && (!savedUser || activeUser.id === savedUser.id)) {
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }
      return activeUser.id;
    }

    if (!savedUser) {
      return activeUser?.id || null;
    }

    if (pendingSessionPromise) {
      return await pendingSessionPromise;
    }

    pendingSessionPromise = (async () => {
      try {
        const seedAcc = SEED_USERS[savedUser.nimNip];
        const emailToUse = savedUser.email || seedAcc?.email;
        const passwordToUse = seedAcc?.password || 'ecampuz123';
        if (emailToUse) {
          const { data: signInData, error: signInErr } =
            await supabase.auth.signInWithPassword({
              email: emailToUse,
              password: passwordToUse,
            });
          if (!signInErr && signInData?.user) {
            if (signInData.session?.access_token) {
              supabase.realtime.setAuth(signInData.session.access_token);
            }
            return signInData.user.id;
          }
        }
      } catch {
        // ignore network error
      } finally {
        pendingSessionPromise = null;
      }
      return isUuid(savedUser.id) ? savedUser.id : null;
    })();

    return await pendingSessionPromise;
  } catch {
    return null;
  }
}

async function getSupabaseUserId(): Promise<string | null> {
  return ensureSupabaseSession();
}

export function getCourseChatRoomId(courseIdOrCode?: string): string {
  if (!courseIdOrCode) return '66666666-6666-6666-6666-666666666602';
  const key = courseIdOrCode.trim().toUpperCase();
  if (
    courseIdOrCode === '44444444-4444-4444-4444-444444444402' ||
    key === 'IF308'
  ) {
    return '66666666-6666-6666-6666-666666666603';
  }
  if (
    courseIdOrCode === '44444444-4444-4444-4444-444444444403' ||
    key === 'IMK201'
  ) {
    return '66666666-6666-6666-6666-666666666604';
  }
  return '66666666-6666-6666-6666-666666666602';
}

function mapChatMessageRow(row: any, adminIds?: Set<string>): ChatMessage {
  const isDeleted = Boolean(row.deleted);
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    senderName: row.profiles?.name || 'Anggota',
    senderRole: (row.profiles?.role as Role) || 'mahasiswa',
    senderIsClassLeader: Boolean(row.profiles?.is_class_leader),
    senderIsAdmin: adminIds ? adminIds.has(row.sender_id) : undefined,
    text: isDeleted ? undefined : row.text || undefined,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    replyToId: row.reply_to_id || undefined,
    mentions: Array.isArray(row.mentions) ? row.mentions : [],
    isAnnouncement: Boolean(row.is_announcement),
    deleted: isDeleted,
    createdAt: row.created_at,
    deliveryStatus: 'sent',
  };
}

function attachReplyPreviews(messages: ChatMessage[]): ChatMessage[] {
  const byId = new Map(messages.map((m) => [m.id, m]));
  return messages.map((msg) => {
    if (msg.replyToPreview || !msg.replyToId) return msg;
    const parent = byId.get(msg.replyToId);
    if (!parent) return msg;
    return {
      ...msg,
      replyToPreview: {
        senderName: parent.senderName || 'Anggota',
        text: parent.deleted ? 'Pesan dihapus' : parent.text || 'Lampiran',
      },
    };
  });
}

async function resolveMentionIds(roomId: string, mentions?: string[]): Promise<string[]> {
  if (!mentions || mentions.length === 0) return [];
  const resolved = new Set<string>();
  const textTags: string[] = [];

  for (const raw of mentions) {
    const cleaned = raw.trim();
    if (!cleaned) continue;
    if (isUuid(cleaned)) {
      resolved.add(cleaned);
    } else {
      textTags.push(cleaned.replace(/^@+/, '').trim().toLowerCase());
    }
  }

  if (textTags.length === 0) {
    return Array.from(resolved);
  }

  const { data: membersData } = await supabase
    .from('chat_room_members')
    .select('user_id, profiles:user_id(name, role, is_class_leader)')
    .eq('room_id', roomId);

  if (!membersData) {
    return Array.from(resolved);
  }

  for (const tag of textTags) {
    for (const member of membersData as any[]) {
      const profile = member.profiles;
      const nameLower = String(profile?.name || '').toLowerCase();
      if (
        (tag.startsWith('dosen') && profile?.role === 'dosen') ||
        (tag.startsWith('ketua kelas') && profile?.is_class_leader) ||
        (nameLower && (tag.startsWith(nameLower) || nameLower.includes(tag)))
      ) {
        resolved.add(member.user_id);
      }
    }
  }

  return Array.from(resolved);
}

export async function fetchChatRooms(): Promise<ChatRoom[]> {
  const currentUserId = await getSupabaseUserId();
  if (currentUserId) {
    try {
      const { data: roomsData, error: roomsErr } = await supabase
        .from('chat_rooms')
        .select('*, courses:course_id(code)')
        .order('created_at', { ascending: true });

      if (!roomsErr && roomsData) {
        if (roomsData.length === 0) {
          await writeCache(STORAGE_KEYS.CACHE_ROOMS, []);
          return [];
        }

        const roomIds = roomsData.map((r: any) => r.id);
        const [membersRes, messagesRes] = await Promise.all([
          supabase
            .from('chat_room_members')
            .select(
              'room_id, user_id, is_admin, muted_until, last_read_at, profiles:user_id(name, nim_nip, role, is_class_leader, avatar_url)'
            )
            .in('room_id', roomIds),
          supabase
            .from('chat_messages')
            .select('*, profiles:sender_id(name, role, is_class_leader)')
            .in('room_id', roomIds)
            .order('created_at', { ascending: true }),
        ]);

        const membersByRoom = new Map<string, any[]>();
        for (const row of membersRes.data || []) {
          const list = membersByRoom.get(row.room_id) || [];
          list.push(row);
          membersByRoom.set(row.room_id, list);
        }

        const rawMsgsByRoom = new Map<string, any[]>();
        for (const row of messagesRes.data || []) {
          const list = rawMsgsByRoom.get(row.room_id) || [];
          list.push(row);
          rawMsgsByRoom.set(row.room_id, list);
        }

        const nextMessagesCache: Record<string, ChatMessage[]> = {};
        const nowMs = Date.now();

        const mappedRooms: ChatRoom[] = roomsData.map((room: any) => {
          const memberRows = membersByRoom.get(room.id) || [];
          const adminIds = memberRows.filter((m) => m.is_admin).map((m) => m.user_id);
          const adminSet = new Set(adminIds);
          const memberIds = memberRows.map((m) => m.user_id);

          const members: ChatRoomMemberInfo[] = memberRows.map((m) => ({
            userId: m.user_id,
            name: m.profiles?.name || 'Anggota',
            nimNip: m.profiles?.nim_nip || '-',
            role: (m.profiles?.role as Role) || 'mahasiswa',
            isClassLeader: Boolean(m.profiles?.is_class_leader),
            isAdmin: Boolean(m.is_admin),
            avatarUrl: m.profiles?.avatar_url || undefined,
          }));

          const lecturer = members.find((m) => m.role === 'dosen');
          const selfMember = memberRows.find((m) => m.user_id === currentUserId);

          const msgs = attachReplyPreviews(
            (rawMsgsByRoom.get(room.id) || []).map((row) => mapChatMessageRow(row, adminSet))
          );
          nextMessagesCache[room.id] = msgs;

          const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
          const pinnedMessage = room.pinned_message_id
            ? msgs.find((m) => m.id === room.pinned_message_id)
            : undefined;

          const lastReadMs = selfMember?.last_read_at
            ? new Date(selfMember.last_read_at).getTime()
            : nowMs;

          const unreadMsgs = msgs.filter(
            (m) =>
              !m.deleted &&
              m.senderId !== currentUserId &&
              new Date(m.createdAt).getTime() > lastReadMs
          );

          const rawMuted = selfMember?.muted_until || null;
          const isMuteActive =
            rawMuted && (String(rawMuted).startsWith('2099') || new Date(rawMuted).getTime() > nowMs);

          return {
            id: room.id,
            type: room.type,
            name: room.name,
            description: room.description || undefined,
            refId: room.course_id || room.class_id || room.id,
            adminIds,
            memberIds,
            pinnedMessageId: room.pinned_message_id || undefined,
            pinnedMessage,
            lastMessage,
            unreadCount: unreadMsgs.length,
            mutedUntil: isMuteActive ? rawMuted : null,
            hasNewAnnouncement: unreadMsgs.some((m) => m.isAnnouncement),
            courseCode: room.courses?.code || undefined,
            lecturerName: lecturer?.name || undefined,
            members,
          };
        });

        await Promise.all([
          writeCache(STORAGE_KEYS.CACHE_ROOMS, mappedRooms),
          writeCache(STORAGE_KEYS.CACHE_MESSAGES, nextMessagesCache),
        ]);
        return mappedRooms;
      }
    } catch {
      // Fallback ke cache lokal saat offline
    }
  }

  const rooms = await readCache<ChatRoom[]>(STORAGE_KEYS.CACHE_ROOMS, SEED_CHAT_ROOMS);
  const messagesMap = await readCache<Record<string, ChatMessage[]>>(
    STORAGE_KEYS.CACHE_MESSAGES,
    SEED_CHAT_MESSAGES
  );

  return rooms.map((room) => {
    const msgs = messagesMap[room.id] || [];
    const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
    const pinnedMessage = room.pinnedMessageId
      ? msgs.find((m) => m.id === room.pinnedMessageId)
      : undefined;
    return {
      ...room,
      lastMessage,
      pinnedMessage,
    };
  });
}

export async function fetchChatRoomById(roomId: string): Promise<ChatRoom | null> {
  const rooms = await fetchChatRooms();
  return rooms.find((r) => r.id === roomId || r.refId === roomId) || null;
}

export async function markChatRoomRead(roomId: string): Promise<void> {
  const currentUserId = await getSupabaseUserId();
  if (currentUserId && isUuid(roomId)) {
    const { error } = await supabase
      .from('chat_room_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', currentUserId);
    if (error) {
      throw new Error(error.message || 'Gagal menandai room sudah dibaca');
    }
  }

  const rooms = await readCache<ChatRoom[]>(STORAGE_KEYS.CACHE_ROOMS, SEED_CHAT_ROOMS);
  const updated = rooms.map((r) =>
    r.id === roomId ? { ...r, unreadCount: 0, hasNewAnnouncement: false } : r
  );
  await writeCache(STORAGE_KEYS.CACHE_ROOMS, updated);
  emitLocalChange();
}

export async function fetchChatMessages(roomId: string): Promise<ChatMessage[]> {
  const currentUserId = await getSupabaseUserId();
  if (currentUserId && isUuid(roomId)) {
    try {
      const [messagesRes, adminsRes] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('*, profiles:sender_id(name, role, is_class_leader)')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true }),
        supabase
          .from('chat_room_members')
          .select('user_id')
          .eq('room_id', roomId)
          .eq('is_admin', true),
      ]);

      if (!messagesRes.error && messagesRes.data) {
        const adminSet = new Set((adminsRes.data || []).map((a: any) => a.user_id));
        const mapped = attachReplyPreviews(
          messagesRes.data.map((row: any) => mapChatMessageRow(row, adminSet))
        );
        const messagesMap = await readCache<Record<string, ChatMessage[]>>(
          STORAGE_KEYS.CACHE_MESSAGES,
          SEED_CHAT_MESSAGES
        );
        messagesMap[roomId] = mapped;
        await writeCache(STORAGE_KEYS.CACHE_MESSAGES, messagesMap);
        return mapped;
      }
    } catch {
      // Fallback ke cache lokal
    }
  }

  const messagesMap = await readCache<Record<string, ChatMessage[]>>(
    STORAGE_KEYS.CACHE_MESSAGES,
    SEED_CHAT_MESSAGES
  );
  return messagesMap[roomId] || [];
}

export async function sendChatMessage(params: {
  roomId: string;
  sender: User;
  text?: string;
  attachments?: string[];
  replyToMessage?: ChatMessage | null;
  mentions?: string[];
  isAnnouncement?: boolean;
}): Promise<ChatMessage> {
  const messagesMap = await readCache<Record<string, ChatMessage[]>>(
    STORAGE_KEYS.CACHE_MESSAGES,
    SEED_CHAT_MESSAGES
  );
  const currentList = messagesMap[params.roomId] || [];
  const currentUserId = await getSupabaseUserId();

  if (currentUserId && isUuid(params.roomId)) {
    const [mentionIds, replyToId] = await Promise.all([
      resolveMentionIds(params.roomId, params.mentions),
      Promise.resolve(isUuid(params.replyToMessage?.id) ? params.replyToMessage!.id : null),
    ]);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: params.roomId,
        sender_id: currentUserId,
        text: params.text || null,
        attachments: params.attachments || [],
        reply_to_id: replyToId,
        mentions: mentionIds,
        is_announcement: Boolean(params.isAnnouncement),
      })
      .select('*, profiles:sender_id(name, role, is_class_leader)')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Gagal mengirim pesan ke server');
    }

    const created = mapChatMessageRow(data);
    if (params.replyToMessage) {
      created.replyToPreview = {
        senderName: params.replyToMessage.senderName || 'Anggota',
        text: params.replyToMessage.text || 'Lampiran',
      };
    }

    messagesMap[params.roomId] = [...currentList, created];
    await writeCache(STORAGE_KEYS.CACHE_MESSAGES, messagesMap);
    await broadcastRealtimeSync({
      scope: 'chat_message',
      roomId: params.roomId,
      messageId: created.id,
    });
    emitLocalChange();
    return created;
  }

  const created: ChatMessage = {
    id: `msg-${Date.now()}`,
    roomId: params.roomId,
    senderId: params.sender.id,
    senderName: params.sender.name,
    senderRole: params.sender.role,
    senderIsClassLeader: params.sender.isClassLeader,
    text: params.text,
    attachments: params.attachments || [],
    replyToId: params.replyToMessage?.id,
    replyToPreview: params.replyToMessage
      ? {
          senderName: params.replyToMessage.senderName || 'Anggota',
          text: params.replyToMessage.text || 'Lampiran',
        }
      : undefined,
    mentions: params.mentions || [],
    isAnnouncement: Boolean(params.isAnnouncement),
    createdAt: new Date().toISOString(),
    deliveryStatus: 'sent',
  };

  messagesMap[params.roomId] = [...currentList, created];
  await writeCache(STORAGE_KEYS.CACHE_MESSAGES, messagesMap);

  const rooms = await readCache<ChatRoom[]>(STORAGE_KEYS.CACHE_ROOMS, SEED_CHAT_ROOMS);
  const room = rooms.find((r) => r.id === params.roomId);

  if (params.isAnnouncement && room) {
    await appendNotificationToCache(
      {
        category: 'CHAT',
        type: 'CHAT_ANNOUNCEMENT',
        priority: 'high',
        title: `Pengumuman di ${room.name}`,
        body: `${params.sender.name}: ${params.text || 'Lampiran pengumuman baru'}`,
        deepLink: `/chat/${params.roomId}`,
      },
      params.sender.id
    );
  } else if (
    (params.text && params.text.includes('@')) ||
    (params.mentions && params.mentions.length > 0)
  ) {
    // Mention tetap memicu notifikasi walau room di-mute
    await appendNotificationToCache(
      {
        category: 'CHAT',
        type: 'CHAT_MENTION',
        priority: 'normal',
        title: `Anda disebut di ${room?.name || 'Room Chat'}`,
        body: `${params.sender.name}: ${params.text || ''}`,
        deepLink: `/chat/${params.roomId}`,
      },
      params.sender.id
    );
  }

  await broadcastRealtimeSync({ scope: 'chat_message', roomId: params.roomId });
  emitLocalChange();
  return created;
}

export async function togglePinMessage(roomId: string, messageId: string): Promise<void> {
  const currentUserId = await getSupabaseUserId();
  const rooms = await readCache<ChatRoom[]>(STORAGE_KEYS.CACHE_ROOMS, SEED_CHAT_ROOMS);
  const currentRoom = rooms.find((r) => r.id === roomId);
  let nextPin: string | null = currentRoom?.pinnedMessageId === messageId ? null : messageId;

  if (currentUserId && isUuid(roomId)) {
    const { data: roomRow, error: fetchErr } = await supabase
      .from('chat_rooms')
      .select('pinned_message_id')
      .eq('id', roomId)
      .single();

    if (fetchErr) {
      throw new Error(fetchErr.message || 'Gagal membaca status pin room');
    }

    nextPin = roomRow?.pinned_message_id === messageId ? null : messageId;
    if (nextPin !== null && !isUuid(nextPin)) {
      throw new Error('Pesan ini belum tersinkron dengan server untuk disematkan');
    }

    const { error } = await supabase
      .from('chat_rooms')
      .update({ pinned_message_id: nextPin })
      .eq('id', roomId);

    if (error) {
      throw new Error(error.message || 'Gagal memperbarui pesan tersemat');
    }
  }

  const updated = rooms.map((r) =>
    r.id === roomId ? { ...r, pinnedMessageId: nextPin || undefined } : r
  );
  await writeCache(STORAGE_KEYS.CACHE_ROOMS, updated);
  await broadcastRealtimeSync({ scope: 'chat_pin', roomId, messageId });
  emitLocalChange();
}

export async function toggleMessageAnnouncement(
  roomId: string,
  messageId: string,
  actor: User
): Promise<void> {
  const currentUserId = await getSupabaseUserId();
  const messagesMap = await readCache<Record<string, ChatMessage[]>>(
    STORAGE_KEYS.CACHE_MESSAGES,
    SEED_CHAT_MESSAGES
  );
  const list = messagesMap[roomId] || [];
  let targetMsg: ChatMessage | undefined;

  if (currentUserId && isUuid(roomId) && isUuid(messageId)) {
    const { data: msgRow, error: fetchErr } = await supabase
      .from('chat_messages')
      .select('is_announcement')
      .eq('id', messageId)
      .single();

    if (fetchErr) {
      throw new Error(fetchErr.message || 'Gagal membaca status pengumuman');
    }

    const nextIsAnnouncement = !msgRow?.is_announcement;
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_announcement: nextIsAnnouncement })
      .eq('id', messageId);

    if (error) {
      throw new Error(error.message || 'Gagal memperbarui status pengumuman');
    }

    messagesMap[roomId] = list.map((m) =>
      m.id === messageId ? { ...m, isAnnouncement: nextIsAnnouncement } : m
    );
    await writeCache(STORAGE_KEYS.CACHE_MESSAGES, messagesMap);
    await broadcastRealtimeSync({ scope: 'chat_announcement', roomId, messageId });
    emitLocalChange();
    return;
  }

  messagesMap[roomId] = list.map((m) => {
    if (m.id === messageId) {
      targetMsg = { ...m, isAnnouncement: !m.isAnnouncement };
      return targetMsg;
    }
    return m;
  });
  await writeCache(STORAGE_KEYS.CACHE_MESSAGES, messagesMap);

  if (targetMsg?.isAnnouncement) {
    const room = await fetchChatRoomById(roomId);
    await appendNotificationToCache(
      {
        category: 'CHAT',
        type: 'CHAT_ANNOUNCEMENT',
        priority: 'high',
        title: `Pengumuman di ${room?.name || 'Room Chat'}`,
        body: `${targetMsg.senderName || actor.name}: ${targetMsg.text || ''}`,
        deepLink: `/chat/${roomId}`,
      },
      actor.id
    );
  }
  await broadcastRealtimeSync({ scope: 'chat_announcement', roomId, messageId });
  emitLocalChange();
}

export async function deleteMessageByAdmin(
  roomId: string,
  messageId: string
): Promise<void> {
  const currentUserId = await getSupabaseUserId();
  if (currentUserId && isUuid(messageId)) {
    const { error } = await supabase
      .from('chat_messages')
      .update({ deleted: true })
      .eq('id', messageId);
    if (error) {
      throw new Error(error.message || 'Gagal menghapus pesan');
    }
  }

  const messagesMap = await readCache<Record<string, ChatMessage[]>>(
    STORAGE_KEYS.CACHE_MESSAGES,
    SEED_CHAT_MESSAGES
  );
  const list = messagesMap[roomId] || [];
  messagesMap[roomId] = list.map((m) =>
    m.id === messageId ? { ...m, deleted: true, text: undefined } : m
  );
  await writeCache(STORAGE_KEYS.CACHE_MESSAGES, messagesMap);
  await broadcastRealtimeSync({ scope: 'chat_delete', roomId, messageId });
  emitLocalChange();
}

export async function reportChatMessage(
  roomId: string,
  messageId: string,
  reason: string,
  reporterId: string
): Promise<void> {
  const currentUserId = await getSupabaseUserId();
  if (currentUserId && isUuid(roomId) && isUuid(messageId)) {
    const { error } = await supabase.from('chat_reports').insert({
      room_id: roomId,
      message_id: messageId,
      reported_by: currentUserId || reporterId,
      reason,
    });
    if (error) {
      throw new Error(error.message || 'Gagal mengirim laporan pesan');
    }
  }
}

export async function setRoomMuteDuration(
  roomId: string,
  duration: 'off' | '8h' | '1w' | 'always',
  userId?: string
): Promise<string | null> {
  let mutedUntil: string | null = null;
  const now = new Date();
  if (duration === '8h') {
    mutedUntil = new Date(now.getTime() + 8 * 3600 * 1000).toISOString();
  } else if (duration === '1w') {
    mutedUntil = new Date(now.getTime() + 7 * 86400 * 1000).toISOString();
  } else if (duration === 'always') {
    mutedUntil = '2099-12-31T23:59:59.000Z';
  }

  const currentUserId = await getSupabaseUserId();
  const targetUserId = currentUserId || userId;
  if (currentUserId && targetUserId && isUuid(roomId)) {
    const { error } = await supabase
      .from('chat_room_members')
      .update({ muted_until: mutedUntil })
      .eq('room_id', roomId)
      .eq('user_id', targetUserId);
    if (error) {
      throw new Error(error.message || 'Gagal memperbarui pengaturan bisu room');
    }
  }

  const rooms = await readCache<ChatRoom[]>(STORAGE_KEYS.CACHE_ROOMS, SEED_CHAT_ROOMS);
  const next = rooms.map((r) => (r.id === roomId ? { ...r, mutedUntil } : r));
  await writeCache(STORAGE_KEYS.CACHE_ROOMS, next);
  emitLocalChange();
  return mutedUntil;
}

// ============================================================================
// KEUANGAN / UKT
// ============================================================================

export async function fetchBills(studentId?: string): Promise<Bill[]> {
  try {
    const targetStudentId = studentId || (await getSupabaseUserId());
    if (targetStudentId) {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('due_date', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Bill[] = data.map((row) => ({
          id: row.id,
          semester: row.semester,
          amount: Number(row.amount),
          dueDate: row.due_date,
          status: row.status,
          vaNumber: row.va_number,
          bankName: row.bank_name,
          components: row.components || [],
          invoiceCode: row.invoice_code || undefined,
          receiptUrl: row.receipt_url || undefined,
          paidAt: row.paid_at || undefined,
        }));
        await writeCache(STORAGE_KEYS.CACHE_BILLS, mapped);
        return mapped;
      }
    }
  } catch {
    // fallback
  }
  return readCache<Bill[]>(STORAGE_KEYS.CACHE_BILLS, SEED_BILLS);
}

export async function fetchBillById(billId: string): Promise<Bill | null> {
  const list = await fetchBills();
  return list.find((b) => b.id === billId) || list[0] || null;
}

// ============================================================================
// LAYANAN BANTUAN, FAQ & TIKET PENGADUAN
// ============================================================================

export async function fetchFaqs(): Promise<FAQItem[]> {
  try {
    const { data, error } = await supabase.from('faqs').select('*');
    if (!error && data && data.length > 0) {
      const mapped: FAQItem[] = data.map((row) => ({
        id: row.id,
        category: row.category,
        question: row.question,
        summary: row.summary,
        steps: row.steps || [],
        attachments: row.attachments || [],
        warningNote: row.warning_note || undefined,
        isPopular: row.is_popular,
        updatedAt: row.updated_at,
      }));
      await writeCache(STORAGE_KEYS.CACHE_FAQS, mapped);
      return mapped;
    }
  } catch {
    // fallback
  }
  return readCache<FAQItem[]>(STORAGE_KEYS.CACHE_FAQS, SEED_FAQS);
}

export async function fetchFaqById(faqId: string): Promise<FAQItem | null> {
  const list = await fetchFaqs();
  return list.find((f) => f.id === faqId) || null;
}

export async function fetchTickets(): Promise<Ticket[]> {
  try {
    const currentUserId = await getSupabaseUserId();
    if (currentUserId) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, courses:course_id(name), profiles:user_id(name, nim_nip), ticket_messages(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Ticket[] = data.map((row: any) => {
          const isAnon = Boolean(row.anonymous);
          const rawMsgs = Array.isArray(row.ticket_messages) ? row.ticket_messages : [];
          const sortedMsgs = [...rawMsgs]
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            .map((m: any) => ({
              id: m.id,
              ticketId: m.ticket_id,
              senderRole: m.sender_role as 'student' | 'staff',
              senderLabel: m.sender_label,
              message: m.message,
              attachments: Array.isArray(m.attachments) ? m.attachments : [],
              createdAt: m.created_at,
            }));

          return {
            id: row.id,
            code: row.code,
            kind: row.kind,
            category: row.category,
            courseId: row.course_id || undefined,
            courseName: row.courses?.name || undefined,
            title: row.title,
            description: row.description,
            attachments: Array.isArray(row.attachments) ? row.attachments : [],
            anonymous: isAnon,
            status: row.status,
            reporterName: isAnon ? undefined : row.profiles?.name || 'Mahasiswa',
            reporterNim: isAnon ? undefined : row.profiles?.nim_nip || row.guest_nim_nip || undefined,
            createdAt: row.created_at,
            history: Array.isArray(row.history) ? row.history : [],
            messages: sortedMsgs,
            rating: row.rating ? Number(row.rating) : undefined,
            ratingComment: row.rating_comment || undefined,
          };
        });
        await writeCache(STORAGE_KEYS.CACHE_TICKETS, mapped);
        return mapped;
      }
    }
  } catch {
    // fallback cache
  }

  const list = await readCache<Ticket[]>(STORAGE_KEYS.CACHE_TICKETS, SEED_TICKETS);
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function fetchTicketById(ticketId: string): Promise<Ticket | null> {
  const list = await fetchTickets();
  return list.find((t) => t.id === ticketId) || null;
}

export async function createSupportTicket(params: {
  kind: 'bantuan' | 'pengaduan';
  category: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description: string;
  attachments: string[];
  anonymous: boolean;
  user?: User | null;
  guestNimNip?: string;
}): Promise<Ticket> {
  const canBeAnonymous =
    params.kind === 'pengaduan' &&
    (params.category === 'Fasilitas' || params.category === 'Lainnya');
  const isAnon = canBeAnonymous ? params.anonymous : false;

  const list = await fetchTickets();
  const nextNumber = String(125 + list.length).padStart(5, '0');
  const code = `TKT-2026-${nextNumber}-${String(Date.now()).slice(-3)}`;
  const nowIso = new Date().toISOString();

  const initialHistory = [
    {
      status: 'submitted' as TicketStatus,
      at: nowIso,
      note: isAnon
        ? 'Tiket pengaduan anonim diterima oleh sistem.'
        : 'Tiket berhasil dikirim ke unit layanan akademik.',
    },
  ];

  let insertedTicket: any = null;
  let insertedMsg: any = null;
  try {
    const uid = params.user ? (await getSupabaseUserId()) || params.user.id : null;
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        code,
        user_id: uid,
        guest_nim_nip: params.guestNimNip || null,
        kind: params.kind,
        category: params.category,
        course_id: isUuid(params.courseId) ? params.courseId : null,
        title: params.title,
        description: params.description,
        attachments: params.attachments.slice(0, 3),
        anonymous: isAnon,
        status: 'submitted',
        history: initialHistory,
      })
      .select('*')
      .single();

    if (!error && data) {
      insertedTicket = data;
      const msgRes = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: data.id,
          sender_id: uid,
          sender_role: 'student',
          sender_label: isAnon ? 'Pelapor Anonim' : params.user?.name || 'Mahasiswa',
          message: params.description,
          attachments: params.attachments.slice(0, 3),
        })
        .select('*')
        .single();
      if (!msgRes.error && msgRes.data) {
        insertedMsg = msgRes.data;
      }
    }
  } catch {
    // fallback cache
  }

  const ticketId = insertedTicket?.id || `tkt-${Date.now()}`;
  const created: Ticket = {
    id: ticketId,
    code: insertedTicket?.code || code,
    kind: params.kind,
    category: params.category,
    courseId: params.courseId,
    courseName: params.courseName,
    title: params.title,
    description: params.description,
    attachments: params.attachments.slice(0, 3),
    anonymous: isAnon,
    status: 'submitted',
    reporterName: isAnon ? undefined : params.user?.name || 'Mahasiswa',
    reporterNim: isAnon ? undefined : params.user?.nimNip || params.guestNimNip,
    createdAt: insertedTicket?.created_at || nowIso,
    history: initialHistory,
    messages: [
      {
        id: insertedMsg?.id || `tmsg-${Date.now()}`,
        ticketId,
        senderRole: 'student',
        senderLabel: isAnon ? 'Pelapor Anonim' : params.user?.name || 'Mahasiswa',
        message: params.description,
        attachments: params.attachments.slice(0, 3),
        createdAt: insertedMsg?.created_at || nowIso,
      },
    ],
  };

  await writeCache(STORAGE_KEYS.CACHE_TICKETS, [created, ...list]);
  await broadcastRealtimeSync({ scope: 'ticket', ticketId });
  emitLocalChange();
  return created;
}

export async function addTicketReply(params: {
  ticketId: string;
  message: string;
  attachments?: string[];
  sender?: User | null;
}): Promise<Ticket> {
  const list = await fetchTickets();
  const target = list.find((t) => t.id === params.ticketId);
  if (!target) {
    throw new Error('Tiket tidak ditemukan');
  }
  if (target.status === 'closed') {
    throw new Error('Tiket sudah ditutup');
  }

  const nowIso = new Date().toISOString();
  const nextStatus: TicketStatus =
    target.status === 'need_info' ? 'in_progress' : target.status;

  const senderLabel = target.anonymous
    ? 'Pelapor Anonim'
    : params.sender?.name || 'Mahasiswa';

  const nextHistory =
    target.status === 'need_info'
      ? [
          ...target.history,
          {
            status: 'in_progress' as TicketStatus,
            at: nowIso,
            note: 'Mahasiswa mengirimkan informasi tambahan.',
          },
        ]
      : target.history;

  let insertedMsg: any = null;
  try {
    const uid = (await getSupabaseUserId()) || params.sender?.id || null;
    if (isUuid(target.id)) {
      const msgRes = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: target.id,
          sender_id: uid,
          sender_role: 'student',
          sender_label: senderLabel,
          message: params.message,
          attachments: params.attachments || [],
        })
        .select('*')
        .single();
      if (!msgRes.error && msgRes.data) {
        insertedMsg = msgRes.data;
      }
      if (nextStatus !== target.status) {
        await supabase
          .from('tickets')
          .update({ status: nextStatus, history: nextHistory })
          .eq('id', target.id);
      }
    }
  } catch {
    // fallback cache
  }

  const newMsg = {
    id: insertedMsg?.id || `tmsg-${Date.now()}`,
    ticketId: target.id,
    senderRole: 'student' as const,
    senderLabel,
    message: params.message,
    attachments: params.attachments || [],
    createdAt: insertedMsg?.created_at || nowIso,
  };

  const updated: Ticket = {
    ...target,
    status: nextStatus,
    history: nextHistory,
    messages: [...(target.messages || []), newMsg],
  };

  await writeCache(
    STORAGE_KEYS.CACHE_TICKETS,
    list.map((t) => (t.id === params.ticketId ? updated : t))
  );

  if (nextStatus !== target.status && !insertedMsg) {
    await appendNotificationToCache(
      {
        category: 'SUPPORT',
        type: 'TICKET_STATUS_CHANGED',
        priority: 'normal',
        title: `Status Tiket ${target.code} Diperbarui`,
        body: `Status tiket "${target.title}" berubah menjadi Diproses.`,
        deepLink: `/support/ticket/${target.id}`,
      },
      params.sender?.id
    );
  }

  await broadcastRealtimeSync({ scope: 'ticket_reply', ticketId: target.id });
  emitLocalChange();
  return updated;
}

export async function updateTicketStatus(params: {
  ticketId: string;
  nextStatus: TicketStatus;
  note?: string;
  userId?: string;
}): Promise<Ticket> {
  const list = await fetchTickets();
  const target = list.find((t) => t.id === params.ticketId);
  if (!target) {
    throw new Error('Tiket tidak ditemukan');
  }

  const statusLabels: Record<TicketStatus, string> = {
    submitted: 'Terkirim',
    in_progress: 'Diproses',
    need_info: 'Butuh Info Tambahan',
    resolved: 'Selesai',
    closed: 'Ditutup',
  };

  const nowIso = new Date().toISOString();
  const updated: Ticket = {
    ...target,
    status: params.nextStatus,
    history: [
      ...target.history,
      {
        status: params.nextStatus,
        at: nowIso,
        note: params.note || `Status tiket diperbarui menjadi ${statusLabels[params.nextStatus]}.`,
      },
    ],
  };

  await writeCache(
    STORAGE_KEYS.CACHE_TICKETS,
    list.map((t) => (t.id === params.ticketId ? updated : t))
  );

  let updatedInDb = false;
  try {
    await getSupabaseUserId();
    if (isUuid(params.ticketId)) {
      const { error } = await supabase
        .from('tickets')
        .update({ status: params.nextStatus, history: updated.history })
        .eq('id', params.ticketId);
      if (!error) {
        updatedInDb = true;
      }
    }
  } catch {
    // ignore
  }

  if (!updatedInDb) {
    await appendNotificationToCache(
      {
        category: 'SUPPORT',
        type: 'TICKET_STATUS_CHANGED',
        priority: 'normal',
        title: `Status Tiket ${target.code} Diperbarui`,
        body: `${target.title} → ${statusLabels[params.nextStatus]}`,
        deepLink: `/support/ticket/${target.id}`,
      },
      params.userId
    );
  }

  await broadcastRealtimeSync({ scope: 'ticket_status', ticketId: params.ticketId });
  emitLocalChange();
  return updated;
}

export async function submitTicketRating(params: {
  ticketId: string;
  rating: number;
  comment?: string;
  userId?: string;
}): Promise<Ticket> {
  const list = await fetchTickets();
  const target = list.find((t) => t.id === params.ticketId);
  if (!target) {
    throw new Error('Tiket tidak ditemukan');
  }

  const nowIso = new Date().toISOString();
  const updated: Ticket = {
    ...target,
    rating: params.rating,
    ratingComment: params.comment,
    status: 'closed',
    history: [
      ...target.history,
      {
        status: 'closed',
        at: nowIso,
        note: `Mahasiswa memberikan penilaian ${params.rating}/5 bintang. Tiket ditutup.`,
      },
    ],
  };

  await writeCache(
    STORAGE_KEYS.CACHE_TICKETS,
    list.map((t) => (t.id === params.ticketId ? updated : t))
  );

  let updatedInDb = false;
  try {
    await getSupabaseUserId();
    if (isUuid(params.ticketId)) {
      const { error } = await supabase
        .from('tickets')
        .update({
          rating: params.rating,
          rating_comment: params.comment || null,
          status: 'closed',
          history: updated.history,
        })
        .eq('id', params.ticketId);
      if (!error) {
        updatedInDb = true;
      }
    }
  } catch {
    // ignore
  }

  if (!updatedInDb) {
    await appendNotificationToCache(
      {
        category: 'SUPPORT',
        type: 'TICKET_STATUS_CHANGED',
        priority: 'normal',
        title: `Tiket ${target.code} Ditutup`,
        body: `Terima kasih atas penilaian layanan (${params.rating}/5) untuk tiket "${target.title}".`,
        deepLink: `/support/ticket/${target.id}`,
      },
      params.userId
    );
  }

  await broadcastRealtimeSync({ scope: 'ticket_rating', ticketId: params.ticketId });
  emitLocalChange();
  return updated;
}

export async function fetchCampusAnnouncements(): Promise<CampusAnnouncement[]> {
  try {
    await getSupabaseUserId();
    const { data, error } = await supabase
      .from('campus_announcements')
      .select('*')
      .order('published_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        category: r.category,
        publishedAt: r.published_at,
      }));
    }
  } catch {
    // fallback
  }
  return SEED_ANNOUNCEMENTS;
}
