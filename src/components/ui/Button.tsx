import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

const base =
  'inline-flex items-center justify-center rounded-md font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-500))] ' +
  'focus-visible:ring-offset-2 ring-offset-[hsl(var(--bg))] ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base'
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-600/90 shadow-sm',
  ghost:
    'bg-transparent text-fg hover:bg-muted active:bg-muted/80',
  outline:
    'border border-border bg-surface text-fg hover:bg-muted',
  danger:
    'bg-destructive-500 text-white hover:bg-destructive-500/90 active:bg-destructive-500/80'
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const cls = [base, sizes[size], variants[variant], className].join(' ');
  return <button className={cls} {...props} />;
}
