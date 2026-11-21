import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import SvgIcon from '../components/SvgIcon';
import AppShell from '../components/AppShell';
import PageContainer from '../components/PageContainer';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';
import { isBackendConfigured } from '../services/apiClient';
import { isSupabaseConfigured } from '../services/supabaseClient';

function SettingRow({ icon, title, description, colors, action }) {
  return (
    <View style={[styles.row, { borderTopColor: colors.borderSubtle }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceRaised }]}><SvgIcon name={icon} size={16} color={colors.primary} /></View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      {action}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { isAuthenticated } = useChat();
  const [themeMenu, setThemeMenu] = useState(false);
  const [info, setInfo] = useState(null);
  const backendConfigured = isBackendConfigured();
  const authConfigured = isSupabaseConfigured();
  return (
    <AppShell title="Settings" subtitle="Make your workspace feel like yours">
      <PageContainer>
        <View style={styles.page}>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.groupTitle, { color: colors.text }]}>Appearance</Text>
            <SettingRow
              icon="moon"
              title="Color theme"
              description="Choose a comfortable look for your workspace."
              colors={colors}
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Choose theme. Current theme: ${mode}`}
                  accessibilityState={{ expanded: themeMenu }}
                  onPress={() => setThemeMenu((open) => !open)}
                  style={[styles.themeButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                >
                  <Text style={[styles.themeLabel, { color: colors.text }]}>{mode === 'dark' ? 'Dark' : 'Light'}</Text>
                  <SvgIcon name={themeMenu ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                </Pressable>
              }
            />
            {themeMenu ? (
              <View style={[styles.dropdown, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                {['dark', 'light'].map((option) => (
                  <Pressable
                    accessibilityRole="menuitem"
                    key={option}
                    onPress={() => { setMode(option); setThemeMenu(false); }}
                    style={({ pressed }) => [styles.dropdownOption, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <SvgIcon name={option === 'dark' ? 'moon' : 'sun'} size={15} color={option === mode ? colors.primary : colors.textMuted} />
                    <Text style={[styles.dropdownText, { color: colors.text }]}>{option === 'dark' ? 'Dark theme' : 'Light theme'}</Text>
                    {option === mode ? <SvgIcon name="check" size={14} color={colors.primary} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <SettingRow
              icon="monitor"
              title="Interface preview"
              description="Responsive layout adapts to your screen size automatically."
              colors={colors}
              action={<SvgIcon name="check-circle" size={17} color={colors.primary} />}
            />
          </View>

          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.groupTitle, { color: colors.text }]}>Connected services</Text>
            <SettingRow
              icon="message-circle"
              title="AI responses"
              description={backendConfigured ? 'Chat requests use the configured backend and provider routing.' : 'Set EXPO_PUBLIC_BACKEND_API_URL to connect the chat backend.'}
              colors={colors}
              action={<View style={[styles.status, { backgroundColor: colors.surfaceRaised }]}><View style={[styles.statusDot, { backgroundColor: backendConfigured ? colors.primary : colors.textMuted }]} /><Text style={[styles.statusText, { color: backendConfigured ? colors.primary : colors.textMuted }]}>{backendConfigured ? 'Configured' : 'Not connected'}</Text></View>}
            />
            <SettingRow
              icon="user"
              title="Authentication"
              description={authConfigured ? 'Email and password sign-in use Supabase Auth.' : 'Set the public Supabase URL and publishable key to enable sign-in.'}
              colors={colors}
              action={<View style={[styles.status, { backgroundColor: colors.surfaceRaised }]}><View style={[styles.statusDot, { backgroundColor: isAuthenticated ? colors.primary : colors.textMuted }]} /><Text style={[styles.statusText, { color: isAuthenticated ? colors.primary : colors.textMuted }]}>{isAuthenticated ? 'Signed in' : authConfigured ? 'Configured' : 'Not connected'}</Text></View>}
            />
            <SettingRow
              icon="database"
              title="Conversation storage"
              description={isAuthenticated ? 'Signed-in conversations are saved to Supabase.' : 'Guest chat is temporary; sign in to save conversation history.'}
              colors={colors}
              action={<SvgIcon name="info" size={16} color={colors.textMuted} />}
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Privacy comes first</Text>
              <Text style={[styles.infoDescription, { color: colors.textMuted }]}>Chat requests go to your configured backend. Only signed-in conversations are saved; frontend code uses the public Supabase key.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setInfo('The app sends chat text to your configured backend. Signed-in conversations are associated with your verified Supabase user. Guest conversations are not saved. Attachments and voice capture are not sent.')} style={[styles.infoButton, { borderColor: colors.border }]}>
              <Text style={[styles.infoButtonText, { color: colors.primary }]}>Learn more</Text>
              <SvgIcon name="arrow-up-right" size={13} color={colors.primary} />
            </Pressable>
          </View>
        </View>
        <Modal visible={Boolean(info)} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.modalIcon, { backgroundColor: colors.primaryDim }]}><SvgIcon name="shield" size={19} color={colors.primary} /></View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy & service status</Text>
              <Text style={[styles.modalBody, { color: colors.textSecondary }]}>{info}</Text>
              <Pressable accessibilityRole="button" onPress={() => setInfo(null)} style={[styles.modalClose, { backgroundColor: colors.primary }]}>
                <Text style={styles.modalCloseText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', maxWidth: 820, alignSelf: 'center', gap: 16 },
  group: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 17, paddingTop: 16, paddingBottom: 5 },
  groupTitle: { fontSize: 12, fontWeight: '800', marginBottom: 3 },
  row: { minHeight: 69, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, paddingVertical: 10 },
  rowTitle: { fontSize: 10, fontWeight: '700' },
  rowDescription: { fontSize: 9, lineHeight: 14, marginTop: 4 },
  themeButton: { height: 33, minWidth: 83, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  themeLabel: { fontSize: 10, fontWeight: '700' },
  dropdown: { alignSelf: 'flex-end', width: 160, borderWidth: 1, borderRadius: 12, padding: 5, marginTop: -4, marginBottom: 8, elevation: 5 },
  dropdownOption: { height: 36, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownText: { flex: 1, fontSize: 10, fontWeight: '600' },
  status: { minHeight: 27, borderRadius: 8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 8, fontWeight: '700' },
  infoCard: { minHeight: 90, borderWidth: 1, borderRadius: 17, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoTitle: { fontSize: 11, fontWeight: '800' },
  infoDescription: { fontSize: 9, lineHeight: 15, marginTop: 5 },
  infoButton: { minHeight: 34, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoButtonText: { fontSize: 9, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.62)', justifyContent: 'center', alignItems: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, padding: 23 },
  modalIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '800', marginTop: 15 },
  modalBody: { fontSize: 11, lineHeight: 18, marginTop: 8 },
  modalClose: { minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  modalCloseText: { color: '#062017', fontSize: 11, fontWeight: '800' },
});