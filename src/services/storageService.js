import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseClient } from './supabaseClient';
import { exchangeAuthCallbackCode } from './authCallback';

let oauthBrowserInProgress = false;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  WebBrowser.maybeCompleteAuthSession();
}

export async function getCurrentUser() {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw new Error('Unable to read the current authentication session.');
  }

  return data.session?.user || null;
}

export async function signIn({ email, password }) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message || 'Sign-in failed.');
  return data.user;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(error.message || 'Sign-out failed.');
}

export async function requestPasswordReset(email) {
  const redirectTo = Linking.createURL('auth', {
    queryParams: { type: 'recovery' },
  });
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message || 'Unable to send a password reset email.');
}

export async function updatePassword(password) {
  const { data, error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) throw new Error(error.message || 'Unable to update your password.');
  return data.user;
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('auth', {
    queryParams: { source: 'oauth' },
  });
  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw new Error(error.message || 'Google sign-in could not be started.');
  if (!data?.url) throw new Error('Supabase did not return a Google sign-in URL.');

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('Google sign-in is unavailable in this browser context.');
    }
    window.location.assign(data.url);
    return { redirected: true };
  }

  oauthBrowserInProgress = true;
  try {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      throw new Error('Google sign-in was cancelled or did not complete.');
    }

    const session = await completeSupabaseAuthRedirect(result.url);
    if (!session) throw new Error('Google sign-in did not return a session.');
    return { user: session.user };
  } finally {
    oauthBrowserInProgress = false;
  }
}

export function isOAuthBrowserActive() {
  return oauthBrowserInProgress;
}

export async function completeSupabaseAuthRedirect(callbackUrl) {
  if (Platform.OS === 'web') return null;
  return exchangeAuthCallbackCode(getSupabaseClient(), callbackUrl);
}

export async function register({ name, email, password }) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) throw new Error(error.message || 'Account registration failed.');

  return { needsEmailConfirmation: !data.session };
}