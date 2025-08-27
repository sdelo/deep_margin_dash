export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';

    const saved = localStorage.getItem('theme') as Theme;
    if (saved && (saved === 'light' || saved === 'dark')) {
        return saved;
    }

    // Default to dark mode
    return 'dark';
}

export function setTheme(theme: Theme) {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (theme === 'light') {
        root.classList.add('light');
    } else {
        root.classList.remove('light');
    }

    localStorage.setItem('theme', theme);
}

export function toggleTheme(): Theme {
    const current = getTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    return newTheme;
}

// Initialize theme on load
export function initializeTheme() {
    if (typeof window === 'undefined') return;

    const theme = getTheme();
    setTheme(theme);
}
