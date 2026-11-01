import type { PropsWithChildren } from 'react';
export type ThemeMode = 'dark';
const theme = { themeMode: 'dark' as const, isDarkMode: true };
export function ThemeProvider({ children }: PropsWithChildren) {
  return children;
}
export function useTheme() {
  return theme;
}
