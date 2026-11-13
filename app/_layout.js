import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ChatProvider } from '../src/context/ChatContext';
import useTheme from '../src/hooks/useTheme';

function Navigation() {
  const { mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="explore" />
        <Stack.Screen
          name="history"
          options={{ presentation: 'transparentModal', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="welcome" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ChatProvider>
          <Navigation />
        </ChatProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}