import React, { useContext, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '~/hooks';

const Theme = ({ theme, onChange }: { theme: string; onChange: (value: string) => void }) => {
  const themeIcons = {
    system: <Sun />,
    dark: <Moon color="white" />,
    light: <Sun />,
  };

  return (
    <div className="flex items-center justify-between">
      <div className="cursor-pointer" onClick={() => onChange(theme)}>
        {themeIcons[theme] || <Sun />}
      </div>
    </div>
  );
};

const ThemeSelector = ({ returnThemeOnly }: { returnThemeOnly?: boolean }) => {
  const { theme, setTheme, themes } = useContext(ThemeContext);
  const changeTheme = useCallback(
    (value: string) => {
      setTheme(value);
    },
    [setTheme],
  );

  if (returnThemeOnly) {
    return <Theme theme={theme} onChange={changeTheme} />;
  }

  return (
    <div className="flex flex-col items-center justify-center bg-white pt-6 dark:bg-gray-900 sm:pt-0">
      <div className="absolute bottom-0 left-0 m-4">
        <Theme theme={theme} onChange={changeTheme} />
      </div>
      <select
        value={theme}
        onChange={(e) => changeTheme(e.target.value)}
        className="mt-4 rounded border p-2"
      >
        {themes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ThemeSelector;
