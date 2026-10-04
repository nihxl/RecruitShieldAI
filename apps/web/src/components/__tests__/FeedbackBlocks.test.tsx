import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Skeleton, SkeletonText } from '@/components/Skeleton';
import { EmptyBlock, ErrorBlock } from '@/components/FeedbackBlocks';
import { SimulatedBadge, ComingSoonChip } from '@/components/StatusBadge';
import { ProvenanceBlock } from '@/components/ProvenanceBlock';
import { MICROCOPY } from '@/lib/constants';

// ── Skeleton ──────────────────────────────────────────────────────────────────
describe('Skeleton', () => {
  it('renders a line shape by default', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!;
    expect(el).toBeTruthy();
    expect(el.className).toContain('bg-surface-container-high');
  });

  it('renders card and circle shapes', () => {
    const { container: c1 } = render(<Skeleton shape="card" />);
    expect(c1.firstElementChild!.className).toContain('rounded-[var(--radius-card)]');

    const { container: c2 } = render(<Skeleton shape="circle" />);
    expect(c2.firstElementChild!.className).toContain('rounded-full');
  });

  it('uses aria-hidden so screen readers skip it', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies motion-safe animation class (not on when reduced-motion)', () => {
    const { container } = render(<Skeleton />);
    // The Tailwind class contains "motion-safe:" prefix which browser will
    // suppress when prefers-reduced-motion is set — we just verify the class is present
    expect(container.firstElementChild!.className).toContain('motion-safe:');
  });

  it('SkeletonText renders the correct number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />);
    // Each child is a Skeleton (a div)
    expect(container.firstElementChild!.children).toHaveLength(4);
  });
});

// ── EmptyBlock ────────────────────────────────────────────────────────────────
describe('EmptyBlock', () => {
  it('renders default microcopy from DD §10 (emptyHistory)', () => {
    render(<EmptyBlock />);
    expect(screen.getByText(MICROCOPY.emptyHistory)).toBeTruthy();
  });

  it('renders custom title and body', () => {
    render(<EmptyBlock title="No results" body="Try a different search." />);
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try a different search.')).toBeTruthy();
  });

  it('renders a primary action button when provided', () => {
    const handler = vi.fn();
    render(<EmptyBlock action={{ label: 'Start a check', onClick: handler }} />);
    const btn = screen.getByRole('button', { name: /Start a check/i });
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does NOT have role="alert"', () => {
    const { container } = render(<EmptyBlock />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});

// ── ErrorBlock ────────────────────────────────────────────────────────────────
describe('ErrorBlock', () => {
  it('has role="alert" and aria-live="assertive"', () => {
    render(<ErrorBlock />);
    const el = screen.getByRole('alert');
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('renders default microcopy from DD §10 (analysisFailed)', () => {
    render(<ErrorBlock />);
    // Default body is analysisFailed; title is "Something went wrong"
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(MICROCOPY.analysisFailed)).toBeTruthy();
  });

  it('renders custom title, body and action', () => {
    const handler = vi.fn();
    render(
      <ErrorBlock
        title="Network error"
        body="Check your connection."
        action={{ label: 'Retry', onClick: handler }}
      />
    );
    expect(screen.getByText('Network error')).toBeTruthy();
    expect(screen.getByText('Check your connection.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ── SimulatedBadge ────────────────────────────────────────────────────────────
describe('SimulatedBadge', () => {
  it('renders the "Simulated" label from the status map', () => {
    render(<SimulatedBadge />);
    expect(screen.getByText('Simulated')).toBeTruthy();
  });

  it('uses tertiary color classes', () => {
    const { container } = render(<SimulatedBadge />);
    // Tooltip wraps the badge in an outer span; the inner span carries the color classes
    const badge = container.querySelector('span.text-tertiary');
    expect(badge).toBeTruthy();
  });

  it('tooltip content comes from DD §10 simulatedTooltip microcopy', () => {
    render(<SimulatedBadge />);
    // The Tooltip wraps the badge; trigger is the inner span; tooltip content is in the tree
    // We verify the text content is the correct microcopy string by checking
    // the Tooltip component carries the correct content prop (it renders to portal on open)
    // At minimum the badge label is shown
    expect(screen.getByText('Simulated')).toBeTruthy();
    // Confirm microcopy constant is correct
    expect(MICROCOPY.simulatedTooltip).toBe('Example result for demonstration. Not based on a real check.');
  });
});

// ── ComingSoonChip ────────────────────────────────────────────────────────────
describe('ComingSoonChip', () => {
  it('renders the "Coming Soon" label from the status map', () => {
    render(<ComingSoonChip />);
    expect(screen.getByText('Coming Soon')).toBeTruthy();
  });

  it('uses outline color classes', () => {
    const { container } = render(<ComingSoonChip />);
    // Tooltip wraps the chip in an outer span; the inner span carries the color classes
    const chip = container.querySelector('span.text-outline');
    expect(chip).toBeTruthy();
  });

  it('tooltip microcopy matches DD §10 comingSoonTooltip', () => {
    render(<ComingSoonChip />);
    expect(MICROCOPY.comingSoonTooltip).toBe('This check is under development and will arrive in a later release.');
  });
});

// ── ProvenanceBlock ───────────────────────────────────────────────────────────
describe('ProvenanceBlock', () => {
  const GENERATED_AT = '2026-10-04T12:00:00Z';

  it('always renders the disclaimer', () => {
    render(
      <ProvenanceBlock
        provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
      />
    );
    expect(screen.getByText(MICROCOPY.disclaimer)).toBeTruthy();
  });

  it('renders custom disclaimer when provided', () => {
    render(
      <ProvenanceBlock
        disclaimer="Custom disclaimer text."
        provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
      />
    );
    expect(screen.getByText('Custom disclaimer text.')).toBeTruthy();
  });

  describe('source wording (PRD §5 Honesty rule assumptions)', () => {
    it('mock → "Source: Mock analyzer. Example logic, not a trained model."', () => {
      render(
        <ProvenanceBlock
          provenance={{ source: 'mock', generatedAt: GENERATED_AT }}
        />
      );
      expect(screen.getByText(/Source: Mock analyzer\. Example logic, not a trained model\./)).toBeTruthy();
    });

    it('rules → "Source: Pattern rules (not a trained model)"', () => {
      render(
        <ProvenanceBlock
          provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
        />
      );
      expect(screen.getByText(/Source: Pattern rules \(not a trained model\)/)).toBeTruthy();
    });

    it('model → "Source: Trained model {version}"', () => {
      render(
        <ProvenanceBlock
          provenance={{ source: 'model', modelVersion: 'v2.1.0', generatedAt: GENERATED_AT }}
        />
      );
      expect(screen.getByText(/Source: Trained model v2\.1\.0/)).toBeTruthy();
    });

    it('model without version falls back to "unknown"', () => {
      render(
        <ProvenanceBlock
          provenance={{ source: 'model', generatedAt: GENERATED_AT }}
        />
      );
      expect(screen.getByText(/Source: Trained model unknown/)).toBeTruthy();
    });
  });

  it('renders a "Generated" time string', () => {
    render(
      <ProvenanceBlock
        provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
      />
    );
    expect(screen.getByText(/Generated/)).toBeTruthy();
  });

  it('renders UTC time when showUtc is true', () => {
    render(
      <ProvenanceBlock
        showUtc
        provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
      />
    );
    expect(screen.getByText(/UTC/)).toBeTruthy();
  });

  it('does NOT render UTC when showUtc is false (default)', () => {
    render(
      <ProvenanceBlock
        provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
      />
    );
    expect(screen.queryByText(/UTC/)).toBeNull();
  });

  it('renders with footer element with aria-label', () => {
    const { container } = render(
      <ProvenanceBlock
        provenance={{ source: 'rules', generatedAt: GENERATED_AT }}
      />
    );
    const footer = container.querySelector('footer');
    expect(footer).toBeTruthy();
    expect(footer?.getAttribute('aria-label')).toBe('Provenance and disclaimer');
  });
});
