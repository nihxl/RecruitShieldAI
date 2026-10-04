import React from 'react';
import { Icon, IconName } from './Icon';

// DD §4 Stat card | FR-6.1
export type StatCardVariant = 'total' | 'high-trust' | 'caution' | 'in-progress';

export interface StatCardProps {
  variant?: StatCardVariant;
  label: string;
  value: string | number;
  icon?: IconName;
  className?: string;
}

// 4px left border by variant
const BORDER_CLS: Record<StatCardVariant, string> = {
  'total':       'border-l-outline',
  'high-trust':  'border-l-secondary',
  'caution':     'border-l-tertiary',
  'in-progress': 'border-l-outline',
};

const ICON_CLS: Record<StatCardVariant, string> = {
  'total':       'bg-outline/10 text-outline',
  'high-trust':  'bg-secondary/10 text-secondary',
  'caution':     'bg-tertiary/10 text-tertiary',
  'in-progress': 'bg-outline/10 text-outline',
};

const DEFAULT_ICON: Record<StatCardVariant, IconName> = {
  'total':       'shield',
  'high-trust':  'verified',
  'caution':     'warning',
  'in-progress': 'progress_activity',
};

export function StatCard({
  variant = 'total',
  label,
  value,
  icon,
  className = '',
}: StatCardProps) {
  const iconName = icon ?? DEFAULT_ICON[variant];

  return (
    // card radius 24, 24px padding, 4px left border
    <div
      className={[
        'rounded-[var(--radius-card)] bg-surface-container p-6 border-l-4',
        BORDER_CLS[variant],
        'flex items-center gap-4',
        className,
      ].join(' ')}
    >
      {/* Round icon well */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ICON_CLS[variant]}`}
        aria-hidden="true"
      >
        <Icon name={iconName} size={24} filled />
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        {/* label-caps label */}
        <span className="text-label-caps font-semibold uppercase tracking-widest text-on-surface-variant text-[12px]">
          {label}
        </span>
        {/* h2 number */}
        <span className="text-h2-desktop font-semibold text-on-surface leading-none">
          {value}
        </span>
      </div>
    </div>
  );
}
