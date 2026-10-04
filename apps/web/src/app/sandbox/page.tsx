'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Chip } from '@/components/Chip';
import { ProgressBar } from '@/components/ProgressBar';
import { Modal } from '@/components/Modal';
import { ToastProvider, useToast } from '@/components/Toast';
import { Accordion, AccordionItem } from '@/components/Accordion';
import { Tooltip } from '@/components/Tooltip';
import { TrustGauge } from '@/components/TrustGauge';
import { ModuleCard } from '@/components/ModuleCard';
import { FindingCard } from '@/components/FindingCard';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';
import { InfoBanner } from '@/components/InfoBanner';
import { StatCard } from '@/components/StatCard';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Skeleton, SkeletonText } from '@/components/Skeleton';
import { EmptyBlock, ErrorBlock } from '@/components/FeedbackBlocks';
import { SimulatedBadge, ComingSoonChip } from '@/components/StatusBadge';
import { ProvenanceBlock } from '@/components/ProvenanceBlock';
import { ShieldShader } from '@/components/ShieldShader';

// ── Data table demo types ──────────────────────────────────────────────────────
interface CheckRow {
  id: string;
  date: string;
  posting: string;
  sourceType: string;
  score: number;
}

const TABLE_COLUMNS: DataTableColumn<CheckRow>[] = [
  { key: 'date',       header: 'Date',        render: (r) => r.date },
  { key: 'posting',    header: 'Posting',      render: (r) => r.posting },
  { key: 'source',     header: 'Source Type',  render: (r) => r.sourceType },
  {
    key: 'score',
    header: 'Trust Score',
    render: (r) => (
      <Chip
        variant="status"
        status={r.score >= 70 ? 'Likely Genuine' : r.score >= 40 ? 'Caution Advised' : 'High Risk'}
        label={String(r.score)}
      />
    ),
  },
];

const TABLE_ROWS: CheckRow[] = [
  { id: '1', date: '2026-10-01', posting: 'Senior Engineer — Acme Corp', sourceType: 'Text', score: 88 },
  { id: '2', date: '2026-09-30', posting: 'Marketing Lead — Globex', sourceType: 'Multiple', score: 52 },
  { id: '3', date: '2026-09-28', posting: 'Junior Dev — Unknown Inc', sourceType: 'Text', score: 22 },
];

const SandboxContent = () => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterSelected, setFilterSelected] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-16 bg-surface text-on-surface">
      <div>
        <h1 className="text-h1-desktop font-bold mb-2">Components Sandbox</h1>
        <p className="text-body-md text-on-surface-variant">Task 2.5 additions in the middle; Task 2.6 additions at the bottom; Task 5.2 (ShieldShader) at the bottom.</p>
      </div>

      {/* ── Existing sections ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="secondary" icon="download">With Icon</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Inputs &amp; Textareas</h2>
        <div className="max-w-md flex flex-col gap-6">
          <Input label="Default Input" placeholder="Enter text here..." />
          <Input label="Input with Error" defaultValue="Invalid text" error="This field is required" />
          <Textarea label="Default Textarea" placeholder="Enter long text..." maxLength={500} />
          <Textarea label="Textarea with Error" defaultValue="Too short" error="Must be at least 100 characters" maxLength={5000} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Chips &amp; Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Chip variant="status" status="Highly Genuine" label="Highly Genuine" />
          <Chip variant="status" status="Likely Genuine" label="Likely Genuine" />
          <Chip variant="status" status="Caution Advised" label="Caution Advised" />
          <Chip variant="status" status="High Risk" label="High Risk" />
          <Chip variant="status" status="Locked" label="Coming Soon" />
          <Chip variant="status" status="Simulated" label="Simulated" />
          <Chip variant="neutral" label="Neutral Badge" />
          <Chip
            variant="filter"
            label="Filter Selected"
            selected={filterSelected}
            onClick={() => setFilterSelected(!filterSelected)}
          />
          <Chip variant="filter" label="Filter Default" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Progress Bar</h2>
        <div className="max-w-md flex flex-col gap-4">
          <ProgressBar value={25} label="25% Complete" showLabel />
          <ProgressBar value={75} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Trust Gauge</h2>
        <h3 className="text-h3-desktop mt-4">Small (64px)</h3>
        <div className="flex flex-wrap gap-8 items-center bg-surface-container-low p-4 rounded-lg">
          <TrustGauge score={100} size="sm" />
          <TrustGauge score={72} size="sm" />
          <TrustGauge score={45} size="sm" />
          <TrustGauge score={12} size="sm" />
        </div>
        <h3 className="text-h3-desktop mt-4">Medium (192px)</h3>
        <div className="flex flex-wrap gap-8 items-center bg-surface-container-low p-4 rounded-lg">
          <TrustGauge score={100} size="md" />
          <TrustGauge score={72} size="md" />
          <TrustGauge score={45} size="md" />
          <TrustGauge score={12} size="md" />
        </div>
        <h3 className="text-h3-desktop mt-4">Large (256px)</h3>
        <div className="flex flex-wrap gap-8 items-center bg-surface-container-low p-4 rounded-lg">
          <TrustGauge score={100} size="lg" />
          <TrustGauge score={72} size="lg" />
          <TrustGauge score={45} size="lg" />
          <TrustGauge score={12} size="lg" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Accordion</h2>
        <div className="max-w-2xl flex flex-col bg-surface-container-low rounded-lg">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" title="Standard Section" subtitle="This is a standard section" icon="info">
              Content for standard section.
            </AccordionItem>
            <AccordionItem value="item-2" title="Added Section" subtitle="This section has an added badge" icon="person" variant="added">
              Content for added section.
            </AccordionItem>
            <AccordionItem value="item-3" title="Locked Section" subtitle="This section is locked" icon="lock" variant="locked">
              This shouldn&apos;t be visible.
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Tooltip</h2>
        <div className="flex gap-4">
          <Tooltip content="This is a helpful tooltip message that explains something.">
            <span className="underline decoration-dotted underline-offset-4 bg-tertiary-container/15 text-on-surface hover:bg-tertiary-container/30 transition-colors p-1">
              Hover, focus, or tap me
            </span>
          </Tooltip>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Modal &amp; Toast</h2>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="secondary" onClick={() => showToast('This is a polite toast notification.')}>Show Toast</Button>
        </div>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Delete this check?"
          description="This removes the report and cannot be undone."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { showToast('Check deleted'); setModalOpen(false); }}>Delete</Button>
            </>
          }
        >
          <div className="text-body-md text-on-surface">Are you absolutely sure you want to proceed?</div>
        </Modal>
      </section>

      {/* ── Task 2.5 additions ─────────────────────────────────────────────── */}

      {/* Module Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Module Cards (Task 2.5)</h2>

        <h3 className="text-h3-desktop">Static variants</h3>
        <div className="flex flex-col gap-3 max-w-2xl">
          <ModuleCard variant="pass"      title="Language Analysis"     summary="No common fraud patterns detected." />
          <ModuleCard variant="caution"   title="Tone Analysis"         summary="Some urgency signals found." />
          <ModuleCard variant="fail"      title="Payment Request"       summary="Upfront fees detected — high risk." />
          <ModuleCard variant="locked"    title="Company Verification"  summary="Coming soon in a later release." />
          <ModuleCard variant="simulated" title="Link Analysis"         summary="Example result for demonstration." />
          <ModuleCard variant="error"     title="Document Check"        summary="Something went wrong. Try again." />
        </div>

        <h3 className="text-h3-desktop mt-4">Expandable variant</h3>
        <div className="flex flex-col gap-3 max-w-2xl">
          <ModuleCard variant="caution" mode="expandable" title="Tone Analysis" summary="Some urgency signals found.">
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-body-sm text-on-surface-variant">
                The posting uses urgent language like &quot;apply immediately&quot; and &quot;limited spots&quot;. This can be a
                manipulation tactic, though some legitimate roles use similar phrasing.
              </p>
            </div>
          </ModuleCard>
          <ModuleCard variant="pass" mode="expandable" defaultOpen title="Language Analysis" summary="No issues found.">
            <p className="text-body-sm text-on-surface-variant">
              Vocabulary, sentence structure and formatting match genuine job postings in this category.
            </p>
          </ModuleCard>
        </div>

        <h3 className="text-h3-desktop mt-4">Navigating variant (chevron-right, whole card is a link)</h3>
        <div className="flex flex-col gap-3 max-w-2xl">
          <ModuleCard
            variant="pass"
            mode="navigating"
            href="/sandbox#language-detail"
            title="Language Analysis"
            summary="Tap to see detailed breakdown."
          />
        </div>
      </section>

      {/* Finding Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Finding Cards (Task 2.5)</h2>
        <div className="flex flex-col gap-3 max-w-2xl">
          <FindingCard
            kind="rule"
            severity="high"
            title="Payment request detected"
            description="The posting asks candidates to pay an upfront registration fee, a pattern common in employment scams."
            quote="You must submit a $250 processing fee before we can proceed with your application."
          />
          <FindingCard
            kind="rule"
            severity="medium"
            title="Urgency language"
            description="Language suggesting extreme time pressure and limited slots."
            quote="Only 3 spots left — apply within 24 hours or miss your chance!"
          />
          <FindingCard
            kind="rule"
            severity="low"
            title="Generic role description"
            description="The role description lacks specific responsibilities and team context."
          />
          <FindingCard
            kind="model"
            confidence={91}
            title="Tone pattern: high-pressure"
            description="The calibrated language model assigns high probability to coercive tone patterns associated with fraudulent postings."
            quote="You will be disqualified if you don't respond within 6 hours."
          />
          <FindingCard
            kind="model"
            confidence={62}
            title="Salary out of range"
            description="Stated compensation is significantly above market rate for this role level and location."
          />
        </div>
      </section>

      {/* Highlighted Phrase */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Highlighted Phrase (Task 2.5)</h2>
        <div className="flex flex-col gap-6 max-w-2xl">

          <div>
            <h3 className="text-h3-desktop mb-2">Two separate spans with tooltip</h3>
            <p className="text-body-md leading-relaxed">
              <HighlightedPhrase
                text="Please send your bank account details and NID number as soon as possible."
                spans={[{ start: 12, end: 32 }, { start: 37, end: 47 }]}
                tooltipContent="Flagged: sensitive personal data request"
              />
            </p>
          </div>

          <div>
            <h3 className="text-h3-desktop mb-2">Adjacent spans (merge into one)</h3>
            <p className="text-body-md leading-relaxed">
              <HighlightedPhrase
                text="Pay the fee now or lose your spot."
                spans={[{ start: 0, end: 11 }, { start: 11, end: 18 }]}
                tooltipContent="Flagged: payment and urgency"
              />
            </p>
          </div>

          <div>
            <h3 className="text-h3-desktop mb-2">HTML injection safety — rendered as plain text</h3>
            <p className="text-body-md leading-relaxed">
              <HighlightedPhrase
                text={"Harmless text <script>alert('xss')</script> end."}
                spans={[{ start: 14, end: 42 }]}
                tooltipContent="Rendered as literal text, no DOM injection"
              />
            </p>
          </div>

          <div>
            <h3 className="text-h3-desktop mb-2">Long-word and long-text case</h3>
            <p className="text-body-md leading-relaxed break-words">
              <HighlightedPhrase
                text="Supercalifragilisticexpialidociousantidisestablishmentarianism is a very long word that should wrap correctly without breaking the layout in any viewport including narrow ones."
                spans={[{ start: 0, end: 66 }, { start: 70, end: 77 }]}
                tooltipContent="Long word span"
              />
            </p>
          </div>

          <div>
            <h3 className="text-h3-desktop mb-2">Span touching start and end</h3>
            <p className="text-body-md leading-relaxed">
              <HighlightedPhrase
                text="Entire sentence highlighted."
                spans={[{ start: 0, end: 27 }]}
                tooltipContent="Full highlight"
              />
            </p>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Info Banner (Task 2.5)</h2>
        <div className="flex flex-col gap-4 max-w-2xl">
          <InfoBanner>
            Text analysis is available now. Document, company and link checks are coming soon.
          </InfoBanner>
          <InfoBanner variant="caution">
            Some signals need a closer look. Verify the recruiter independently before sharing personal details.
          </InfoBanner>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Stat Cards (Task 2.5)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard variant="total"       label="Total Checks"  value={24} />
          <StatCard variant="high-trust"  label="High Trust"    value={18} />
          <StatCard variant="caution"     label="Cautions"      value={4}  />
          <StatCard variant="in-progress" label="In Progress"   value={2}  />
        </div>
      </section>

      {/* Data Table */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Data Table (Task 2.5)</h2>

        <h3 className="text-h3-desktop">Full-width (desktop)</h3>
        <DataTable
          columns={TABLE_COLUMNS}
          rows={TABLE_ROWS}
          rowKey={(r) => r.id}
        />

        <h3 className="text-h3-desktop mt-6">360px-wide check (narrow container)</h3>
        <div className="w-[360px] border border-outline-variant/20 rounded-[var(--radius-card)] overflow-hidden">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={TABLE_ROWS}
            rowKey={(r) => r.id}
          />
        </div>

        <h3 className="text-h3-desktop mt-6">Empty state</h3>
        <DataTable
          columns={TABLE_COLUMNS}
          rows={[]}
          rowKey={(r) => r.id}
          emptyState={
            <div className="flex flex-col items-center gap-2">
              <span className="text-on-surface-variant text-[48px]">📋</span>
              <p className="text-h3-desktop font-semibold">No checks yet</p>
              <p className="text-body-sm text-on-surface-variant">Check your first opportunity.</p>
            </div>
          }
        />
      </section>

      {/* ── Task 2.6 additions ─────────────────────────────────────────────── */}

      {/* Skeleton */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Skeleton (Task 2.6)</h2>
        <div className="flex flex-col gap-6 max-w-2xl">
          <div>
            <h3 className="text-h3-desktop mb-3">Line shape (default)</h3>
            <div className="flex flex-col gap-2">
              <Skeleton />
              <Skeleton className="w-3/4" />
              <Skeleton className="w-1/2" />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Card shape</h3>
            <Skeleton shape="card" />
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Circle shape</h3>
            <div className="flex gap-4">
              <Skeleton shape="circle" />
              <Skeleton shape="circle" className="h-16 w-16" />
              <Skeleton shape="circle" className="h-20 w-20" />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">SkeletonText (3 lines)</h3>
            <SkeletonText lines={3} />
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Realistic module card skeleton</h3>
            <div className="rounded-[var(--radius-item)] bg-surface-container p-4 flex items-center gap-3">
              <Skeleton shape="circle" className="h-8 w-8 shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="w-1/3 h-5" />
                <Skeleton className="w-2/3 h-4" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Narrow width (360px)</h3>
            <div className="w-[360px]">
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      </section>

      {/* Empty and Error blocks */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Empty &amp; Error Blocks (Task 2.6)</h2>
        <div className="flex flex-col gap-6 max-w-2xl">
          <div>
            <h3 className="text-h3-desktop mb-3">Empty block — default microcopy</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low">
              <EmptyBlock />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Empty block — with action</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low">
              <EmptyBlock
                title="No checks yet."
                body="Check your first opportunity to get a risk estimate."
                action={{ label: 'Check an opportunity', onClick: () => {} }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Error block — default microcopy (role=alert)</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low">
              <ErrorBlock />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Error block — with retry action</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low">
              <ErrorBlock
                action={{ label: 'Try again', onClick: () => {} }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Simulated badge and Coming Soon chip */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Status Badges (Task 2.6)</h2>
        <div className="flex flex-col gap-6 max-w-2xl">
          <div>
            <h3 className="text-h3-desktop mb-3">Simulated badge</h3>
            <p className="text-body-sm text-on-surface-variant mb-3">Hover, focus (Tab) or tap to see tooltip.</p>
            <div className="flex flex-wrap gap-3 items-center">
              <SimulatedBadge />
              <span className="text-body-sm text-on-surface-variant">← appears on simulated result cards</span>
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Coming Soon chip</h3>
            <p className="text-body-sm text-on-surface-variant mb-3">Hover, focus (Tab) or tap to see tooltip.</p>
            <div className="flex flex-wrap gap-3 items-center">
              <ComingSoonChip />
              <span className="text-body-sm text-on-surface-variant">← appears on locked module cards</span>
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">In context — narrow width (360px)</h3>
            <div className="w-[360px] rounded-[var(--radius-item)] bg-surface-container p-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-outline/10 text-outline">
                <span className="text-[18px]">🔬</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[20px] font-semibold text-on-surface truncate">Link Analysis</p>
                <p className="text-body-sm text-on-surface-variant">Example result</p>
              </div>
              <SimulatedBadge />
            </div>
          </div>
        </div>
      </section>

      {/* Provenance block */}
      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Provenance Block (Task 2.6)</h2>
        <div className="flex flex-col gap-8 max-w-2xl">
          <div>
            <h3 className="text-h3-desktop mb-3">source: &quot;mock&quot;</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low p-6">
              <p className="text-body-md text-on-surface mb-2">Result content would appear here.</p>
              <ProvenanceBlock
                provenance={{ source: 'mock', generatedAt: '2026-10-04T12:00:00Z' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">source: &quot;rules&quot;</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low p-6">
              <ProvenanceBlock
                provenance={{ source: 'rules', generatedAt: '2026-10-04T09:30:00Z' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">source: &quot;model&quot; with version</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low p-6">
              <ProvenanceBlock
                provenance={{ source: 'model', modelVersion: 'v2.1.0', generatedAt: '2026-10-04T08:00:00Z' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">showUtc=true (for PDF report)</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low p-6">
              <ProvenanceBlock
                showUtc
                provenance={{ source: 'model', modelVersion: 'v2.1.0', generatedAt: '2026-10-04T08:00:00Z' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Narrow width (360px)</h3>
            <div className="w-[360px] rounded-[var(--radius-card)] bg-surface-container-low p-4">
              <ProvenanceBlock
                provenance={{ source: 'rules', generatedAt: '2026-10-04T12:00:00Z' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-h3-desktop mb-3">Long-text disclaimer</h3>
            <div className="rounded-[var(--radius-card)] bg-surface-container-low p-6">
              <ProvenanceBlock
                disclaimer="RecruitShield AI gives a risk estimate, not a guarantee. Always verify an employer through official channels before sharing any personal documents, bank details, or making any payments. This tool is not a substitute for professional advice."
                provenance={{ source: 'model', modelVersion: 'v2.1.0', generatedAt: '2026-10-04T08:00:00Z' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Task 5.2: Shield shader ─────────────────────────────────────── */}
      <section className="flex flex-col gap-8" id="shield-shader">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">
          Shield Shader (Task 5.2)
        </h2>

        {/* Happy path: WebGL canvas + icon overlay */}
        <div>
          <h3 className="text-h3-desktop mb-3">WebGL render</h3>
          <p className="text-body-sm text-on-surface-variant mb-4">
            120px circular well with surface-container background and the shader
            inside a 96px inner square. A static filled shield icon is overlaid
            at 32px (DD §6).
          </p>
          <div
            className="w-[120px] h-[120px] rounded-full bg-surface-container flex items-center justify-center"
            style={{ border: '1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent)' }}
          >
            <ShieldShader />
          </div>
        </div>

        {/* Static fallback: simulated by wrapping ShieldFallback directly */}
        <div>
          <h3 className="text-h3-desktop mb-3">Static fallback (no WebGL)</h3>
          <p className="text-body-sm text-on-surface-variant mb-4">
            Shown when WebGL is unavailable, or when the shader compile / link
            fails. A filled shield icon pulses via CSS animation
            (<code>shield-pulse</code> keyframe in theme.css).
            Under <code>prefers-reduced-motion</code> the animation is suppressed
            by the <code>motion-safe:</code> variant — the icon renders as static.
          </p>
          <div
            className="w-[120px] h-[120px] rounded-full bg-surface-container flex items-center justify-center"
            style={{ border: '1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent)' }}
          >
            {/* Render the internal ShieldFallback directly for sandbox preview */}
            <div
              className="flex items-center justify-center w-24 h-24"
              aria-label="Shield animation unavailable"
            >
              <div className="motion-safe:animate-[shield-pulse_2s_ease-in-out_infinite]">
                {/* Inline SVG matching Icon name='shield' filled, 64px, primary */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  width="64"
                  height="64"
                  fill="currentColor"
                  className="text-primary"
                  aria-hidden="true"
                >
                  <path d="M480-81q-140-35-230-162.5T160-523v-238l320-120 320 120v238q0 152-90 279.5T480-81Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function SandboxPage() {
  return (
    <ToastProvider>
      <SandboxContent />
    </ToastProvider>
  );
}
