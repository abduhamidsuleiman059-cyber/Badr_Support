import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SvgIcon from './SvgIcon';
import useTheme from '../hooks/useTheme';
import AIAvatar from './AIAvatar';

export default function ChatBubble({ message }) {
  const { colors } = useTheme();
  const user = message.role === 'user';
  return (
    <View style={[styles.row, user && styles.userRow]}>
      {!user ? <AIAvatar size={30} /> : null}
      <View style={[
        styles.bubble,
        user
          ? { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
        {!user ? <Text style={[styles.label, { color: colors.primary }]}>BADR AI</Text> : null}
        <Text selectable style={[styles.message, { color: colors.text }]}>{message.content}</Text>
        {message.attachment ? (
          <View style={[styles.attachment, { borderColor: colors.border }]}>
            <SvgIcon name="file" size={14} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.attachmentName, { color: colors.textSecondary }]}>{message.attachment}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, maxWidth: 780 },
  userRow: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  bubble: { maxWidth: '90%', borderWidth: 1, borderRadius: 17, borderTopLeftRadius: 5, paddingHorizontal: 16, paddingVertical: 13 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 7 },
  message: { fontSize: 13, lineHeight: 21 },
  attachment: { borderWidth: 1, borderRadius: 9, padding: 8, marginTop: 10, flexDirection: 'row', gap: 7, alignItems: 'center' },
  attachmentName: { fontSize: 10, maxWidth: 200 },
});