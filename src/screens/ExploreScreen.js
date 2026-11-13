import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import SvgIcon from '../components/SvgIcon';
import { router } from 'expo-router';
import AppShell from '../components/AppShell';
import PageContainer from '../components/PageContainer';
import SectionHeading from '../components/SectionHeading';
import SuggestionCard from '../components/SuggestionCard';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';

const features = [
  { icon: 'edit-3', title: 'Writing studio', description: 'Shape drafts, find your tone, and get a clearer first sentence.', color: '#53D7A2' },
  { icon: 'search', title: 'Research companion', description: 'Explore a topic with thoughtful questions and useful structure.', color: '#68D5DD' },
  { icon: 'code', title: 'Code partner', description: 'Work through programming concepts, bugs, and small code tasks.', color: '#B29AF7' },
  { icon: 'zap', title: 'Idea spark', description: 'Generate angles and frameworks when you need a creative nudge.', color: '#E7B674' },
  { icon: 'book-open', title: 'Study space', description: 'Break a complex subject into approachable, focused steps.', color: '#80B4F7' },
  { icon: 'align-left', title: 'Quick summary', description: 'Find the key points in information you provide in chat.', color: '#E18BC3' },
];

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { startChat } = useChat();
  const { width } = useWindowDimensions();
  const columns = width >= 1050 ? 3 : width >= 670 ? 2 : 1;
  return (
    <AppShell title="Explore" subtitle="A few ways to get your thoughts moving">
      <PageContainer>
        <View style={styles.page}>
          <View style={[styles.banner, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
            <View style={[styles.bannerIcon, { backgroundColor: colors.primaryDim }]}><SvgIcon name="compass" size={19} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>One assistant. Many starting points.</Text>
              <Text style={[styles.bannerText, { color: colors.textSecondary }]}>Choose a guide to open a fresh chat. These are frontend previews; AI features need a connected service.</Text>
            </View>
          </View>
          <SectionHeading title="Explore the possibilities" subtitle="Pick a space to begin. You can always change direction." />
          <View style={styles.grid}>
            {features.map((feature) => (
              <View key={feature.title} style={{ width: columns === 3 ? '30%' : columns === 2 ? '47%' : '100%', padding: 6 }}>
                <SuggestionCard {...feature} onPress={() => { startChat(); router.push('/chat'); }} />
              </View>
            ))}
          </View>
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>Feature descriptions are product previews, not live AI capabilities.</Text>
        </View>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: { gap: 26 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 18, borderWidth: 1, borderRadius: 17 },
  bannerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '800' },
  bannerText: { fontSize: 10, lineHeight: 16, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: -7 },
  disclaimer: { fontSize: 9, textAlign: 'center' },
});