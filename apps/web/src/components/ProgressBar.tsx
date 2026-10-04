import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  showLabel?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, label, showLabel = false, className = '', ...props }, ref) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    return (
      <div className={`flex flex-col gap-2 ${className}`} ref={ref} {...props}>
        {showLabel && label && (
          <div className="text-label-caps text-on-surface uppercase font-semibold">
            {label}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className="h-[6px] w-full bg-surface-container-highest rounded-[var(--radius-pill)] overflow-hidden"
        >
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';
