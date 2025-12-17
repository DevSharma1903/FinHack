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

  const calculateReturns = (config) => {
    const { currentAge, retirementAge, monthlyInvestment, expectedReturn, inflation, investmentType } = config;
    const years = retirementAge - currentAge;
    const months = years * 12;
    
    let compoundingFrequency;
    switch (investmentType) {
      case "sip":
        compoundingFrequency = 12; // Monthly
        break;
      case "rd":
        compoundingFrequency = 4; // Quarterly
        break;
      case "fd":
        compoundingFrequency = 1; // Annual
        break;
      default:
        compoundingFrequency = 12;
    }

    const r = expectedReturn / 100;
    const realReturn = ((1 + r) / (1 + inflation / 100)) - 1;
    
    const yearlyData = [];
    let totalCorpus = 0;
    let totalInvested = 0;

    for (let year = 1; year <= years; year++) {
      const monthsElapsed = year * 12;
      const yearlyInvestment = monthlyInvestment * 12;
      totalInvested = monthlyInvestment * monthsElapsed;

      if (investmentType === "fd") {
        // FD: Lump sum with annual compounding
        const lumpSum = monthlyInvestment * 12;
        totalCorpus = lumpSum * Math.pow(1 + r, year);
        totalInvested = lumpSum;
      } else {
        // SIP/RD: Future value of annuity formula
        const periodicRate = r / compoundingFrequency;
        const periods = year * compoundingFrequency;
        const periodicPayment = (monthlyInvestment * 12) / compoundingFrequency;
        
        totalCorpus = periodicPayment * ((Math.pow(1 + periodicRate, periods) - 1) / periodicRate) * (1 + periodicRate);
      }

      const returnsEarned = totalCorpus - totalInvested;
      const inflationAdjustedCorpus = totalCorpus / Math.pow(1 + inflation / 100, year);

      yearlyData.push({
        year,
        age: currentAge + year,
        totalCorpus: Math.round(totalCorpus),
        totalInvested: Math.round(totalInvested),
        returnsEarned: Math.round(returnsEarned),
        inflationAdjusted: Math.round(inflationAdjustedCorpus),
      });
    }

    const finalData = yearlyData[yearlyData.length - 1] || {
      totalCorpus: 0,
      totalInvested: 0,
      returnsEarned: 0,
      inflationAdjusted: 0,
    };

    return {
      totalCorpus: finalData.totalCorpus,
      totalInvested: finalData.totalInvested,
      returnsEarned: finalData.returnsEarned,
      inflationAdjusted: finalData.inflationAdjusted,
      returnPercentage: finalData.totalInvested > 0 
        ? ((finalData.returnsEarned / finalData.totalInvested) * 100).toFixed(1)
        : 0,
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
