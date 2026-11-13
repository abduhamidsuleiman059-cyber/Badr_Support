import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import SvgIcon from './SvgIcon';
import { router } from 'expo-router';
import useTheme from '../hooks/useTheme';

const signatureLogo = require('../../assets/images/logo-signature.png');

export default function Header({ title, subtitle, compact = false }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.heading}>
      {compact ? <Image source={signatureLogo} resizeMode="contain" accessibilityLabel="BADR_SUPPORT signature logo" style={styles.compactLogo} /> : null}
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <SvgIcon name="settings" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.avatarButton, { backgroundColor: colors.primaryDim, opacity: pressed ? 0.72 : 1 }]}
        >
          <Text style={[styles.initials, { color: colors.primary }]}>G</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function BrandMark({ compact = false }) {
  const { colors } = useTheme();
  return (
    <View style={styles.brand}>
      <Image source={signatureLogo} resizeMode="contain" accessibilityLabel="BADR_SUPPORT signature logo" style={[styles.brandLogo, { width: compact ? 38 : 44, height: compact ? 38 : 44 }]} />
      <View>
        <Text style={[styles.brandName, { color: colors.text }]}>BADR<Text style={{ color: colors.primary }}>_</Text>SUPPORT</Text>
        {!compact ? <Text style={[styles.brandCaption, { color: colors.textMuted }]}>YOUR AI COMPANION</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 76,
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  subtitle: { marginTop: 3, fontSize: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compactLogo: { width: 34, height: 34, borderRadius: 8 },
  iconButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 12, fontWeight: '800' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 22 },
  brandLogo: { borderRadius: 9 },
  brandName: { fontSize: 14, fontWeight: '900', letterSpacing: 0.7 },
  brandCaption: { fontSize: 8, fontWeight: '700', letterSpacing: 1.6, marginTop: 2 },
});