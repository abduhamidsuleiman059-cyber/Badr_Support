import React, { createContext, useMemo, useState } from 'react';
import palette from '../constants/colors';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const value = useMemo(() => ({
    mode,
    colors: palette[mode],
    toggleTheme: () => setMode((current) => current === 'dark' ? 'light' : 'dark'),
    setMode,
  }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}