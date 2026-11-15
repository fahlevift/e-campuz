import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

function getWebSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        const webStore = getWebSessionStorage();
        if (webStore) {
          return webStore.getItem(key);
        }
        return await AsyncStorage.getItem(key);
      }
      const asyncVal = await AsyncStorage.getItem(key);
      if (asyncVal !== null) {
        return asyncVal;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return await AsyncStorage.getItem(key).catch(() => null);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        const webStore = getWebSessionStorage();
        if (webStore) {
          webStore.setItem(key, value);
          return;
        }
        await AsyncStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
      if (value.length < 1800) {
        await SecureStore.setItemAsync(key, value).catch(() => {});
      }
    } catch {
      await AsyncStorage.setItem(key, value).catch(() => {});
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        const webStore = getWebSessionStorage();
        if (webStore) {
          webStore.removeItem(key);
          return;
        }
        await AsyncStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key).catch(() => {});
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch {
      await AsyncStorage.removeItem(key).catch(() => {});
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY belum diatur di file .env.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

export const secureStorage = ExpoSecureStoreAdapter;
