import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

const sessionStorage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

let client;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Authentication is not configured. Set the public Supabase URL and publishable key.');
  }

  if (!client) {
    let url;

    try {
      url = new URL(supabaseUrl);
    } catch {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.');
    }

    if (!['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.search
      || url.hash) {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL must be an HTTP or HTTPS URL without credentials, query, or fragment.');
    }

    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: sessionStorage,
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }

  return client;
}

export async function getAccessToken() {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw new Error('Unable to read the current authentication session.');
  }

  return data.session?.access_token || null;
}
