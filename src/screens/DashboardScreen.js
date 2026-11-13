import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from '../components/SvgIcon';
import { router } from 'expo-router';
import AppShell from '../components/AppShell';
import AppButton from '../components/AppButton';
import PageContainer from '../components/PageContainer';
import SectionHeading from '../components/SectionHeading';
import SuggestionCard from '../components/SuggestionCard';
import AIAvatar from '../components/AIAvatar';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';

const prompts = [
  { icon: 'edit-3', title: 'Write something', description: 'Turn a rough thought into clear, confident writing.', prompt: 'Help me turn a rough thought into clear, confident writing.', color: '#55D8A5' },
  { icon: 'compass', title: 'Explore an idea', description: 'Get a fresh perspective on a topic you care about.', prompt: 'Help me explore an idea from a fresh perspective.', color: '#67D5DC' },
  { icon: 'code', title: 'Solve a problem', description: 'Break down a tricky task into manageable steps.', prompt: 'Help me break down a challenging problem into smaller steps.', color: '#B19BFA' },
  { icon: 'layers', title: 'Summarize & learn', description: 'Make complex information easier to understand.', prompt: 'Help me understand and summarize a complex topic.', color: '#E8B978' },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { startChat, openThread, threads } = useChat();
  const columns = width >= 980 ? 4 : width >= 650 ? 2 : 1;
  const gap = 12;
  const pulse = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, useNativeDriver]);

  function openPrompt(prompt) {
    startChat(prompt);
    router.push('/chat');
  }

  return (
    <AppShell title="Overview" subtitle="Your space to think, create, and explore">
      <PageContainer>
        <View style={styles.stack}>
          <LinearGradient
            colors={['#12352D', '#10231F', '#151B22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, width < 700 && styles.heroNarrow]}
          >
            <View style={styles.heroCopy}>
              <View style={styles.eyebrow}>
                <Animated.View
                  accessibilityElementsHidden
                  style={[
                    styles.liveDot,
                    {
                      backgroundColor: colors.primary,
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
                    },
                  ]}
                />
                <Text style={styles.eyebrowText}>YOUR THOUGHTFUL AI COMPANION</Text>
              </View>
              <Text style={[styles.heroTitle, width < 600 && styles.heroTitleNarrow]}>A little more clarity.<Text style={{ color: '#64F0B6' }}>{'\n'}A lot more possibility.</Text></Text>
              <Text style={styles.heroDescription}>Bring a question, a half-formed idea, or a task on your mind. Start anywhere.</Text>
              <AppButton title="Start a conversation" icon="arrow-up-right" onPress={() => { startChat(); router.push('/chat'); }} style={styles.heroButton} />
              <Text style={styles.connectionNote}>Frontend preview · AI service not connected</Text>
            </View>
            {width >= 700 ? <View style={styles.orbitWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={[styles.orbit, styles.orbitOuter]} />
              <View style={[styles.orbit, styles.orbitMiddle]} />
              <View style={[styles.orbit, styles.orbitInner]} />
              <View style={styles.orbitCore}><AIAvatar size={78} /></View>
              <View style={[styles.orbitDot, styles.dotOne]} />
              <View style={[styles.orbitDot, styles.dotTwo]} />
              <View style={[styles.orbitDot, styles.dotThree]} />
            </View> : null}
            <View pointerEvents="none" style={styles.heroGlow} />
          </LinearGradient>

          <View style={styles.section}>
            <SectionHeading title="A good place to begin" subtitle="Pick a direction, or make it your own." />
            <View style={[styles.promptGrid, { gap }]}>
              {prompts.map((prompt) => (
                <View key={prompt.title} style={{ width: columns === 4 ? '23%' : columns === 2 ? '47%' : '100%', paddingRight: gap }}>
                  <SuggestionCard {...prompt} compact onPress={() => openPrompt(prompt.prompt)} />
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.lowerGrid, width < 740 && styles.lowerStack]}>
            <View style={[styles.recentPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SectionHeading
                title="Recent conversations"
                subtitle={threads.length ? 'Pick up where you left off.' : 'Your saved conversations will show up here.'}
                right={
                  <Pressable accessibilityRole="link" onPress={() => router.push('/history')} style={styles.textLink}>
                    <Text style={[styles.linkLabel, { color: colors.primary }]}>View all</Text>
                    <SvgIcon name="arrow-right" size={14} color={colors.primary} />
                  </Pressable>
                }
              />
              {threads.length === 0 ? (
                <View style={styles.emptyRecent}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceRaised }]}><SvgIcon name="message-square" size={17} color={colors.textMuted} /></View>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nothing here just yet. Start a conversation when you're ready.</Text>
                </View>
              ) : threads.slice(0, 3).map((thread) => (
                <Pressable key={thread.id} onPress={() => { openThread(thread.id); router.push('/chat'); }} style={styles.threadRow}>
                  <SvgIcon name="message-circle" size={16} color={colors.primary} />
                  <Text numberOfLines={1} style={[styles.threadTitle, { color: colors.text }]}>{thread.title}</Text>
                  <SvgIcon name="arrow-up-right" size={14} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
            <View style={[styles.noteCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <View style={[styles.noteIcon, { backgroundColor: colors.primaryDim }]}><SvgIcon name="shield" size={17} color={colors.primary} /></View>
              <Text style={[styles.noteTitle, { color: colors.text }]}>Thoughtful by design</Text>
              <Text style={[styles.noteBody, { color: colors.textSecondary }]}>This frontend preview doesn't send your messages to an AI service. Connect your own backend to enable responses.</Text>
              <Pressable accessibilityRole="link" onPress={() => router.push('/settings')} style={styles.learnLink}>
                <Text style={[styles.linkLabel, { color: colors.primary }]}>Explore settings</Text>
                <SvgIcon name="arrow-right" size={13} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 34 },
  hero: { minHeight: 290, borderRadius: 24, padding: 32, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(116,208,173,0.16)' },
  heroNarrow: { minHeight: 300, padding: 21 },
  heroCopy: { zIndex: 2, flex: 1, maxWidth: 570 },
  eyebrow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrowText: { color: '#9CCFC0', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: '#F3F8F5', fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -1.1, marginTop: 16 },
  heroTitleNarrow: { fontSize: 27, lineHeight: 34 },
  heroDescription: { color: '#A8BDB5', fontSize: 12, lineHeight: 19, maxWidth: 390, marginTop: 12 },
  heroButton: { alignSelf: 'flex-start', marginTop: 21 },
  connectionNote: { color: '#8EA49C', fontSize: 9, marginTop: 12 },
  orbitWrap: { position: 'relative', width: 260, height: 230, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  orbit: { position: 'absolute', borderRadius: 500, borderWidth: 1, borderColor: 'rgba(96,218,170,0.16)' },
  orbitOuter: { width: 218, height: 218 },
  orbitMiddle: { width: 166, height: 166, borderColor: 'rgba(96,218,170,0.2)' },
  orbitInner: { width: 116, height: 116, borderColor: 'rgba(96,218,170,0.29)' },
  orbitCore: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderRadius: 44, backgroundColor: 'rgba(27,65,52,0.55)' },
  orbitDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#62E5AB', shadowColor: '#62E5AB', shadowOpacity: 0.8, shadowRadius: 9, elevation: 3 },
  dotOne: { right: 38, top: 37 },
  dotTwo: { left: 28, bottom: 52, backgroundColor: '#71D5DB' },
  dotThree: { right: 49, bottom: 31, width: 5, height: 5, backgroundColor: '#B6A1FB' },
  heroGlow: { position: 'absolute', width: 200, height: 200, right: -40, top: -110, borderRadius: 120, backgroundColor: 'rgba(63,195,139,0.12)' },
  section: { gap: 17 },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', marginRight: -12, rowGap: 12 },
  lowerGrid: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  lowerStack: { flexDirection: 'column' },
  recentPanel: { flex: 1, borderWidth: 1, borderRadius: 19, padding: 19, minHeight: 180 },
  emptyRecent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  emptyIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyText: { flex: 1, fontSize: 10, lineHeight: 16 },
  threadRow: { minHeight: 42, borderTopWidth: 1, borderTopColor: 'rgba(130,150,143,0.12)', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  threadTitle: { flex: 1, fontSize: 11, fontWeight: '600' },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkLabel: { fontSize: 10, fontWeight: '700' },
  noteCard: { width: 270, borderWidth: 1, borderRadius: 19, padding: 19 },
  noteIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  noteTitle: { fontSize: 12, fontWeight: '800', marginTop: 15 },
  noteBody: { fontSize: 10, lineHeight: 17, marginTop: 7 },
  learnLink: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 15 },
});
