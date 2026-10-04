import { describe, it, expect } from "vitest";
import { getBandForScore, STATUS_BANDS } from "./statusMap";

describe("getBandForScore", () => {
  it("returns High Risk for 0", () => {
    expect(getBandForScore(0)).toEqual(STATUS_BANDS["high-risk"]);
  });
  it("returns High Risk for 39", () => {
    expect(getBandForScore(39)).toEqual(STATUS_BANDS["high-risk"]);
  });
  it("returns Caution Advised for 40", () => {
    expect(getBandForScore(40)).toEqual(STATUS_BANDS["caution-advised"]);
  });
  it("returns Caution Advised for 69", () => {
    expect(getBandForScore(69)).toEqual(STATUS_BANDS["caution-advised"]);
  });
  it("returns Likely Genuine for 70", () => {
    expect(getBandForScore(70)).toEqual(STATUS_BANDS["likely-genuine"]);
  });
  it("returns Likely Genuine for 89", () => {
    expect(getBandForScore(89)).toEqual(STATUS_BANDS["likely-genuine"]);
  });
  it("returns Highly Genuine for 90", () => {
    expect(getBandForScore(90)).toEqual(STATUS_BANDS["highly-genuine"]);
  });
  it("returns Highly Genuine for 100", () => {
    expect(getBandForScore(100)).toEqual(STATUS_BANDS["highly-genuine"]);
  });
  it("clamps scores below 0", () => {
    expect(getBandForScore(-10)).toEqual(STATUS_BANDS["high-risk"]);
  });
  it("clamps scores above 100", () => {
    expect(getBandForScore(110)).toEqual(STATUS_BANDS["highly-genuine"]);
  });
});
