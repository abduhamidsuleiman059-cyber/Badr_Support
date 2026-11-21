import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import SvgIcon from './SvgIcon';
import useTheme from '../hooks/useTheme';

export default function MessageInput({ onSend, disabled = false, onAttachment }) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [picking, setPicking] = useState(false);
  const [voiceDemo, setVoiceDemo] = useState(false);
  const [pickError, setPickError] = useState('');
  const [focused, setFocused] = useState(false);

  async function pickFile() {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets[0]) {
        setAttachment(result.assets[0]);
        setPickError('');
        if (onAttachment) onAttachment(result.assets[0]);
      }
    } catch (error) {
      setPickError(`File picker error: ${error.message || 'Unable to open files.'}`);
    } finally {
      setPicking(false);
    }
  }

  async function submit() {
    if (!text.trim() && !attachment) return;
    const shouldClear = await onSend(text.trim(), attachment);
    if (shouldClear === false) return;
    setText('');
    setAttachment(null);
  }

  return (
    <View style={styles.wrap}>
      {attachment ? (
        <View style={[styles.fileChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <SvgIcon name="file" size={13} color={colors.primary} />
          <Text numberOfLines={1} style={[styles.fileName, { color: colors.textSecondary }]}>{attachment.name}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={() => setAttachment(null)}>
            <SvgIcon name="x" size={15} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}
      {pickError ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{pickError}</Text> : null}
      <View style={[
        styles.composer,
        { backgroundColor: colors.surface, borderColor: focused ? colors.primary : colors.border },
        focused && styles.composerFocused,
      ]}>
        <TextInput
          accessibilityLabel="Message BADR AI"
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={submit}
          placeholder={voiceDemo ? 'Voice input is a preview only' : 'Message BADR AI...'}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          multiline
          maxLength={4000}
          editable={!disabled}
          style={[styles.input, Platform.OS === 'web' && styles.webInput, { color: colors.text }]}
        />
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Attach a file" onPress={pickFile} disabled={picking || disabled}>
            {picking ? <ActivityIndicator size="small" color={colors.primary} /> : <SvgIcon name="paperclip" size={17} color={colors.textMuted} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voiceDemo ? 'Turn off voice input preview' : 'Voice input preview'}
            accessibilityState={{ selected: voiceDemo }}
            onPress={() => setVoiceDemo((value) => !value)}
            style={[styles.voiceButton, voiceDemo && { backgroundColor: colors.primaryDim }]}
          >
            <SvgIcon name="mic" size={16} color={voiceDemo ? colors.primary : colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={disabled || (!text.trim() && !attachment)}
            onPress={submit}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: text.trim() || attachment ? colors.primary : colors.surfaceHover, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <SvgIcon name="arrow-up" size={17} color={text.trim() || attachment ? '#062017' : colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {voiceDemo ? 'Voice capture is not connected yet. ' : ''}
        Text messages only · Attachments are not uploaded
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  fileChip: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10 },
  fileName: { fontSize: 10, maxWidth: 240 },
  composer: { minHeight: 98, maxHeight: 190, borderRadius: 17, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  composerFocused: { shadowColor: '#39D69A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 3 },
  input: { minHeight: 38, maxHeight: 105, fontSize: 13, lineHeight: 20 },
  webInput: { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent', borderWidth: 0, backgroundColor: 'transparent', boxShadow: 'none', padding: 0, resize: 'none' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  voiceButton: { width: 29, height: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  send: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  hint: { textAlign: 'center', fontSize: 9 },
  error: { fontSize: 10, lineHeight: 15 },
});