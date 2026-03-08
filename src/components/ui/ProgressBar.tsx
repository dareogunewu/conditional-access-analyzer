import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'default',
  showLabel = false,
  label,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    default: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-green-600 dark:bg-green-500',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-600 dark:bg-red-500',
    info: 'bg-cyan-600 dark:bg-cyan-500',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {showLabel && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          heights[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colors[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Stacked progress bar for multiple segments
interface StackedProgressBarProps {
  segments: {
    value: number;
    color: 'success' | 'warning' | 'danger' | 'info' | 'default';
    label?: string;
  }[];
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  className?: string;
}

export const StackedProgressBar: React.FC<StackedProgressBarProps> = ({
  segments,
  size = 'md',
  showLegend = false,
  className,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    default: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-green-600 dark:bg-green-500',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-600 dark:bg-red-500',
    info: 'bg-cyan-600 dark:bg-cyan-500',
  };

  const dotColors = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-amber-500',
    danger: 'bg-red-600',
    info: 'bg-cyan-600',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex',
          heights[size]
        )}
        role="progressbar"
      >
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className={cn(
                'h-full transition-all duration-500 ease-out',
                colors[segment.color],
                index === 0 && 'rounded-l-full',
                index === segments.length - 1 && 'rounded-r-full'
              )}
              style={{ width: `${percentage}%` }}
            />
          );
        })}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className={cn('w-2.5 h-2.5 rounded-full', dotColors[segment.color])}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.label || `Segment ${index + 1}`} ({segment.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
