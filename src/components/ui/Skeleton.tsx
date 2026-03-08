import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  )
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton variations
export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4', className)}>
    <div className="flex items-start justify-between">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <SkeletonText lines={2} />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded" />
      <Skeleton className="h-6 w-20 rounded" />
    </div>
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const SkeletonStatCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-xl p-6 space-y-2', className)}>
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-16" />
  </div>
);

export default Skeleton;
