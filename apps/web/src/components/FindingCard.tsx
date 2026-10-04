import React from 'react';
import { Icon, IconName } from './Icon';
import { Chip } from './Chip';

// DD §4 Finding card | FR-4.1
export type FindingSeverity = 'High' | 'Medium' | 'Low';

interface BaseFindingCardProps {
  icon?: IconName;
  title: string;
  description: string;
  /** Optional quoted evidence block */
  quote?: string;
  className?: string;
}

interface RuleBasedFindingCardProps extends BaseFindingCardProps {
  kind: 'rule';
  severity: FindingSeverity;
}

interface ModelFindingCardProps extends BaseFindingCardProps {
  kind: 'model';
  /** 0–100 integer confidence */
  confidence: number;
}

export type FindingCardProps = RuleBasedFindingCardProps | ModelFindingCardProps;

const SEVERITY_ICON: Record<FindingSeverity, IconName> = {
  High: 'gpp_maybe',
  Medium: 'warning',
  Low: 'info',
};

const SEVERITY_CHIP_STATUS = {
  High: 'High Risk',
  Medium: 'Caution Advised',
  Low: 'Likely Genuine',
} as const;

export function FindingCard(props: FindingCardProps) {
  const {
    icon,
    title,
    description,
    quote,
    className = '',
  } = props;

  const defaultIcon: IconName =
    props.kind === 'rule' ? SEVERITY_ICON[props.severity] : 'science';

  return (
    <article
      className={`rounded-[var(--radius-item)] bg-surface-container p-4 flex flex-col gap-3 ${className}`}
    >
      {/* Row: icon + title + chip */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 text-on-surface-variant">
          <Icon name={icon ?? defaultIcon} size={20} />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body-md font-semibold text-on-surface leading-snug">
              {title}
            </span>

            {props.kind === 'rule' && (
              /* Rule-based: show severity chip only, never a percentage */
              <Chip
                variant="status"
                status={SEVERITY_CHIP_STATUS[props.severity] as import('./Chip').StatusBand}
                label={props.severity}
              />
            )}

            {props.kind === 'model' && (
              /* Calibrated model output: show Confidence chip */
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-tertiary/15 border border-tertiary/40 text-tertiary px-2 py-0.5 text-label-caps font-semibold uppercase tracking-wide text-[12px]">
                <Icon name="science" size={14} />
                {props.confidence}% Confidence
              </span>
            )}
          </div>

          <p className="text-body-sm text-on-surface-variant leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Quote block */}
      {quote && (
        <blockquote className="border-l-2 border-tertiary-container pl-3 bg-surface rounded-sm">
          <p className="text-body-sm italic text-on-surface-variant leading-relaxed py-2">
            {quote}
          </p>
        </blockquote>
      )}
    </article>
  );
}
