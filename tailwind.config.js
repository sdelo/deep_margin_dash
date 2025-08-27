/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: 'hsl(var(--bg))',
                fg: 'hsl(var(--fg))',
                surface: 'hsl(var(--surface))',
                muted: 'hsl(var(--muted))',
                border: 'hsl(var(--border))',
                brand: {
                    50: 'hsl(var(--brand-50))',
                    100: 'hsl(var(--brand-100))',
                    200: 'hsl(var(--brand-200))',
                    300: 'hsl(var(--brand-300))',
                    400: 'hsl(var(--brand-400))',
                    500: 'hsl(var(--brand-500))',
                    600: 'hsl(var(--brand-600))',
                    700: 'hsl(var(--brand-700))',
                    800: 'hsl(var(--brand-800))',
                    900: 'hsl(var(--brand-900))',
                    950: 'hsl(var(--brand-950))'
                },
                accent: {
                    400: 'hsl(var(--accent-400))',
                    500: 'hsl(var(--accent-500))',
                    600: 'hsl(var(--accent-600))'
                },
                success: { 500: 'hsl(var(--success-500))' },
                warning: { 500: 'hsl(var(--warning-500))' },
                destructive: { 500: 'hsl(var(--destructive-500))' },
                info: { 500: 'hsl(var(--info-500))' }
            }
        }
    },
    plugins: []
}
