import React, { useId } from 'react';
import { Icon } from './Icon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;
    const errorId = `${inputId}-error`;

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <label htmlFor={inputId} className="text-label-caps text-on-surface uppercase tracking-wider font-semibold">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${errorId} ${ariaDescribedBy || ''}`.trim() : ariaDescribedBy}
            className={`w-full min-h-[48px] px-4 bg-surface-container-highest border ${
              error ? 'border-error focus:ring-error/15' : 'border-outline focus:ring-primary/15'
            } rounded-[var(--radius-control)] text-body-md text-on-surface placeholder-outline focus:outline-none focus:ring-4 transition-shadow motion-reduce:transition-none disabled:opacity-40 disabled:cursor-not-allowed`}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">
              <Icon name="error" filled />
            </div>
          )}
        </div>
        {error && (
          <div id={errorId} className="flex items-center gap-1.5 text-body-sm text-error">
            <Icon name="error" size={16} filled />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
