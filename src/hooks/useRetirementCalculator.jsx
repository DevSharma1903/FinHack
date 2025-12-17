import { useState, useMemo } from "react";

export function useRetirementCalculator() {
  const [inputs, setInputs] = useState({
    currentAge: 25,
    retirementAge: 60,
    monthlyInvestment: 10000,
    expectedReturn: 12,
    inflation: 6,
    investmentType: "sip",
  });

  const [comparisonInputs, setComparisonInputs] = useState({
    currentAge: 25,
    retirementAge: 65,
    monthlyInvestment: 15000,
    expectedReturn: 10,
    inflation: 6,
    investmentType: "sip",
  });

  const [showComparison, setShowComparison] = useState(false);

  const calculateIrrMonthly = (cashflows) => {
    if (!Array.isArray(cashflows) || cashflows.length < 2) return null;

    const hasPositive = cashflows.some((v) => v > 0);
    const hasNegative = cashflows.some((v) => v < 0);
    if (!hasPositive || !hasNegative) return null;

    const npv = (rate) => {
      let value = 0;
      const denomBase = 1 + rate;
      if (denomBase <= 0) return Number.POSITIVE_INFINITY;

      for (let t = 0; t < cashflows.length; t++) {
        value += cashflows[t] / Math.pow(denomBase, t);
      }
      return value;
    };

    const dNpv = (rate) => {
      let value = 0;
      const denomBase = 1 + rate;
      if (denomBase <= 0) return Number.POSITIVE_INFINITY;

      for (let t = 1; t < cashflows.length; t++) {
        value += (-t * cashflows[t]) / Math.pow(denomBase, t + 1);
      }
      return value;
    };

    let guess = 0.01;
    for (let i = 0; i < 30; i++) {
      const f = npv(guess);
      const df = dNpv(guess);
      if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-12) break;
      const next = guess - f / df;
      if (!Number.isFinite(next)) break;
      if (Math.abs(next - guess) < 1e-10) return next;
      guess = Math.max(next, -0.99);
    }

    let low = -0.99;
    let high = 10;
    let fLow = npv(low);
    let fHigh = npv(high);
    if (!Number.isFinite(fLow) || !Number.isFinite(fHigh) || fLow * fHigh > 0) return null;

    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const fMid = npv(mid);
      if (!Number.isFinite(fMid)) return null;
      if (Math.abs(fMid) < 1e-8) return mid;
      if (fLow * fMid <= 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }

    return (low + high) / 2;
  };

  const calculateReturns = (config) => {
    const { currentAge, retirementAge, monthlyInvestment, expectedReturn, inflation, investmentType } = config;
    const years = Math.max(0, retirementAge - currentAge);
    const months = years * 12;

    const annualRate = expectedReturn / 100;
    const inflationRate = inflation / 100;
    const realReturnAssumption = (1 + annualRate) / (1 + inflationRate) - 1;

    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const quarterlyRate = Math.pow(1 + annualRate, 1 / 4) - 1;

    let corpus = 0;
    let totalInvested = 0;
    const yearlyData = [];
    const cashflows = [];

    for (let month = 1; month <= months; month++) {
      if (investmentType === "fd") {
        if (month === 1) {
          const principal = monthlyInvestment * 12;
          totalInvested += principal;
          corpus += principal;
          cashflows.push(-principal);
        } else {
          cashflows.push(0);
        }
      } else {
        totalInvested += monthlyInvestment;
        corpus += monthlyInvestment;
        cashflows.push(-monthlyInvestment);
      }

      if (investmentType === "sip") {
        corpus *= 1 + monthlyRate;
      } else if (investmentType === "rd") {
        if (month % 3 === 0) {
          corpus *= 1 + quarterlyRate;
        }
      } else if (investmentType === "fd") {
        if (month % 12 === 0) {
          corpus *= 1 + annualRate;
        }
      }

      if (month % 12 === 0) {
        const year = month / 12;
        const inflationAdjustedCorpus = corpus / Math.pow(1 + inflationRate, year);
        const returnsEarned = corpus - totalInvested;

        yearlyData.push({
          year,
          age: currentAge + year,
          totalCorpus: Math.round(corpus),
          totalInvested: Math.round(totalInvested),
          returnsEarned: Math.round(returnsEarned),
          inflationAdjusted: Math.round(inflationAdjustedCorpus),
        });
      }
    }

    if (cashflows.length === 0) {
      cashflows.push(corpus);
    } else {
      cashflows[cashflows.length - 1] += corpus;
    }

    const irrMonthly = calculateIrrMonthly(cashflows);
    const irrAnnual = typeof irrMonthly === "number" && Number.isFinite(irrMonthly)
      ? Math.pow(1 + irrMonthly, 12) - 1
      : null;
    const realIrrAnnual = typeof irrAnnual === "number" && Number.isFinite(irrAnnual)
      ? (1 + irrAnnual) / (1 + inflationRate) - 1
      : null;

    const totalCorpus = Math.round(corpus);
    const returnsEarned = Math.round(corpus - totalInvested);
    const inflationAdjusted = Math.round(corpus / Math.pow(1 + inflationRate, years || 1));

    return {
      years,
      months,
      expectedReturn,
      inflation,
      realReturnAssumptionPercent: realReturnAssumption * 100,
      totalCorpus,
      totalInvested: Math.round(totalInvested),
      returnsEarned,
      inflationAdjusted,
      returnPercentage:
        totalInvested > 0 ? ((corpus - totalInvested) / totalInvested) * 100 : 0,
      wealthMultiplier: totalInvested > 0 ? corpus / totalInvested : 0,
      irrAnnualPercent: typeof irrAnnual === "number" ? irrAnnual * 100 : null,
      realIrrAnnualPercent: typeof realIrrAnnual === "number" ? realIrrAnnual * 100 : null,
      yearlyData,
    };
  };

  const results = useMemo(() => calculateReturns(inputs), [inputs]);
  const comparisonResults = useMemo(() => calculateReturns(comparisonInputs), [comparisonInputs]);

  const updateInput = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const updateComparisonInput = (key, value) => {
    setComparisonInputs((prev) => ({ ...prev, [key]: value }));
  };

  return {
    inputs,
    updateInput,
    results,
    comparisonInputs,
    updateComparisonInput,
    comparisonResults,
    showComparison,
    setShowComparison,
  };
}
