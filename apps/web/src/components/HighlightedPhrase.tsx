'use client';
/**
 * HighlightedPhrase — FR-4.1, FR-4.5 | DD §4
 *
 * Takes plain text and an array of {start, end} spans and renders
 * React text nodes with mark-style highlights. No dangerouslySetInnerHTML anywhere.
 *
 * IMPORTANT: offsets are UTF-16 code unit indexes (String.prototype.slice semantics).
 * Task 3.2's flag rules must use the same convention when they produce spans.
 *
 * Edge cases handled:
 *   - Adjacent spans (touching end/start) — merged into a single highlight
 *   - Overlapping spans — union of the range is highlighted
 *   - Spans touching start (start=0) or end (end=text.length) of text
 *   - Out-of-range spans — clamped to text bounds and ignored if empty after clamping
 *   - Empty spans (start >= end after clamping) — silently dropped
 *   - User text containing HTML like <script> — rendered as text nodes, never innerHTML
 */

import React from 'react';
import { Tooltip } from './Tooltip';

import type { LanguageFlag } from '@/lib/AnalysisContract';

export type Span = LanguageFlag['span'];

export interface HighlightedPhraseProps {
  /** The plain text to display. Rendered as text nodes — never as HTML. */
  text: string;
  /** UTF-16 code unit index pairs. May be unsorted, overlapping, out-of-range or empty. */
  spans: Span[];
  /** Optional tooltip content for every highlight. */
  tooltipContent?: React.ReactNode;
  className?: string;
}

/** Normalise spans: clamp, drop empty, sort, merge overlapping/adjacent. */
function normalise(spans: Span[], len: number): Span[] {
  const clamped: Span[] = spans
    .map((s) => ({ start: Math.max(0, s.start), end: Math.min(len, s.end) }))
    .filter((s) => s.start < s.end);

  if (clamped.length === 0) return [];

  clamped.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Span[] = [clamped[0]];
  for (let i = 1; i < clamped.length; i++) {
    const last = merged[merged.length - 1];
    const cur = clamped[i];
    if (cur.start <= last.end) {
      // overlapping or adjacent — extend
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

interface SegmentHighlightProps {
  text: string;
  tooltipContent?: React.ReactNode;
}

function SegmentHighlight({ text, tooltipContent }: SegmentHighlightProps) {
  const mark = (
    <mark
      tabIndex={0}
      className={[
        'bg-tertiary-container/15 no-underline decoration-dotted decoration-1',
        'underline underline-offset-2 [text-decoration-color:var(--color-tertiary-container)]',
        'decoration-dotted rounded-sm cursor-default',
        'hover:bg-tertiary-container/30 focus:bg-tertiary-container/30',
        'focus:outline-none focus:ring-1 focus:ring-tertiary-container',
        'transition-colors',
      ].join(' ')}
      style={{ backgroundColor: undefined }} // let Tailwind handle opacity
    >
      {text}
    </mark>
  );

  if (!tooltipContent) return mark;

  return (
    <Tooltip content={tooltipContent}>
      {mark}
    </Tooltip>
  );
}

export function HighlightedPhrase({
  text,
  spans,
  tooltipContent,
  className = '',
}: HighlightedPhraseProps) {
  const normalised = normalise(spans, text.length);

  if (normalised.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const span of normalised) {
    if (cursor < span.start) {
      nodes.push(
        <React.Fragment key={`plain-${cursor}`}>
          {text.slice(cursor, span.start)}
        </React.Fragment>
      );
    }
    nodes.push(
      <SegmentHighlight
        key={`mark-${span.start}`}
        text={text.slice(span.start, span.end)}
        tooltipContent={tooltipContent}
      />
    );
    cursor = span.end;
  }

  if (cursor < text.length) {
    nodes.push(
      <React.Fragment key={`plain-${cursor}`}>
        {text.slice(cursor)}
      </React.Fragment>
    );
  }

  return <span className={`inline ${className}`}>{nodes}</span>;
}
