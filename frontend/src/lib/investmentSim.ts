export type InvestmentType = "sip" | "rd" | "fd";

export type SimConfig = {
  years: number;
  monthlyInvestment: number;
  expectedReturn: number;
  inflation: number;
  investmentType: InvestmentType;
};

export type YearPoint = {
  year: number;
  totalCorpus: number;
  totalInvested: number;
  returnsEarned: number;
  inflationAdjusted: number;
};

export function simulateInvestment(config: SimConfig) {
  const years = Math.max(0, Math.floor(config.years));
  const months = years * 12;

  const annualRate = config.expectedReturn / 100;
  const inflationRate = config.inflation / 100;

  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const quarterlyRate = Math.pow(1 + annualRate, 1 / 4) - 1;

  let corpus = 0;
  let totalInvested = 0;
  const yearlyData: YearPoint[] = [];

  for (let month = 1; month <= months; month++) {
    if (config.investmentType === "fd") {
      if (month === 1) {
        const principal = config.monthlyInvestment * 12;
        totalInvested += principal;
        corpus += principal;
      }
    } else {
      totalInvested += config.monthlyInvestment;
      corpus += config.monthlyInvestment;
    }

    if (config.investmentType === "sip") {
      corpus *= 1 + monthlyRate;
    } else if (config.investmentType === "rd") {
      if (month % 3 === 0) {
        corpus *= 1 + quarterlyRate;
      }
    } else if (config.investmentType === "fd") {
      if (month % 12 === 0) {
        corpus *= 1 + annualRate;
      }
    }

    if (month % 12 === 0) {
      const year = month / 12;
      const inflationAdjusted = corpus / Math.pow(1 + inflationRate, year);
      yearlyData.push({
        year,
        totalCorpus: Math.round(corpus),
        totalInvested: Math.round(totalInvested),
        returnsEarned: Math.round(corpus - totalInvested),
        inflationAdjusted: Math.round(inflationAdjusted),
      });
    }
  }

  const last = yearlyData[yearlyData.length - 1] || {
    year: 0,
    totalCorpus: 0,
    totalInvested: 0,
    returnsEarned: 0,
    inflationAdjusted: 0,
  };

  return {
    ...last,
    yearlyData,
  };
}
