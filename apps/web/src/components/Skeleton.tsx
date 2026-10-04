import React from 'react';

// DD §4 Skeleton | FR-8
// Three shapes: line, card, circle. Slow opacity pulse.
// No animation under prefers-reduced-motion.

type SkeletonShape = 'line' | 'card' | 'circle';

interface SkeletonProps {
  shape?: SkeletonShape;
  /** Width as a Tailwind class or CSS value. For lines default is full-width. */
  width?: string;
  /** Height override (Tailwind class). */
  height?: string;
  className?: string;
}

const SHAPE_BASE: Record<SkeletonShape, string> = {
  line:   'h-4 w-full rounded-[var(--radius-control)]',
  card:   'h-32 w-full rounded-[var(--radius-card)]',
  circle: 'h-12 w-12 rounded-full',
};

export function Skeleton({ shape = 'line', width, height, className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        'bg-surface-container-high',
        // Slow opacity pulse; suppressed under prefers-reduced-motion
        'motion-safe:animate-[skeleton-pulse_1.8s_ease-in-out_infinite]',
        SHAPE_BASE[shape],
        width ?? '',
        height ?? '',
        className,
      ].join(' ')}
    />
  );
}

/** Convenience: a stack of skeleton lines that looks like loading text. */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="line"
          // Vary width so it looks like natural text wrap
          className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  );
}
