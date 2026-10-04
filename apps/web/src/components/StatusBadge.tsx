'use client';
/**
 * StatusBadge — Simulated badge and Coming Soon chip (DD §3.2, DD §4, DD §10, PRD §5)
 *
 * Both components take their color, icon and label from the status map.
 * Tooltip text comes from MICROCOPY (DD §10).
 * Tooltip works by hover, focus and tap (Tooltip component from Task 2.3).
 */

import React from 'react';
import { Tooltip } from './Tooltip';
import { Icon } from './Icon';
import { STATUS_BANDS } from '@/lib/statusMap';
import { MICROCOPY } from '@/lib/constants';

// ── Simulated badge ──────────────────────────────────────────────────────────

export interface SimulatedBadgeProps {
  className?: string;
}

/**
 * DD §3.2: Simulated — tertiary outline, science icon, "Simulated" label.
 * Tooltip from DD §10: "Example result for demonstration. Not based on a real check."
 */
export function SimulatedBadge({ className = '' }: SimulatedBadgeProps) {
  const band = STATUS_BANDS['simulated'];

  return (
    <Tooltip content={MICROCOPY.simulatedTooltip}>
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1',
          // tertiary-outline: tertiary text, transparent fill, tertiary border
          'bg-tertiary/10 border border-tertiary/40 text-tertiary',
          'text-[12px] font-semibold uppercase tracking-wide',
          'cursor-default select-none',
          className,
        ].join(' ')}
        // The Tooltip's trigger already has tabIndex; nothing more needed here
      >
        <Icon
          name={band.icon as import('./Icon').IconName}
          size={14}
          filled={false}
          aria-hidden="true"
        />
        {band.label}
      </span>
    </Tooltip>
  );
}

// ── Coming Soon chip ─────────────────────────────────────────────────────────

export interface ComingSoonChipProps {
  className?: string;
}

/**
 * DD §3.2: Locked / not run — outline color, lock icon, "Coming Soon" label.
 * Tooltip from DD §10: "This check is under development and will arrive in a later release."
 */
export function ComingSoonChip({ className = '' }: ComingSoonChipProps) {
  const band = STATUS_BANDS['locked'];

  return (
    <Tooltip content={MICROCOPY.comingSoonTooltip}>
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1',
          // outline color: outline text, transparent fill, outline border
          'bg-outline/10 border border-outline/40 text-outline',
          'text-[12px] font-semibold uppercase tracking-wide',
          'cursor-default select-none',
          className,
        ].join(' ')}
      >
        <Icon
          name={band.icon as import('./Icon').IconName}
          size={14}
          filled={false}
          aria-hidden="true"
        />
        {band.label}
      </span>
    </Tooltip>
  );
}
