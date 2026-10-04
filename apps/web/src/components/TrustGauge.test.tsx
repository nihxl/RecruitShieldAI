import React from "react";
import { render, screen } from "@testing-library/react";
import { TrustGauge } from "./TrustGauge";
import { describe, it, expect } from "vitest";

describe("TrustGauge", () => {
  it("renders with correct aria attributes", () => {
    render(<TrustGauge score={72} />);
    const gauge = screen.getByRole("meter");
    expect(gauge).toBeInTheDocument();
    expect(gauge).toHaveAttribute("aria-valuemin", "0");
    expect(gauge).toHaveAttribute("aria-valuemax", "100");
    expect(gauge).toHaveAttribute("aria-valuenow", "72");
    expect(gauge).toHaveAttribute("aria-label", "Trust score 72 out of 100, Likely Genuine");
  });

  it("renders score text for md and lg sizes", () => {
    const { rerender } = render(<TrustGauge score={40} size="md" />);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("SCORE")).toBeInTheDocument();

    rerender(<TrustGauge score={90} size="lg" />);
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("SCORE")).toBeInTheDocument();
    expect(screen.getByText("Highly Genuine")).toBeInTheDocument(); // Chip text
  });

  it("does not render score text for sm size", () => {
    render(<TrustGauge score={39} size="sm" />);
    expect(screen.queryByText("39")).not.toBeInTheDocument();
    expect(screen.queryByText("SCORE")).not.toBeInTheDocument();
  });
});
