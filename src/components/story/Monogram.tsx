import { cn } from '@/lib/utils';

/**
 * K & R, set as a monogram. Two initials, a hairline either side, nothing else —
 * the restraint is the point.
 */
export function Monogram({
  initials,
  className,
  size = 'md',
}: {
  initials: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const scale = {
    sm: 'text-sm',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl',
  }[size];

  return (
    <span className={cn('inline-flex items-center gap-4', className)}>
      <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-transparent to-champagne/45 sm:w-12" />
      <span className={cn('monogram foil', scale)}>{initials}</span>
      <span aria-hidden="true" className="h-px w-8 bg-gradient-to-l from-transparent to-champagne/45 sm:w-12" />
    </span>
  );
}
