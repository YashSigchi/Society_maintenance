import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: 'bg-blue-700 text-white dark:bg-blue-500 dark:text-blue-950',
    IN_PROGRESS: 'bg-orange-700 text-white dark:bg-orange-400 dark:text-orange-950',
    RESOLVED: 'bg-green-700 text-white dark:bg-green-400 dark:text-green-950',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize', styles[status] || 'bg-slate-700 text-white')}>
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-red-700 text-white dark:bg-red-400 dark:text-red-950',
    MEDIUM: 'bg-orange-700 text-white dark:bg-orange-400 dark:text-orange-950',
    LOW: 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', styles[priority] || 'bg-slate-700 text-white')}>
      {priority}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-700 text-white">
      Overdue
    </span>
  );
}
