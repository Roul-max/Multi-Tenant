import * as React from 'react';
import { cn } from '@/lib/utils';

function DataTable({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

function DataTableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('bg-muted px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground', className)} {...props} />;
}

function DataTableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-t px-4 py-3 align-middle', className)} {...props} />;
}

export { DataTable, DataTableHead, DataTableCell };
