import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from '../components/SvgIcon';
import { router } from 'expo-router';
import AIAvatar from '../components/AIAvatar';
import AppButton from '../components/AppButton';
import useTheme from '../hooks/useTheme';

const highlights = [
  { icon: 'message-circle', title: 'A calmer conversation', body: 'A clear, thoughtful space for your questions and ideas.' },
  { icon: 'layers', title: 'Room to explore', body: 'Move from first thought to a plan, one step at a time.' },
  { icon: 'shield', title: 'Built with care', body: 'No account or AI service is connected in this preview.' },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 800;
  const logoWidth = wide ? 168 : Math.min(144, width * 0.38);
  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      <View style={[styles.page, { maxWidth: wide ? 1080 : 560 }]}>
        <View style={styles.top}>
          <View style={[styles.mainLogo, { width: logoWidth, height: logoWidth, borderRadius: logoWidth / 2 }]}>
            <Image
              source={require('../../assets/images/logo.png')}
              resizeMode="contain"
              accessibilityLabel="BADR_SUPPORT logo"
              style={{ width: logoWidth, height: logoWidth }}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth')} style={styles.signIn}>
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>Already have an account?</Text>
            <Text style={[styles.signInLink, { color: colors.primary }]}>Sign in</Text>
          </Pressable>
        </View>
        <View style={[styles.heroRow, !wide && styles.heroStack]}>
        <View style={[styles.heroCopy, !wide && styles.heroCopyNarrow]}>
            <View style={styles.pill}><View style={[styles.pillDot, { backgroundColor: colors.primary }]} /><Text style={styles.pillText}>MSAADA WAKO WA KILA SIKU</Text></View>
            <Text style={[styles.title, { color: colors.text }]}><Text style={{ color: colors.primary }}>Nuru</Text> ya wazo lako inaanzia hapa.</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>Kama vile Badr ulivyokuwa usiku wa ushindi, Badr Support ni msaidizi wako wa AI atakayekupa mwanga, majibu sahihi na ujasiri wa kusonga mbele.</Text>
            <View style={styles.actions}>
              <AppButton title="Uliza Badr Sasa" icon="arrow-right" onPress={() => router.push('/auth')} />
              <AppButton title="Jaribu Bila Akaunti" variant="outline" onPress={() => router.replace('/')} />
            </View>
            <Text style={[styles.smallNote, { color: colors.textMuted }]}>Preview only · Sign-in and AI services are not connected</Text>
          </View>
          <LinearGradient colors={['#173E32', '#122821', '#10191D']} style={[styles.visual, !wide && styles.visualNarrow]}>
            <View style={styles.visualOrb}><AIAvatar size={86} /></View>
            <View style={[styles.visualGlow, { borderColor: 'rgba(77,222,160,0.12)' }]} />
            <View style={[styles.floatingCard, styles.cardOne]}>
              <View style={styles.cardIcon}><SvgIcon name="sun" size={14} color="#F1C980" /></View>
              <View><Text style={styles.cardTitle}>A fresh perspective</Text><Text style={styles.cardSub}>Start anywhere</Text></View>
            </View>
            <View style={[styles.floatingCard, styles.cardTwo]}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(105,216,221,.14)' }]}><SvgIcon name="check" size={14} color="#70D9DF" /></View>
              <View><Text style={styles.cardTitle}>One step at a time</Text><Text style={styles.cardSub}>No pressure, just progress</Text></View>
            </View>
            <Text style={styles.previewLabel}>A THOUGHTFUL SPACE, DESIGNED AROUND YOU</Text>
          </LinearGradient>
        </View>
        <View style={[styles.highlights, !wide && styles.highlightsStack]}>
          {highlights.map((item) => (
            <View key={item.title} style={[styles.highlight, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SvgIcon name={item.icon} size={17} color={colors.primary} />
              <Text style={[styles.highlightTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.highlightBody, { color: colors.textMuted }]}>{item.body}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 50 },
  page: { width: '100%' },
  top: { minHeight: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mainLogo: { overflow: 'hidden', backgroundColor: '#FEFEFE' },
  signIn: { flexDirection: 'row', gap: 7 },
  signInText: { fontSize: 10 },
  signInLink: { fontSize: 10, fontWeight: '800' },
  heroRow: { minHeight: 420, flexDirection: 'row', alignItems: 'center', gap: 32, paddingVertical: 28 },
  heroStack: { minHeight: 0, flexDirection: 'column', alignItems: 'stretch' },
  heroCopy: { flex: 1, paddingVertical: 18 },
  heroCopyNarrow: { flex: 0, width: '100%' },
  pill: { alignSelf: 'flex-start', height: 27, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(55,214,152,0.10)', flexDirection: 'row', alignItems: 'center', gap: 7 },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { color: '#91D6B8', fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  title: { fontSize: 46, lineHeight: 53, fontWeight: '800', letterSpacing: -1.7, marginTop: 22 },
  description: { maxWidth: 430, fontSize: 12, lineHeight: 20, marginTop: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 23 },
  smallNote: { fontSize: 9, marginTop: 12 },
  visual: { height: 340, flex: 1, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,210,171,0.17)' },
  visualNarrow: { flex: 0, width: '100%', height: 280 },
  visualOrb: { width: 140, height: 140, borderRadius: 90, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(49,122,91,.18)', zIndex: 2 },
  visualGlow: { position: 'absolute', width: 230, height: 230, borderWidth: 1, borderRadius: 120 },
  floatingCard: { position: 'absolute', minHeight: 55, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(18,34,30,.93)', borderWidth: 1, borderColor: 'rgba(150,185,170,.15)' },
  cardOne: { top: '21%', right: '7%' },
  cardTwo: { bottom: '21%', left: '5%' },
  cardIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(231,188,115,.14)' },
  cardTitle: { color: '#E8F0EC', fontSize: 9, fontWeight: '700' },
  cardSub: { color: '#91A49B', fontSize: 8, marginTop: 3 },
  previewLabel: { position: 'absolute', bottom: 17, color: '#8BA49A', fontSize: 8, letterSpacing: 1.1 },
  highlights: { flexDirection: 'row', gap: 12, marginTop: 6 },
  highlightsStack: { flexDirection: 'column' },
  highlight: { flex: 1, minHeight: 116, borderWidth: 1, borderRadius: 16, padding: 16 },
  highlightTitle: { fontSize: 11, fontWeight: '800', marginTop: 13 },
  highlightBody: { fontSize: 9, lineHeight: 15, marginTop: 5 },
});