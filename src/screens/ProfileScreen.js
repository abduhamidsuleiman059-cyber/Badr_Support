import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SvgIcon from '../components/SvgIcon';
import { router } from 'expo-router';
import AppButton from '../components/AppButton';
import AppShell from '../components/AppShell';
import PageContainer from '../components/PageContainer';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';
import { signOut } from '../services/storageService';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { authenticatedUser } = useChat();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const profileName = authenticatedUser?.user_metadata?.full_name?.trim()
    || authenticatedUser?.user_metadata?.name?.trim()
    || authenticatedUser?.email?.split('@')[0]?.trim()
    || '';
  const firstName = profileName.split(/\s+/)[0] || 'Guest';
  const greeting = authenticatedUser ? `Hi, ${firstName}` : 'Welcome to BADR';
  const avatarInitial = (profileName || 'W').slice(0, 1).toUpperCase();
  const email = authenticatedUser?.email || 'Connect an account to add an email';
  const rows = [
    { icon: 'user', label: 'Account status', value: authenticatedUser ? 'Signed in' : 'Not signed in' },
    { icon: 'mail', label: 'Email address', value: email },
    { icon: 'hard-drive', label: 'Data storage', value: authenticatedUser ? 'Saved to your account' : 'Guest chats are not saved' },
  ];

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      setSignOutError(error.message || 'Unable to sign out.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <AppShell title="Profile" subtitle="Your account and personal preferences">
      <PageContainer>
        <View style={styles.page}>
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}><Text style={[styles.initials, { color: colors.primary }]}>{avatarInitial}</Text></View>
            <Text style={[styles.name, { color: colors.text }]}>{greeting}</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {authenticatedUser ? 'Your account and saved conversations are connected.' : "You're exploring as a guest. Guest chats are not saved."}
            </Text>
            {!authenticatedUser ? (
              <AppButton title="Sign in or create an account" icon="arrow-right" onPress={() => router.push('/auth')} style={{ marginTop: 19 }} />
            ) : null}
            {authenticatedUser ? (
              <>
                {signOutError ? <Text accessibilityRole="alert" style={[styles.signOutError, { color: colors.danger }]}>{signOutError}</Text> : null}
                <AppButton
                  title="Sign out"
                  variant="outline"
                  loading={signingOut}
                  onPress={handleSignOut}
                  style={{ marginTop: 19 }}
                />
              </>
            ) : null}
          </View>
          <View style={[styles.account, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account overview</Text>
            {rows.map((row) => (
              <View key={row.label} style={[styles.row, { borderTopColor: colors.borderSubtle }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.surfaceRaised }]}><SvgIcon name={row.icon} size={15} color={colors.textMuted} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{row.label}</Text>
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{row.value}</Text>
                </View>
                <SvgIcon name="lock" size={13} color={colors.textMuted} />
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsLink, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <SvgIcon name="sliders" size={16} color={colors.primary} />
            <Text style={[styles.settingsText, { color: colors.text }]}>Appearance & settings</Text>
            <SvgIcon name="arrow-right" size={15} color={colors.textMuted} />
          </Pressable>
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>Account details are managed by Supabase Auth.</Text>
        </View>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: { maxWidth: 760, width: '100%', alignSelf: 'center', gap: 17 },
  profileCard: { borderWidth: 1, borderRadius: 20, padding: 25, alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 20, fontWeight: '900' },
  name: { fontSize: 18, fontWeight: '800', marginTop: 14 },
  description: { maxWidth: 360, fontSize: 10, lineHeight: 17, textAlign: 'center', marginTop: 7 },
  account: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 17, paddingTop: 17 },
  sectionTitle: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  row: { minHeight: 60, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 9 },
  rowValue: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  settingsLink: { minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsText: { flex: 1, fontSize: 11, fontWeight: '700' },
  disclaimer: { textAlign: 'center', fontSize: 9 },
  signOutError: { fontSize: 10, lineHeight: 15, marginTop: 14, textAlign: 'center' },
});