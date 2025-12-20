export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function computeInsuranceNeed(params: {
  age: number;
  annualIncome: number;
  annualExpenses: number;
  dependents: number;
  liabilities: number;
  currentCover: number;
  goalYears: number;
}) {
  const { age, annualIncome, annualExpenses, dependents, liabilities, currentCover, goalYears } = params;

  const effectiveGoalYears = clampNumber(goalYears, 5, 40, 20);
  const incomeReplacement = annualExpenses * effectiveGoalYears;
  const dependentBuffer = dependents > 0 ? annualIncome * Math.min(1.5, 0.4 + dependents * 0.25) : 0;
  const ageBuffer = age >= 45 ? annualIncome * 0.5 : 0;

  const grossNeed = incomeReplacement + liabilities + dependentBuffer + ageBuffer;
  const recommendedCover = Math.max(0, grossNeed - currentCover);

  const coverageMultiple = annualIncome > 0 ? recommendedCover / annualIncome : 0;

  let recommendation = "Standard term plan";
  if (coverageMultiple >= 15) recommendation = "High cover term plan + consider riders";
  else if (coverageMultiple >= 10) recommendation = "High cover term plan";

  return {
    grossNeed,
    recommendedCover,
    coverageMultiple,
    recommendation,
  };
}
