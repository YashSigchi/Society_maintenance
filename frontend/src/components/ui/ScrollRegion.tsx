import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function ScrollRegion({
  children,
  className,
  fadeFrom = 'from-white dark:from-gray-800',
}: {
  children: React.ReactNode;
  className?: string;
  fadeFrom?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowTop(scrollTop > 6);
    setShowBottom(scrollTop + clientHeight < scrollHeight - 6);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, children]);

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      {showTop && (
        <div
          className={cn('pointer-events-none absolute inset-x-0 top-0 h-7 z-10 bg-gradient-to-b to-transparent', fadeFrom)}
          aria-hidden
        />
      )}
      <div ref={ref} onScroll={update} className="h-full overflow-y-auto overscroll-contain custom-scrollbar pr-1">
        {children}
      </div>
      {showBottom && (
        <div
          className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-7 z-10 bg-gradient-to-t to-transparent', fadeFrom)}
          aria-hidden
        />
      )}
    </div>
  );
}
