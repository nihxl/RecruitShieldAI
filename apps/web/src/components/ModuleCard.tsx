'use client';
import React, { useId } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { STATUS_BANDS, type BandId } from '@/lib/statusMap';

import type { ModuleResult } from '@/lib/AnalysisContract';

// FR-3.3, FR-3.4 | DD §4 Module card
export type ModuleCardVariant = NonNullable<ModuleResult['verdict']> | Exclude<ModuleResult['status'], 'complete'>;


interface ModuleCardBaseProps {
  title: string;
  summary?: string;
  /** Maps to the visual style; 'pass' uses the Likely Genuine band, etc. */
  variant: ModuleCardVariant;
  className?: string;
}

interface ModuleCardExpandableProps extends ModuleCardBaseProps {
  mode: 'expandable';
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

interface ModuleCardNavigatingProps extends ModuleCardBaseProps {
  mode: 'navigating';
  href: string;
}

interface ModuleCardStaticProps extends ModuleCardBaseProps {
  mode?: 'static';
}

export type ModuleCardProps =
  | ModuleCardExpandableProps
  | ModuleCardNavigatingProps
  | ModuleCardStaticProps;

// Map task-level variants to statusMap band IDs
const VARIANT_TO_BAND: Record<ModuleCardVariant, BandId> = {
  pass: 'likely-genuine',
  caution: 'caution-advised',
  fail: 'high-risk',
  locked: 'locked',
  simulated: 'simulated',
  error: 'error',
};

// Classes derived from colorRole token — no hex
const COLOR_CLASSES: Record<string, { border: string; icon: string; bg: string }> = {
  secondary: {
    border: 'border-l-secondary',
    icon: 'text-secondary bg-secondary/10',
    bg: '',
  },
  tertiary: {
    border: 'border-l-tertiary',
    icon: 'text-tertiary bg-tertiary/10',
    bg: '',
  },
  'tertiary-outline': {
    border: 'border-l-tertiary',
    icon: 'text-tertiary bg-tertiary/10',
    bg: '',
  },
  error: {
    border: 'border-l-error',
    icon: 'text-error bg-error/10',
    bg: '',
  },
  outline: {
    border: 'border-l-outline',
    icon: 'text-outline bg-outline/10',
    bg: '',
  },
};

const ALERT_VARIANTS: ModuleCardVariant[] = ['caution', 'fail', 'error'];

export function ModuleCard(props: ModuleCardProps) {
  const { variant, title, summary, className = '' } = props;
  const mode = 'mode' in props ? props.mode : 'static';

  const band = STATUS_BANDS[VARIANT_TO_BAND[variant]];
  const isAlert = ALERT_VARIANTS.includes(variant);
  const isLocked = variant === 'locked';
  const colorKey = band.colorRole;
  const colorCls = COLOR_CLASSES[colorKey] ?? COLOR_CLASSES['outline'];

  const panelId = useId();
  const triggerId = useId();
  const [open, setOpen] = React.useState(
    mode === 'expandable' && (props as ModuleCardExpandableProps).defaultOpen === true
  );

  // DD §4: 4px status-color left border for alert states only (caution, fail, error).
  // pass, locked and simulated have no colored border.
  const borderCls = isAlert
    ? `border-l-4 ${colorCls.border}`
    : 'border-l-4 border-l-transparent';

  const baseCardCls = [
    'rounded-[var(--radius-item)] bg-surface-container overflow-hidden',
    borderCls,
    isLocked ? 'opacity-60' : '',
    className,
  ].join(' ');

  const headerContent = (
    <>
      {/* 32px icon well */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorCls.icon}`}
        aria-hidden="true"
      >
        <Icon name={band.icon as import('./Icon').IconName} size={18} filled={variant !== 'locked' && variant !== 'simulated'} />
      </div>

      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        {/* h3 title at 20px via text-[20px] */}
        <h3 className="text-[20px] font-semibold leading-snug text-on-surface truncate">{title}</h3>
        {summary && (
          <p className="text-body-sm text-on-surface-variant line-clamp-1">{summary}</p>
        )}
      </div>
    </>
  );

  if (mode === 'navigating' && !isLocked) {
    const { href } = props as ModuleCardNavigatingProps;
    return (
      <Link
        href={href}
        className={`${baseCardCls} flex items-center gap-3 p-4 group hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors`}
        aria-label={`${title}: ${summary ?? ''}`}
      >
        {headerContent}
        <Icon
          name="chevron_right"
          size={20}
          className="shrink-0 text-on-surface-variant group-hover:text-on-surface transition-colors"
        />
      </Link>
    );
  }

  if (mode === 'expandable' && !isLocked) {
    const { children } = props as ModuleCardExpandableProps;
    return (
      <div className={baseCardCls}>
        <button
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset transition-colors"
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          {headerContent}
          <Icon
            name="expand_more"
            size={20}
            className={`shrink-0 text-on-surface-variant transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* 300ms reveal */}
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
          style={{ maxHeight: open ? '1000px' : '0', opacity: open ? 1 : 0 }}
        >
          <div className="px-4 pb-4 pt-0">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Static / locked
  return (
    <div
      className={`${baseCardCls} flex items-center gap-3 p-4`}
      aria-disabled={isLocked}
    >
      {headerContent}
    </div>
  );
}
