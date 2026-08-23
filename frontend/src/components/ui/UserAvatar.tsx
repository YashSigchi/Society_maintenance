import { cn } from '@/lib/utils';

const PALETTE = [
  'bg-indigo-600 text-white',
  'bg-blue-700 text-white',
  'bg-emerald-700 text-white',
  'bg-rose-700 text-white',
  'bg-amber-600 text-white',
  'bg-violet-700 text-white',
  'bg-cyan-700 text-white',
];

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-20 h-20 text-2xl',
};

function colorFor(name?: string) {
  const seed = (name || '?').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return PALETTE[seed % PALETTE.length];
}

export function UserAvatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || 'S';

  return (
    <div
      className={cn(
        'rounded-full shrink-0 overflow-hidden flex items-center justify-center font-semibold',
        SIZES[size],
        !src && colorFor(name || undefined),
        className
      )}
      aria-hidden={!name}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
