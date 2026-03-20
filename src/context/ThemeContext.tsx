"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('eder-theme-mode');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem('eder-theme-mode', theme);
  }, [mounted, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mounted,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mounted, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }

  return context;
}
