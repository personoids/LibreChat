import React, { createContext, useState, useEffect } from 'react';

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('color-theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs;
    }

    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }

  return 'light'; // light theme as the default;
};

type Theme = {
  name: string;
  properties: { [key: string]: string };
};

type ProviderValue = {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  themes: Theme[];
  addTheme: (theme: Theme) => void;
};

const defaultContextValue: ProviderValue = {
  theme: getInitialTheme(),
  setTheme: () => {
    return;
  },
  themes: [],
  addTheme: () => {
    return;
  },
};

export const isDark = (theme: string): boolean => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return theme === 'dark';
};

export const ThemeContext = createContext<ProviderValue>(defaultContextValue);

export const ThemeProvider = ({ initialTheme, children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [themes, setThemes] = useState<Theme[]>([
    { name: 'light', properties: {} },
    { name: 'dark', properties: {} },
    {
      name: 'gcp',
      properties: { '--primary': '#4285F4', '--background': '#FFFFFF', '--text': '#000000' },
    },
    {
      name: 'aws',
      properties: { '--primary': '#FF9900', '--background': '#232F3E', '--text': '#FFFFFF' },
    },
  ]);

  const rawSetTheme = (rawTheme: string) => {
    const root = window.document.documentElement;
    const darkMode = isDark(rawTheme);

    root.classList.remove(darkMode ? 'light' : 'dark');
    root.classList.add(darkMode ? 'dark' : 'light');

    localStorage.setItem('color-theme', rawTheme);

    const themeProperties = themes.find((t) => t.name === rawTheme)?.properties || {};
    Object.keys(themeProperties).forEach((key) => {
      root.style.setProperty(key, themeProperties[key]);
    });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const changeThemeOnSystemChange = () => {
      rawSetTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', changeThemeOnSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', changeThemeOnSystemChange);
    };
  }, []);

  if (initialTheme) {
    rawSetTheme(initialTheme);
  }

  useEffect(() => {
    rawSetTheme(theme);
  }, [theme]);

  const addTheme = (newTheme: Theme) => {
    setThemes((prevThemes) => [...prevThemes, newTheme]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, addTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
