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
    <header className="sticky top-0 z-50 border-b bg-transparent">
      <div className="container">
        <div className="glass glass-highlight glass-e2 rounded-[28px] mt-3 mb-4 px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="DepthLens" className="h-7 w-7" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide">DepthLens</span>
                <span className="text-xs text-fg/70">See risk in the flow</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
