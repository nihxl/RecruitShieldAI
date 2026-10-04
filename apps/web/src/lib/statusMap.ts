import { MICROCOPY } from "./constants";

export type BandId =
  | "highly-genuine"
  | "likely-genuine"
  | "caution-advised"
  | "high-risk"
  | "locked"
  | "simulated"
  | "error";

export type ColorRole =
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "outline"
  | "surface-variant";

export interface BandDef {
  id: BandId;
  label: string;
  colorRole: ColorRole;
  icon: string;
  summary: string;
}

export const STATUS_BANDS: Record<BandId, BandDef> = {
  "highly-genuine": {
    id: "highly-genuine",
    label: "Highly Genuine",
    colorRole: "secondary",
    icon: "verified",
    summary: MICROCOPY.highlyGenuineSummary,
  },
  "likely-genuine": {
    id: "likely-genuine",
    label: "Likely Genuine",
    colorRole: "secondary",
    icon: "check_circle",
    summary: MICROCOPY.likelyGenuineSummary,
  },
  "caution-advised": {
    id: "caution-advised",
    label: "Caution Advised",
    colorRole: "tertiary",
    icon: "warning",
    summary: MICROCOPY.cautionAdvisedSummary,
  },
  "high-risk": {
    id: "high-risk",
    label: "High Risk",
    colorRole: "error",
    icon: "gpp_maybe",
    summary: MICROCOPY.highRiskSummary,
  },
  locked: {
    id: "locked",
    label: "Coming Soon",
    colorRole: "outline",
    icon: "lock",
    summary: MICROCOPY.comingSoonTooltip,
  },
  simulated: {
    id: "simulated",
    label: "Simulated",
    colorRole: "tertiary",
    icon: "science",
    summary: MICROCOPY.simulatedTooltip,
  },
  error: {
    id: "error",
    label: "Error",
    colorRole: "error",
    icon: "error",
    summary: MICROCOPY.analysisFailed,
  },
};

export function getBandForScore(score: number): BandDef {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 90) return STATUS_BANDS["highly-genuine"];
  if (clamped >= 70) return STATUS_BANDS["likely-genuine"];
  if (clamped >= 40) return STATUS_BANDS["caution-advised"];
  return STATUS_BANDS["high-risk"];
}

export const getDisclaimer = () => MICROCOPY.disclaimer;
