import { useState, useEffect } from 'react';
import { toggleTheme, getTheme, type Theme } from '../utils/theme';
import Logo from '../assets/depthlens-logo.svg';

export function AppHeader() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-bg/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="DepthLens" className="h-7 w-7" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-wide">DepthLens</span>
            <span className="text-xs text-fg/70">See risk in the flow</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-9 px-3 rounded-md bg-muted text-sm hover:bg-muted/80 transition-colors"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
