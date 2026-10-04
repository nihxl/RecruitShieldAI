import React, { useEffect, useState } from "react";
import { getBandForScore } from "../lib/statusMap";
import { Chip, StatusBand } from "./Chip";

interface TrustGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TrustGauge({ score, size = "md", className = "" }: TrustGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Small delay to ensure the component is mounted before animating
    const timeout = setTimeout(() => setAnimatedScore(score), 50);
    return () => clearTimeout(timeout);
  }, [score]);

  const band = getBandForScore(score);
  
  const sizeStyles = {
    sm: "w-16 h-16",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  const circumference = 251.2; // 2 * Math.PI * 40
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Accessibility label
  const ariaLabel = `Trust score ${score} out of 100, ${band.label}`;

  let colorClass = "";
  if (band.colorRole === "secondary") colorClass = "text-secondary";
  else if (band.colorRole === "tertiary") colorClass = "text-tertiary";
  else if (band.colorRole === "error") colorClass = "text-error";
  else colorClass = "text-primary";

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${sizeStyles[size]} ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      aria-label={ariaLabel}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          strokeWidth="8"
          fill="none"
          className="stroke-surface-container-high"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={`stroke-current ${colorClass} motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-out`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      {size !== "sm" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`font-bold leading-none ${size === "lg" ? "text-[64px]" : "text-[48px]"}`}>
            {score}
          </span>
          <span className="text-body-sm text-on-surface-variant font-bold tracking-wider mt-1">
            SCORE
          </span>
          {size === "lg" && (
            <div className="mt-2 pointer-events-auto">
              <Chip
                variant="status"
                status={band.label as StatusBand}
                label={band.label}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
