import { describe, expect, it } from "vitest";

import {
  PLAN_NOT_COMPARABLE_LABEL,
  PLAN_NO_DIFFERENCE_LABEL,
} from "../constants/plan-score.constants";
import type { PlanYearDto, PlanYearScores } from "../types/plan.types";
import {
  compareCategoryRatings,
  countUnverifiedScores,
  describeCategoryComparison,
  formatRatingOneDecimal,
  summarizeCategoryRatings,
  summarizeOverallRating,
  summarizeYearRating,
} from "./plan-summary-stats";

const unrated: PlanYearScores = {
  resources: null,
  interest: null,
  confidence: null,
  coherence: null,
};

const year = (
  yearIndex: PlanYearDto["yearIndex"],
  scores: Partial<PlanYearScores>,
): PlanYearDto => ({
  id: `y${yearIndex}`,
  yearIndex,
  scores: { ...unrated, ...scores },
  unverifiedScoreKeys: [],
  goals: [],
  keywords: [],
});

const allYears = (scores: Partial<PlanYearScores>) =>
  ([1, 2, 3, 4, 5] as const).map((idx) => year(idx, scores));

describe("year rating", () => {
  it("shows 4, 4, 4, 3 as 3.8, which only rounding the mean 3.75 produces", () => {
    const rating = summarizeYearRating({ resources: 4, interest: 4, confidence: 4, coherence: 3 });
    expect(rating.average).toBe(3.75);
    expect(formatRatingOneDecimal(rating.average as number)).toBe("3.8");
  });

  it("keeps a real rating of 1 distinct from not rated", () => {
    const allOnes = summarizeYearRating({ resources: 1, interest: 1, confidence: 1, coherence: 1 });
    const none = summarizeYearRating(unrated);
    expect(allOnes).toEqual({ average: 1, ratedCount: 4, totalCount: 4 });
    expect(none).toEqual({ average: null, ratedCount: 0, totalCount: 4 });
  });

  it("averages only rated items and reports the count", () => {
    expect(summarizeYearRating({ ...unrated, resources: 2, interest: 4 })).toEqual({
      average: 3,
      ratedCount: 2,
      totalCount: 4,
    });
  });
});

describe("overall rating", () => {
  it("is empty when nothing is rated", () => {
    expect(summarizeOverallRating(allYears({}))).toEqual({
      average: null,
      ratedCount: 0,
      totalCount: 20,
    });
  });

  it("weights each rated score equally across partly rated years", () => {
    const years = [
      year(1, { resources: 5 }),
      year(2, { resources: 1, interest: 1, confidence: 1 }),
    ];
    expect(summarizeOverallRating(years)).toEqual({
      average: 2,
      ratedCount: 4,
      totalCount: 8,
    });
  });
});

describe("category comparison", () => {
  const compare = (years: PlanYearDto[]) =>
    compareCategoryRatings(summarizeCategoryRatings(years));

  it("names one highest and lowest when they are clear", () => {
    expect(
      compare(allYears({ resources: 5, interest: 3, confidence: 3, coherence: 1 })),
    ).toEqual({ status: "compared", highest: ["resources"], lowest: ["coherence"] });
  });

  it("lists every category in a tie instead of picking one", () => {
    const result = compare(
      allYears({ resources: 5, interest: 5, confidence: 2, coherence: 2 }),
    );
    expect(result).toEqual({
      status: "compared",
      highest: ["resources", "interest"],
      lowest: ["confidence", "coherence"],
    });
    expect(describeCategoryComparison(result).highest).toBe("RESOURCES, INTEREST");
  });

  it("reports no difference when all four are equal", () => {
    const result = compare(
      allYears({ resources: 3, interest: 3, confidence: 3, coherence: 3 }),
    );
    expect(result).toEqual({ status: "no_difference" });
    expect(describeCategoryComparison(result).highest).toBe(PLAN_NO_DIFFERENCE_LABEL);
  });

  it("does not rank categories with different rated counts", () => {
    const result = compare([
      year(1, { resources: 5, interest: 1, confidence: 3, coherence: 3 }),
      year(2, { resources: 5 }),
    ]);
    expect(result).toEqual({ status: "not_comparable" });
    expect(describeCategoryComparison(result).lowest).toBe(PLAN_NOT_COMPARABLE_LABEL);
  });

  it("does not compare when nothing is rated", () => {
    expect(compare(allYears({}))).toEqual({ status: "not_comparable" });
  });
});

describe("unverified scores", () => {
  it("counts flagged keys across years", () => {
    const years = allYears({ resources: 3, interest: 3 });
    years[0].unverifiedScoreKeys = ["resources", "interest"];
    years[2].unverifiedScoreKeys = ["resources"];
    expect(countUnverifiedScores(years)).toBe(3);
  });
});
