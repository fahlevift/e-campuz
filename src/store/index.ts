import { create } from 'zustand';
import {
  User,
  NavItemKey,
  NotificationPreferences,
  NotifCategory,
} from '@/types';

export const DEFAULT_NAV_SLOTS: [NavItemKey, NavItemKey, NavItemKey] = [
  'jadwal',
  'pembelajaran',
  'chat',
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  categories: {
    SCHEDULE: {
      enabled: true,
      types: {
        SCHEDULE_CHANGED: true,
        ROOM_CHANGED: true,
        CLASS_CANCELLED: true,
        CLASS_REMINDER: true,
      },
    },
    ASSIGNMENT: {
      enabled: true,
      types: {
        ASSIGNMENT_NEW: true,
        ASSIGNMENT_DUE_REMINDER: true,
        ASSIGNMENT_GRADED: true,
      },
    },
    FINANCE: {
      enabled: true,
      types: {
        UKT_BILL_ISSUED: true,
        UKT_DUE_REMINDER: true,
        UKT_OVERDUE: true,
        UKT_PAID: true,
      },
    },
    LEARNING: {
      enabled: true,
      types: {
        MATERIAL_UPLOADED: true,
      },
    },
    CHAT: {
      enabled: true,
      types: {
        CHAT_MENTION: true,
        CHAT_ANNOUNCEMENT: true,
        CHAT_ALL: false,
      },
    },
    SUPPORT: {
      enabled: true,
      types: {
        TICKET_STATUS_CHANGED: true,
        TICKET_REPLIED: true,
      },
    },
    ANNOUNCEMENT: {
      enabled: true,
      types: {
        CAMPUS_ANNOUNCEMENT: true,
      },
    },
  },
  classReminderMinutes: 30,
  assignmentReminders: ['H-1', '6h'],
  mutedCourseIdsForMaterial: [],
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
    allowUrgent: true,
  },
};

interface AppStoreState {
  user: User | null;
  isHydrated: boolean;
  hasSeenNotifOnboarding: boolean;
  isOffline: boolean;
  toastMessage: string | null;
  navSlots: [NavItemKey, NavItemKey, NavItemKey];
  notifPrefs: NotificationPreferences;
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  setHasSeenNotifOnboarding: (seen: boolean) => void;
  setOffline: (offline: boolean) => void;
  showToast: (msg: string) => void;
  setNavSlots: (slots: [NavItemKey, NavItemKey, NavItemKey]) => void;
  resetNavSlots: () => void;
  setNotifPrefs: (prefs: NotificationPreferences) => void;
  updateCategoryEnabled: (cat: NotifCategory, enabled: boolean) => void;
  updateTypeEnabled: (cat: NotifCategory, typeKey: string, enabled: boolean) => void;
  resetNotifPrefs: () => void;
  clearSession: () => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  user: null,
  isHydrated: false,
  hasSeenNotifOnboarding: false,
  isOffline: false,
  toastMessage: null,
  navSlots: DEFAULT_NAV_SLOTS,
  notifPrefs: DEFAULT_NOTIFICATION_PREFERENCES,
  setUser: (user) => set({ user }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  setHasSeenNotifOnboarding: (hasSeenNotifOnboarding) => set({ hasSeenNotifOnboarding }),
  setOffline: (isOffline) => set({ isOffline }),
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      set((state) => (state.toastMessage === msg ? { toastMessage: null } : state));
    }, 2600);
  },
  setNavSlots: (navSlots) => set({ navSlots }),
  resetNavSlots: () => set({ navSlots: DEFAULT_NAV_SLOTS }),
  setNotifPrefs: (notifPrefs) => set({ notifPrefs }),
  updateCategoryEnabled: (cat, enabled) =>
    set((state) => ({
      notifPrefs: {
        ...state.notifPrefs,
        categories: {
          ...state.notifPrefs.categories,
          [cat]: {
            ...state.notifPrefs.categories[cat],
            enabled,
          },
        },
      },
    })),
  updateTypeEnabled: (cat, typeKey, enabled) =>
    set((state) => ({
      notifPrefs: {
        ...state.notifPrefs,
        categories: {
          ...state.notifPrefs.categories,
          [cat]: {
            ...state.notifPrefs.categories[cat],
            types: {
              ...state.notifPrefs.categories[cat].types,
              [typeKey]: enabled,
            },
          },
        },
      },
    })),
  resetNotifPrefs: () => set({ notifPrefs: DEFAULT_NOTIFICATION_PREFERENCES }),
  clearSession: () =>
    set({
      user: null,
    }),
}));
