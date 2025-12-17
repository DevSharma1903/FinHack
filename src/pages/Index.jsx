import { useState } from "react";
import { useRetirementCalculator } from "@/hooks/useRetirementCalculator";
import { InputSection } from "@/components/retirement/InputSection";
import { ResultCards } from "@/components/retirement/ResultCards";
import { StackedChart } from "@/components/retirement/StackedChart";
import { ComparisonToggle } from "@/components/retirement/ComparisonToggle";
import { DetailedStats } from "@/components/retirement/DetailedStats";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

const Index = () => {
  const {
    inputs,
    updateInput,
    results,
    comparisonInputs,
    updateComparisonInput,
    comparisonResults,
    showComparison,
    setShowComparison,
  } = useRetirementCalculator();

  const [calculated, setCalculated] = useState(true);

  const handleCalculate = () => {
    setCalculated(true);
    toast.success("Calculation updated!", {
      description: `Your projected corpus is ₹${(results.totalCorpus / 10000000).toFixed(2)} Cr`,
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_circle_at_10%_-10%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(900px_circle_at_90%_0%,hsl(var(--accent)/0.14),transparent_60%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                Retirement Planner
              </h1>
              <p className="text-muted-foreground">
                Plan your financial future with smart calculations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ComparisonToggle showComparison={showComparison} setShowComparison={setShowComparison} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Section - Inputs */}
            <div className="lg:col-span-5">
              <div className={showComparison ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "space-y-4"}>
                <InputSection
                  inputs={inputs}
                  updateInput={updateInput}
                  onCalculate={handleCalculate}
                  title="Scenario A"
                />

                {showComparison && (
                  <InputSection
                    inputs={comparisonInputs}
                    updateInput={updateComparisonInput}
                    onCalculate={handleCalculate}
                    title="Scenario B"
                    isComparison
                  />
                )}
              </div>
            </div>

            {/* Right Section - Results */}
            <div className="lg:col-span-7 space-y-4">
              {calculated && (
                <>
                  <div className={showComparison ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "space-y-4"}>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground px-1">
                        {showComparison ? "Scenario A Results" : "Your Results"}
                      </h3>
                      <ResultCards results={results} />
                      <DetailedStats results={results} />
                    </div>

                    {showComparison && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground px-1">
                          Scenario B Results
                        </h3>
                        <ResultCards results={comparisonResults} isComparison />
                        <DetailedStats results={comparisonResults} />
                      </div>
                    )}
                  </div>

                  <StackedChart
                    data={results.yearlyData}
                    comparisonData={showComparison ? comparisonResults.yearlyData : null}
                    showComparison={showComparison}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>
            * Projections are based on assumed returns and may vary. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
