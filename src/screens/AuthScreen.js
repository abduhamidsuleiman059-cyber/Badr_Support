import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import SvgIcon from '../components/SvgIcon';
import { router, useLocalSearchParams } from 'expo-router';
import {
  register,
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  updatePassword,
} from '../services/storageService';
import AIAvatar from '../components/AIAvatar';
import AppButton from '../components/AppButton';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { authenticatedUser, authLoading, authError } = useChat();
  const { width } = useWindowDimensions();
  const {
    type: recoveryType,
    source: authSource,
    error: oauthError,
    error_description: oauthErrorDescription,
  } = useLocalSearchParams();
  const wide = width >= 800;
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const registering = mode === 'register';
  const resetting = mode === 'reset';
  const requestingReset = mode === 'forgot';
  const recoveryLink = Array.isArray(recoveryType) ? recoveryType[0] : recoveryType;
  const source = Array.isArray(authSource) ? authSource[0] : authSource;

  useEffect(() => {
    if (recoveryLink === 'recovery') {
      setMode('reset');
      setError('');
      setStatus('');
    }
  }, [recoveryLink]);

  useEffect(() => {
    if (source === 'oauth' && authenticatedUser && !authLoading) {
      router.replace('/');
    }
  }, [authLoading, authenticatedUser, source]);

  useEffect(() => {
    if (source === 'oauth' && (oauthError || oauthErrorDescription)) {
      setError('Google sign-in was not completed.');
    }
  }, [oauthError, oauthErrorDescription, source]);

  async function submit() {
    setError('');
    setStatus('');
    if (registering && !name.trim()) {
      setError('Enter your name to continue.');
      return;
    }
    if (!resetting && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!requestingReset && password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (requestingReset) {
        await requestPasswordReset(email.trim());
        setMode('login');
        setStatus('If an account exists for that email, a password reset link has been sent.');
        return;
      } else if (resetting) {
        await updatePassword(password);
        setPassword('');
        setMode('login');
        setStatus('Your password has been updated.');
      } else if (registering) {
        const result = await register({ name: name.trim(), email: email.trim(), password });
        if (result.needsEmailConfirmation) {
          setError('Check your email to confirm your account, then sign in.');
          return;
        }
      } else {
        await signIn({ email: email.trim(), password });
      }
      router.replace('/');
    } catch (requestError) {
      setError(requestError.message || 'Authentication service is unavailable.');
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    setError('');
    setStatus('');
    setSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (!result?.redirected) router.replace('/');
    } catch (requestError) {
      setError(requestError.message || 'Google authentication service is unavailable.');
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(next) {
    setMode(next);
    setError('');
    setStatus('');
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.page}>
          <View style={styles.top}>
            <Pressable accessibilityRole="link" onPress={() => router.replace('/')} style={styles.brand}>
              <Image
                source={require('../../assets/images/logo-signature.png')}
                resizeMode="contain"
                accessibilityLabel="BADR_SUPPORT signature logo"
                style={styles.brandLogo}
              />
              <Text style={[styles.brandText, { color: colors.text }]}>BADR<Text style={{ color: colors.primary }}>_</Text>SUPPORT</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push('/welcome')} style={styles.backLink}>
              <SvgIcon name="arrow-left" size={14} color={colors.textMuted} />
              <Text style={[styles.backText, { color: colors.textMuted }]}>Back to welcome</Text>
            </Pressable>
          </View>
          <View style={[styles.layout, !wide && styles.layoutNarrow]}>
            {wide ? <LinearGradient colors={['#173E32', '#112921', '#10181D']} style={styles.sidePanel}>
              <View style={styles.sideOrb}><AIAvatar size={60} /></View>
              <Text style={styles.sideTitle}>A little support goes a long way.</Text>
              <Text style={styles.sideDescription}>A thoughtful space to find clarity, explore ideas, and take your next step.</Text>
              <View style={styles.sideNote}>
                <SvgIcon name="info" size={14} color="#73DFAF" />
                <Text style={styles.sideNoteText}>Sign in to sync your conversations securely.</Text>
              </View>
            </LinearGradient> : null}
            <View style={[styles.formPanel, { backgroundColor: colors.surface, borderColor: colors.border }, !wide && styles.formPanelNarrow]}>
              {mode === 'login' || registering ? (
                <View style={styles.switcher}>
                  {['login', 'register'].map((option) => (
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: mode === option }}
                      key={option}
                      onPress={() => changeMode(option)}
                      style={[styles.tab, mode === option && { backgroundColor: colors.surfaceRaised }]}
                    >
                      <Text style={[styles.tabText, { color: mode === option ? colors.text : colors.textMuted }]}>{option === 'login' ? 'Sign in' : 'Create account'}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => changeMode('login')} style={styles.backLink}>
                  <SvgIcon name="arrow-left" size={14} color={colors.textMuted} />
                  <Text style={[styles.backText, { color: colors.textMuted }]}>Back to sign in</Text>
                </Pressable>
              )}
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {registering ? 'Join BADR_SUPPORT' : resetting ? 'Choose a new password' : requestingReset ? 'Reset your password' : 'Welcome back'}
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.textMuted }]}>
                {registering
                  ? 'Create your account to get started.'
                  : resetting
                    ? 'Enter a new password for your account.'
                    : requestingReset
                      ? 'Enter your email and we’ll send a reset link if an account exists.'
                      : 'Enter your details to continue.'}
              </Text>
              {registering ? (
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Your name</Text>
                  <View style={[styles.inputWrap, { backgroundColor: '#080C10', borderColor: focusedField === 'name' ? colors.primary : '#253238' }]}>
                    <SvgIcon name="user" size={15} color={colors.textMuted} />
                    <TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} placeholder="Your name" placeholderTextColor="#71817E" selectionColor={colors.primary} autoComplete="name" style={[styles.input, Platform.OS === 'web' && styles.webInput, { backgroundColor: '#080C10', color: '#F1F6F4' }]} />
                  </View>
                </View>
              ) : null}
              {!resetting ? <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email address</Text>
                <View style={[styles.inputWrap, { backgroundColor: '#080C10', borderColor: focusedField === 'email' ? colors.primary : '#253238' }]}>
                  <SvgIcon name="mail" size={15} color={colors.textMuted} />
                  <TextInput accessibilityLabel="Email address" value={email} onChangeText={setEmail} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="you@example.com" placeholderTextColor="#71817E" selectionColor={colors.primary} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={[styles.input, Platform.OS === 'web' && styles.webInput, { backgroundColor: '#080C10', color: '#F1F6F4' }]} />
                </View>
              </View> : null}
              {!requestingReset ? <View style={styles.field}>
                <View style={styles.passwordLabel}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{resetting ? 'New password' : 'Password'}</Text>
                  {mode === 'login' ? (
                    <Pressable accessibilityRole="button" onPress={() => changeMode('forgot')}>
                      <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={[styles.inputWrap, { backgroundColor: '#080C10', borderColor: focusedField === 'password' ? colors.primary : '#253238' }]}>
                  <SvgIcon name="lock" size={15} color={colors.textMuted} />
                  <TextInput accessibilityLabel={resetting ? 'New password' : 'Password'} value={password} onChangeText={setPassword} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="At least 8 characters" placeholderTextColor="#71817E" selectionColor={colors.primary} secureTextEntry={!showPassword} autoComplete={registering || resetting ? 'new-password' : 'current-password'} style={[styles.input, Platform.OS === 'web' && styles.webInput, { backgroundColor: '#080C10', color: '#F1F6F4' }]} />
                  <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword((visible) => !visible)}>
                    <SvgIcon name={showPassword ? 'eye-off' : 'eye'} size={15} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View> : null}
              {status ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.primary }]}>{status}</Text> : null}
              {authError ? (
                <Text accessibilityRole="alert" style={[styles.feedback, { color: colors.danger }]}>{authError}</Text>
              ) : null}
              {resetting && !authenticatedUser ? (
                <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.textMuted }]}>
                  {authLoading ? 'Restoring your password recovery session…' : 'This reset link is invalid or expired. Request a new one.'}
                </Text>
              ) : null}
              {error ? <Text accessibilityRole="alert" style={[styles.feedback, { color: colors.danger }]}>{error}</Text> : null}
              <AppButton
                title={registering
                  ? 'Create account'
                  : resetting
                    ? 'Update password'
                    : requestingReset
                      ? 'Send reset link'
                      : 'Sign in'}
                icon={submitting ? undefined : 'arrow-right'}
                loading={submitting}
                disabled={resetting && (authLoading || !authenticatedUser)}
                onPress={submit}
                style={styles.submit}
              />
              <Text style={[styles.disclaimer, { color: colors.textMuted }]}>Your account is managed securely by Supabase Auth.</Text>
              {mode === 'login' || registering ? (
                <>
                  <View style={styles.separator}><View style={[styles.separatorLine, { backgroundColor: colors.border }]} /><Text style={[styles.separatorText, { color: colors.textMuted }]}>OR</Text><View style={[styles.separatorLine, { backgroundColor: colors.border }]} /></View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                    disabled={submitting}
                    onPress={continueWithGoogle}
                    style={({ pressed }) => [styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: submitting ? 0.48 : pressed ? 0.8 : 1 }]}
                  >
                    <Svg width={18} height={18} viewBox="0 0 48 48" aria-hidden>
                      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.84 7.18l7.78 6.04c4.53-4.2 7.1-10.37 7.1-17.69z" />
                      <Path fill="#34A853" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.11.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z" />
                      <Path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.88-5.76l-7.78-6.04c-2.17 1.45-4.95 2.3-8.1 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
                    </Svg>
                    <Text style={[styles.googleText, { color: colors.textSecondary }]}>Continue with Google</Text>
                  </Pressable>
                </>
              ) : null}
              <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={[styles.guestButton, { borderColor: colors.border }]}>
                <Text style={[styles.guestText, { color: colors.textSecondary }]}>Continue exploring as a guest</Text>
              </Pressable>
            </View>
          </View>
          <Text style={[styles.footer, { color: colors.textMuted }]}>BADR_SUPPORT · Secure account sign-in</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingBottom: 25 },
  page: { width: '100%', maxWidth: 970, flex: 1 },
  top: { height: 75, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandLogo: { width: 35, height: 35, borderRadius: 9 },
  brandText: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  backLink: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  backText: { fontSize: 10, fontWeight: '600' },
  layout: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 16 },
  layoutNarrow: { flexDirection: 'column' },
  sidePanel: { flex: 0.9, minHeight: 450, maxWidth: 380, borderRadius: 22, padding: 28, justifyContent: 'center', overflow: 'hidden' },
  sideOrb: { width: 90, height: 90, borderRadius: 50, backgroundColor: 'rgba(86,190,143,.15)', alignItems: 'center', justifyContent: 'center' },
  sideTitle: { maxWidth: 290, color: '#F3F8F5', fontSize: 25, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5, marginTop: 24 },
  sideDescription: { color: '#A8BDB5', fontSize: 11, lineHeight: 18, marginTop: 10 },
  sideNote: { backgroundColor: 'rgba(5,19,15,.35)', borderRadius: 11, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 25 },
  sideNoteText: { color: '#A5C3B5', fontSize: 9, flex: 1, lineHeight: 14 },
  formPanel: { flex: 1, maxWidth: 440, borderWidth: 1, borderRadius: 22, padding: 24 },
  formPanelNarrow: { width: '100%', maxWidth: 480, flex: 0 },
  switcher: { height: 39, borderRadius: 11, flexDirection: 'row', padding: 3, backgroundColor: 'rgba(125,145,135,.10)' },
  tab: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 10, fontWeight: '700' },
  formTitle: { fontSize: 20, fontWeight: '800', marginTop: 24 },
  formSubtitle: { fontSize: 10, marginTop: 6, marginBottom: 19 },
  field: { marginTop: 13 },
  label: { fontSize: 9, fontWeight: '700', marginBottom: 7 },
  passwordLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  forgot: { fontSize: 8, marginTop: 1 },
  inputWrap: { height: 46, backgroundColor: '#080C10', borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13 },
  input: { flex: 1, height: 44, paddingHorizontal: 0, fontSize: 10, color: '#F1F6F4', backgroundColor: '#080C10' },
  webInput: {
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    borderWidth: 0,
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundColor: '#080C10',
    WebkitTextFillColor: '#F1F6F4',
    boxShadow: '0 0 0 1000px #080C10 inset',
  },
  feedback: { fontSize: 10, lineHeight: 16, marginTop: 11 },
  submit: { marginTop: 18 },
  disclaimer: { fontSize: 8, lineHeight: 13, textAlign: 'center', marginTop: 11 },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 17 },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontSize: 8, fontWeight: '700' },
  googleButton: { minHeight: 40, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 12 },
  googleText: { fontSize: 9, fontWeight: '700' },
  guestButton: { minHeight: 40, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  guestText: { fontSize: 9, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 8, paddingVertical: 13 },
});
