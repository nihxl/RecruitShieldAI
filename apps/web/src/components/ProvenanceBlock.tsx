/**
 * ProvenanceBlock — Disclaimer and provenance footer (PRD §5 Honesty rule, FR-5.1)
 *
 * ASSUMPTIONS (recorded for product-owner confirmation):
 *   - mock   → "Source: Mock analyzer. Example logic, not a trained model."
 *   - rules  → "Source: Pattern rules"
 *   - model  → "Source: Trained model {modelVersion}" (modelVersion is required for this source)
 *
 * The generated time is shown in the viewer's local time zone by default.
 * Pass showUtc={true} to also show the UTC equivalent (used by the PDF report).
 *
 * Task 3.1 will add the real Zod contract; this type is intentionally minimal.
 */

import React from 'react';
import { MICROCOPY } from '@/lib/constants';

// ── Local minimal type (Task 3.1 will replace this) ─────────────────────────

export type ProvenanceSource = 'model' | 'rules' | 'mock';

export interface Provenance {
  source: ProvenanceSource;
  /** Required when source is "model"; ignored otherwise. */
  modelVersion?: string;
  /** ISO-8601 timestamp string. */
  generatedAt: string;
}

export interface ProvenanceBlockProps {
  disclaimer?: string;
  provenance: Provenance;
  /** Also render the UTC timestamp alongside local time. Default false. */
  showUtc?: boolean;
  className?: string;
}

// ── Provenance source wording (PRD §5 Honesty rule) ─────────────────────────

function formatSource(provenance: Provenance): string {
  switch (provenance.source) {
    case 'mock':
      return 'Source: Mock analyzer. Example logic, not a trained model.';
    case 'rules':
      return 'Source: Pattern rules (not a trained model)';
    case 'model': {
      const ver = provenance.modelVersion ?? 'unknown';
      return `Source: Trained model ${ver}`;
    }
  }
}

// ── Time formatting ──────────────────────────────────────────────────────────

function formatLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatUtc(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';
  } catch {
    return iso;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProvenanceBlock({
  disclaimer = MICROCOPY.disclaimer,
  provenance,
  showUtc = false,
  className = '',
}: ProvenanceBlockProps) {
  const sourceText = formatSource(provenance);
  const localTime  = formatLocal(provenance.generatedAt);
  const utcTime    = showUtc ? formatUtc(provenance.generatedAt) : null;

  return (
    <footer
      aria-label="Provenance and disclaimer"
      className={[
        'flex flex-col gap-1 border-t border-outline-variant/20 pt-3 mt-4',
        'text-body-sm text-on-surface-variant',
        className,
      ].join(' ')}
    >
      {/* Disclaimer — always rendered (PRD §5) */}
      <p className="text-on-surface-variant">{disclaimer}</p>

      {/* Provenance line */}
      <p className="text-[12px] text-on-surface-variant/70">
        {sourceText}
        {' · '}
        Generated {localTime}
        {utcTime && ` (${utcTime})`}
      </p>
    </footer>
  );
}
