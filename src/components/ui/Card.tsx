import * as React from 'react';

export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['card', className].join(' ')} {...props} />;
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
