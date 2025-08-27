import * as React from 'react';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'info';
};

const toneMap = {
  neutral: 'bg-muted text-fg',
  positive: 'bg-success-500/15 text-success-500 ring-1 ring-success-500/30',
  warning: 'bg-warning-500/15 text-warning-500 ring-1 ring-warning-500/30',
  danger: 'bg-destructive-500/15 text-destructive-500 ring-1 ring-destructive-500/30',
  info: 'bg-info-500/15 text-info-500 ring-1 ring-info-500/30'
};

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs', toneMap[tone], className].join(' ')}
      {...props}
    />
  );
}
