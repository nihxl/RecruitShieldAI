import React, { useId, useState } from 'react';
import { Icon } from './Icon';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, maxLength = 5000, className = '', id, onChange, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const defaultId = useId();
    const textareaId = id || defaultId;
    const errorId = `${textareaId}-error`;
    const counterId = `${textareaId}-counter`;
    const [charCount, setCharCount] = useState(0);

    const isLimitReached = charCount >= maxLength;
    const isError = !!error || isLimitReached;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <label htmlFor={textareaId} className="text-label-caps text-on-surface uppercase tracking-wider font-semibold">
          {label}
        </label>
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            maxLength={maxLength}
            onChange={handleChange}
            aria-invalid={isError}
            aria-describedby={`${counterId} ${error ? errorId : ''} ${ariaDescribedBy || ''}`.trim()}
            className={`w-full min-h-[128px] px-4 py-3 bg-surface-container-highest border ${
              isError ? 'border-error focus:ring-error/15' : 'border-outline focus:ring-primary/15'
            } rounded-[var(--radius-control)] text-body-md text-on-surface placeholder-outline focus:outline-none focus:ring-4 transition-shadow motion-reduce:transition-none disabled:opacity-40 disabled:cursor-not-allowed resize-y`}
            {...props}
          />
          {error && !isLimitReached && (
            <div className="absolute right-3 top-3 text-error pointer-events-none">
              <Icon name="error" filled />
            </div>
          )}
        </div>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {error && (
              <div id={errorId} className="flex items-center gap-1.5 text-body-sm text-error">
                <Icon name="error" size={16} filled />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div
            id={counterId}
            className={`text-body-sm shrink-0 ${isLimitReached ? 'text-error font-semibold' : 'text-on-surface-variant'}`}
            aria-live="polite"
          >
            {charCount}/{maxLength}
          </div>
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
