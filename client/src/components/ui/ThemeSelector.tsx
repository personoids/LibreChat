
import React, { useContext } from 'react';
import { ThemeContext } from '../../hooks/ThemeContext';

const ThemeSelector = () => {
  const { changeTheme } = useContext(ThemeContext);

  return (
    <div>
      <h2>Select Theme</h2>
      <button onClick={() => changeTheme('aws')}>AWS Theme</button>
      <button onClick={() => changeTheme('gcp')}>GCP Theme</button>
    </div>
  );
};

export default ThemeSelector;
