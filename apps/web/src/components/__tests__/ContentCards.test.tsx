import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ModuleCard } from '@/components/ModuleCard';
import { FindingCard } from '@/components/FindingCard';
import { InfoBanner } from '@/components/InfoBanner';
import { StatCard } from '@/components/StatCard';
import { DataTable, type DataTableColumn } from '@/components/DataTable';

// ── ModuleCard ─────────────────────────────────────────────────────────────────
describe('ModuleCard', () => {
  it('renders title and summary', () => {
    render(<ModuleCard variant="pass" title="Language Analysis" summary="No issues found" />);
    expect(screen.getByText('Language Analysis')).toBeTruthy();
    expect(screen.getByText('No issues found')).toBeTruthy();
  });

  it('locked variant is aria-disabled', () => {
    const { container } = render(
      <ModuleCard variant="locked" title="Company Lookup" summary="Coming soon" />
    );
    const card = container.querySelector('[aria-disabled="true"]');
    expect(card).toBeTruthy();
  });

  it('expandable variant renders a button with aria-expanded=false initially', () => {
    render(
      <ModuleCard variant="pass" mode="expandable" title="Language">
        <p>Detail content</p>
      </ModuleCard>
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    // Panel should be hidden (max-height 0)
    const panel = document.getElementById(btn.getAttribute('aria-controls')!);
    expect(panel).toBeTruthy();
  });

  it('navigating variant renders an anchor tag', () => {
    render(
      <ModuleCard variant="pass" mode="navigating" href="/results/123/language" title="Language" />
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/results/123/language');
  });
});

// ── FindingCard ────────────────────────────────────────────────────────────────
describe('FindingCard', () => {
  it('renders rule-based card with severity chip only (no percentage)', () => {
    render(
      <FindingCard
        kind="rule"
        severity="High"
        title="Payment request"
        description="Requesting fees upfront is a common scam pattern."
        quote="You must pay a registration fee of $200."
      />
    );
    expect(screen.getByText('Payment request')).toBeTruthy();
    expect(screen.getByText('Requesting fees upfront is a common scam pattern.')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
    // No confidence percentage visible
    expect(screen.queryByText(/%\s*Confidence/)).toBeNull();
    // Quote rendered
    expect(screen.getByText('You must pay a registration fee of $200.')).toBeTruthy();
  });

  it('renders model-calibrated card with Confidence chip', () => {
    render(
      <FindingCard
        kind="model"
        confidence={87}
        title="Tone analysis"
        description="Language suggests urgency patterns."
      />
    );
    expect(screen.getByText(/87%/)).toBeTruthy();
    expect(screen.getByText(/Confidence/)).toBeTruthy();
    // No severity chip
    expect(screen.queryByText('High')).toBeNull();
  });

  it('renders without a quote block when quote is omitted', () => {
    const { container } = render(
      <FindingCard kind="rule" severity="Low" title="Minor" description="Minor issue." />
    );
    expect(container.querySelector('blockquote')).toBeNull();
  });
});

// ── InfoBanner ─────────────────────────────────────────────────────────────────
describe('InfoBanner', () => {
  it('renders info variant with note role', () => {
    render(<InfoBanner>Text analysis is available now.</InfoBanner>);
    expect(screen.getByRole('note')).toBeTruthy();
    expect(screen.getByText('Text analysis is available now.')).toBeTruthy();
  });

  it('renders caution variant', () => {
    render(<InfoBanner variant="caution">Caution message.</InfoBanner>);
    expect(screen.getByRole('note')).toBeTruthy();
  });
});

// ── StatCard ───────────────────────────────────────────────────────────────────
describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard variant="high-trust" label="High Trust" value={42} />);
    expect(screen.getByText('High Trust')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });
});

// ── DataTable ──────────────────────────────────────────────────────────────────
describe('DataTable', () => {
  type Row = { id: string; name: string; score: number };

  const columns: DataTableColumn<Row>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'score', header: 'Score', render: (r) => String(r.score) },
  ];

  const rows: Row[] = [
    { id: '1', name: 'Alice', score: 90 },
    { id: '2', name: 'Bob', score: 45 },
  ];

  it('renders all column headers', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    // desktop table (may be hidden by CSS but present in DOM)
    const headers = document.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).toContain('Name');
    expect(headerTexts).toContain('Score');
  });

  it('renders all row data', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('90').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no rows', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyState={<span>No results</span>}
      />
    );
    expect(screen.getByText('No results')).toBeTruthy();
  });

  it('table renders inside a scrollable container (overflow-x-auto)', () => {
    const { container } = render(
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
    );
    const scrollWrapper = container.querySelector('.overflow-x-auto');
    expect(scrollWrapper).toBeTruthy();
  });
});
