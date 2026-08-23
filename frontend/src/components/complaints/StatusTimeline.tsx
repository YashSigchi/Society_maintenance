import React from 'react';
import { formatDateTime } from '@/lib/datetime';
import { CheckCircle2, Clock, Flag, PlusCircle } from 'lucide-react';

const iconFor = (eventType: string, status: string) => {
  if (eventType === 'ESCALATION') return <Flag className="w-4 h-4 text-red-500" />;
  if (eventType === 'CREATED' || status === 'OPEN') return <PlusCircle className="w-4 h-4 text-blue-500" />;
  if (status === 'RESOLVED') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
};

const titleFor = (h: any) => {
  if (h.eventType === 'ESCALATION') return 'Auto-escalated (Overdue)';
  if (h.eventType === 'CREATED') return 'Complaint Created';
  if (h.eventType === 'REOPENED') return 'Complaint Reopened';
  if (h.newStatus === 'IN_PROGRESS') return 'In Progress';
  if (h.newStatus === 'RESOLVED') return 'Resolved';
  return h.newStatus?.replace('_', ' ') || 'Update';
};

export function StatusTimeline({ history }: { history: any[] }) {
  if (!history?.length) return <p className="text-sm text-muted-foreground">No timeline events yet.</p>;

  return (
    <div className="relative ml-3 border-l border-gray-200 dark:border-gray-700 space-y-6">
      {history.map((h) => (
        <div key={h.id} className="pl-7 relative">
          <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border flex items-center justify-center">
            {iconFor(h.eventType, h.newStatus)}
          </div>
          <p className="font-semibold text-sm">{titleFor(h)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(h.createdAt)}</p>
          {h.note && <p className="text-sm mt-1">{h.note}</p>}
          <p className="text-xs text-muted-foreground mt-1">{h.actor?.name}</p>
        </div>
      ))}
    </div>
  );
}
