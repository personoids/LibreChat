
import React, { createContext, useState, useEffect } from 'react';
import awsTheme from '../themes/awsTheme';
import gcpTheme from '../themes/gcpTheme';

const ThemeContext = createContext();

const themes = {
  aws: awsTheme,
  gcp: gcpTheme,
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.aws);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes[savedTheme]) {
      setTheme(themes[savedTheme]);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--background', theme.background);
    document.documentElement.style.setProperty('--text', theme.text);
    document.documentElement.style.setProperty('--border', theme.border);
    document.documentElement.style.setProperty('--gradient', theme.gradient);
  }, [theme]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setTheme(themes[themeName]);
      localStorage.setItem('theme', themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeProvider, ThemeContext };
