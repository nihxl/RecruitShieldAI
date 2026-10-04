'use client';
/**
 * DataTable — DD §4 | FR-6.1
 *
 * - label-caps headers on surface-container-highest at 50%
 * - 24px cell padding, row hover at 40%, dividers at 20%
 * - Below 640px: each row becomes a stacked card (same fields)
 * - Scrolls inside its container; no horizontal page scroll
 */

import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T, idx: number) => React.ReactNode;
  /** If true the cell is omitted in the mobile stacked card (e.g. action column rendered separately) */
  mobileHidden?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Provide a stable identity key per row */
  rowKey: (row: T, idx: number) => string;
  className?: string;
  /** Shown when rows is empty */
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  className = '',
  emptyState,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return (
      <div className={`rounded-[var(--radius-card)] bg-surface-container p-12 flex flex-col items-center gap-4 ${className}`}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* ── Desktop table (≥ 640px) ── */}
      <div className="hidden sm:block overflow-x-auto rounded-[var(--radius-card)] bg-surface-container-lowest">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-6 py-3 text-left text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant bg-surface-container-highest/50 border-b border-outline-variant/20"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className="border-b border-outline-variant/20 last:border-none hover:bg-surface-container/40 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-[24px] text-body-sm text-on-surface">
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile stacked cards (< 640px) ── */}
      <div className="sm:hidden flex flex-col gap-3">
        {rows.map((row, idx) => (
          <div
            key={rowKey(row, idx)}
            className="rounded-[var(--radius-item)] bg-surface-container p-4 flex flex-col gap-3 border border-outline-variant/20"
          >
            {columns
              .filter((col) => !col.mobileHidden)
              .map((col) => (
                <div key={col.key} className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant">
                    {col.header}
                  </span>
                  <div className="text-body-sm text-on-surface">{col.render(row, idx)}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
