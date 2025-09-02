import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { toggleTheme, getTheme, type Theme } from '../utils/theme';
import Logo from '../assets/depthlens-logo.svg';

interface AppHeaderProps {
  activeTab: 'overview' | 'pools' | 'liquidations' | 'borrowers' | 'lending';
  onTabChange: (tab: 'overview' | 'pools' | 'liquidations' | 'borrowers' | 'lending') => void;
}

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  const [theme, setThemeState] = useState<Theme>('dark');
  // 👇 This is the "current account"
  // It is `null` until a wallet connects.
  const account = useCurrentAccount();

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-transparent">
      <div className="mx-20 px-20">
        <div className="glass glass-highlight glass-e2 rounded-[28px] mt-3 mb-4 px-25">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="DepthLens" className="h-7 w-7" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide">DepthLens</span>
                <span className="text-xs text-fg/70">See risk in the flow</span>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTabChange('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onTabChange('pools')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'pools'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                Pools & Debt
              </button>
              <button
                onClick={() => onTabChange('liquidations')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'liquidations'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                Liquidations Feed
              </button>
              <button
                onClick={() => onTabChange('borrowers')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'borrowers'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                Borrowers Explorer
              </button>
              <button
                onClick={() => onTabChange('lending')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'lending'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                Lending
              </button>
            </div>

            {/* Wallet Connection Section */}
            <div className="flex items-center gap-3">
              {/* Opens a modal listing detected wallets (Slush will show here if installed) */}
              <ConnectButton />
              
              {/* After connecting, show the connected Sui address */}
              {account && (
                <code className="text-xs opacity-80 text-gray-400">
                  {account.address}
                </code>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
