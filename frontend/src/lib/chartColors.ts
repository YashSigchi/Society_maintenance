export const STATUS_COLORS = {
  Open: '#1d4ed8',
  'In Progress': '#c2410c',
  Resolved: '#15803d',
  OPEN: '#1d4ed8',
  IN_PROGRESS: '#c2410c',
  RESOLVED: '#15803d',
} as const;

export const PRIORITY_COLORS = {
  HIGH: '#b91c1c',
  MEDIUM: '#c2410c',
  LOW: '#475569',
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  Plumbing: '#2563eb',
  Cleaning: '#ea580c',
  Electrical: '#16a34a',
  Security: '#dc2626',
  Other: '#7c3aed',
};

const FALLBACK = ['#2563eb', '#ea580c', '#16a34a', '#dc2626', '#7c3aed', '#0891b2'];

export function colorForCategory(name: string, index = 0) {
  return CATEGORY_COLORS[name] || FALLBACK[index % FALLBACK.length];
}
