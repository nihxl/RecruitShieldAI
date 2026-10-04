import React from 'react';
import { Icon } from './Icon';

// DD §4 Info banner | FR-3.3
export type InfoBannerVariant = 'info' | 'caution';

export interface InfoBannerProps {
  variant?: InfoBannerVariant;
  children: React.ReactNode;
  className?: string;
}

export function InfoBanner({ variant = 'info', children, className = '' }: InfoBannerProps) {
  return (
    <aside
      role="note"
      className={[
        // tertiary-container 20% fill, 1px border at 30%
        'flex items-start gap-3 rounded-[var(--radius-item)] px-4 py-3',
        'bg-tertiary-container/20 border border-tertiary-container/30',
        className,
      ].join(' ')}
    >
      <Icon
        name={variant === 'caution' ? 'warning' : 'info'}
        size={18}
        className="shrink-0 mt-0.5 text-tertiary"
        aria-hidden="true"
      />
      {/* body-sm text in tertiary-fixed-dim */}
      <p className="text-body-sm text-tertiary-fixed-dim leading-relaxed">{children}</p>
    </aside>
  );
}
