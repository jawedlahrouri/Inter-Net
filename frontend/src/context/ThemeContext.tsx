import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @brief Provides the theme state, persists it in localStorage and applies the resolved light or dark class to the document root.
 * @param children React nodes rendered inside the theme context provider.
 * @param defaultTheme Initial theme (dark, light or system) used when none is saved; defaults to dark.
 * @param storageKey localStorage key used to persist the theme; defaults to internet-ui-theme.
 * @return A ThemeContext.Provider exposing theme, resolvedTheme, setTheme and toggleTheme around the children.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'internet-ui-theme',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey) as Theme | null;
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let current: 'dark' | 'light' = 'dark';
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      current = systemDark ? 'dark' : 'light';
    } else {
      current = theme;
    }

    setResolvedTheme(current);
    root.classList.add(current);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  /**
   * @brief Switches the theme between dark and light, resolving the system theme first when needed.
   */
  const toggleTheme = () => {
    setTheme((prev) => {
      const current = prev === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * @brief Returns the theme context and throws if used outside a ThemeProvider.
 * @return The ThemeContextType object with theme, resolvedTheme, setTheme and toggleTheme.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé au sein d\'un ThemeProvider');
  }
  return context;
}

