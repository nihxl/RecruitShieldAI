import React from 'react';
import { Icon, IconName } from './Icon';
import { Button } from './Button';
import { MICROCOPY } from '@/lib/constants';

// DD §4 Empty block and Error block | FR-8

// ── Shared types ─────────────────────────────────────────────────────────────

interface FeedbackAction {
  label: string;
  onClick: () => void;
}

// ── Empty block ───────────────────────────────────────────────────────────────

export interface EmptyBlockProps {
  icon?: IconName;
  title?: string;
  body?: string;
  action?: FeedbackAction;
  className?: string;
}

/** Centred icon in a 48px well, h3 title, body-sm text, one primary action (DD §4). */
export function EmptyBlock({
  icon = 'search',
  title = MICROCOPY.emptyHistory,
  body,
  action,
  className = '',
}: EmptyBlockProps) {
  return (
    <div className={`flex flex-col items-center gap-4 py-12 px-6 text-center ${className}`}>
      {/* 48px icon well */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-outline/10">
        <Icon name={icon} size={24} className="text-outline" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-h3-desktop font-semibold text-on-surface">{title}</h3>
        {body && <p className="text-body-sm text-on-surface-variant max-w-xs">{body}</p>}
      </div>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ── Error block ───────────────────────────────────────────────────────────────

export interface ErrorBlockProps {
  icon?: IconName;
  title?: string;
  body?: string;
  action?: FeedbackAction;
  className?: string;
}

/**
 * Error block — centred icon in 48px well, h3, body-sm, one primary action.
 * role="alert" makes screen readers announce it on mount (FR-8, DD §4).
 * Default copy from DD §10 "Analysis failed".
 */
export function ErrorBlock({
  icon = 'error',
  title = 'Something went wrong',
  body = MICROCOPY.analysisFailed,
  action,
  className = '',
}: ErrorBlockProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex flex-col items-center gap-4 py-12 px-6 text-center ${className}`}
    >
      {/* 48px icon well — error color */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
        <Icon name={icon} size={24} className="text-error" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-h3-desktop font-semibold text-on-surface">{title}</h3>
        {body && <p className="text-body-sm text-on-surface-variant max-w-xs">{body}</p>}
      </div>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
