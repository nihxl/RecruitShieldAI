import React from 'react';
import { Icon, IconName } from './Icon';

export type StatusBand = 'Highly Genuine' | 'Likely Genuine' | 'Caution Advised' | 'High Risk' | 'Locked' | 'Simulated' | 'Error';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'status' | 'filter' | 'neutral';
  status?: StatusBand;
  selected?: boolean;
  label: string;
  icon?: IconName;
  iconFilled?: boolean;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ variant, status, selected, label, icon, iconFilled, className = '', ...props }, ref) => {
    let variantClasses = '';
    let iconName = icon;
    let isFilled = iconFilled;

    if (variant === 'status' && status) {
      // 15% fill, 40% border, role color text
      isFilled = true;
      switch (status) {
        case 'Highly Genuine':
          iconName = 'verified';
          variantClasses = 'bg-secondary/15 border-secondary/40 text-secondary border';
          break;
        case 'Likely Genuine':
          iconName = 'check_circle';
          variantClasses = 'bg-secondary/15 border-secondary/40 text-secondary border';
          break;
        case 'Caution Advised':
          iconName = 'warning';
          variantClasses = 'bg-tertiary/15 border-tertiary/40 text-tertiary border';
          break;
        case 'High Risk':
          iconName = 'gpp_maybe';
          variantClasses = 'bg-error/15 border-error/40 text-error border';
          break;
        case 'Locked':
          iconName = 'lock';
          isFilled = false;
          variantClasses = 'bg-outline/15 border-outline/40 text-outline border';
          break;
        case 'Simulated':
          iconName = 'science';
          isFilled = false;
          variantClasses = 'bg-tertiary/15 border-tertiary/40 text-tertiary border';
          break;
        case 'Error':
          iconName = 'error';
          variantClasses = 'bg-error/15 border-error/40 text-error border';
          break;
      }
    } else if (variant === 'filter') {
      if (selected) {
        variantClasses = 'bg-primary-container text-on-primary-container border border-transparent';
      } else {
        variantClasses = 'bg-surface border-outline text-on-surface border hover:bg-surface-container-low cursor-pointer';
      }
    } else if (variant === 'neutral') {
      variantClasses = 'bg-surface-container-highest text-on-surface-variant border border-transparent';
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] text-body-sm font-semibold tracking-wide ${variantClasses} ${className}`}
        {...(variant === 'filter' ? { role: 'button', tabIndex: 0, 'aria-pressed': selected } : {})}
        {...props}
      >
        {iconName && <Icon name={iconName} size={16} filled={isFilled} />}
        <span>{label}</span>
      </div>
    );
  }
);
Chip.displayName = 'Chip';
