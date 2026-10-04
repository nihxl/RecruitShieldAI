import React from 'react';
import { Icon, IconName } from './Icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'destructive';
  isLoading?: boolean;
  icon?: IconName;
  iconFilled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, icon, iconFilled, children, className = '', disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-6 text-button font-semibold rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface motion-safe:transition-all motion-safe:duration-150 motion-safe:active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed';
    
    let variantClasses = '';
    switch (variant) {
      case 'primary':
        variantClasses = 'bg-primary text-on-primary shadow-[var(--shadow-level-1)] hover:bg-primary-container hover:text-on-primary-container';
        break;
      case 'secondary':
        variantClasses = 'bg-transparent border border-primary text-primary hover:bg-primary/10';
        break;
      case 'text':
        variantClasses = 'bg-transparent text-primary hover:bg-primary/10 px-4';
        break;
      case 'destructive':
        variantClasses = 'bg-transparent border border-error text-error hover:bg-error/10';
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${className}`}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Icon name="progress_activity" className="animate-spin motion-reduce:animate-none" />
        ) : icon ? (
          <Icon name={icon} filled={iconFilled} />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
