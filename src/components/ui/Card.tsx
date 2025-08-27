import * as React from 'react';

type Elevation = 'e0' | 'e1' | 'e2' | 'e3' | 'e4'

export function Card({ className = '', elevation = 'e1', ...props }: React.HTMLAttributes<HTMLDivElement> & { elevation?: Elevation }) {
  const glass = `glass glass-highlight glass-${elevation} rounded-md p-4`;
  return <div className={[glass, className].join(' ')} {...props} />;
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-fg/70">{subtitle}</p>}
    </div>
  );
}

export function CardFooter({ children }: { children?: React.ReactNode }) {
  return <div className="mt-4 pt-3 border-t border">{children}</div>;
}
