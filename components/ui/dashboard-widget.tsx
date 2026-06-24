import * as React from 'react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  meta?: string;
  className?: string;
}

function DashboardWidget({ label, value, icon, meta, className }: DashboardWidgetProps) {
  return (
    <article className={cn('rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-muted-foreground/30', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>
      {meta ? <p className="mt-4 text-xs text-muted-foreground">{meta}</p> : null}
    </article>
  );
}

export { DashboardWidget };
