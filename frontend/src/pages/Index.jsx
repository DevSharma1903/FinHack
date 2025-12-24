import { useState } from "react";
import { useRetirementCalculator } from "@/hooks/useRetirementCalculator";
import { InputSection } from "@/components/retirement/InputSection";
import { ResultCards } from "@/components/retirement/ResultCards";
import { StackedChart } from "@/components/retirement/StackedChart";
import { ComparisonToggle } from "@/components/retirement/ComparisonToggle";
import { DetailedStats } from "@/components/retirement/DetailedStats";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PolicyMarketHub } from "@/components/PolicyMarketHub";
import { DecoderPolicyMarketHub } from "@/components/DecoderPolicyMarketHub";
import { NpsSchemesTab } from "@/components/NpsSchemesTab";
import { EducationSection } from "@/components/EducationSection";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [activeSection, setActiveSection] = useState("decoder");
  const [language, setLanguage] = useState("en");

  const handleCalculate = () => {
    setCalculated(true);
    toast.success("Calculation updated!", {
      description: `Your projected corpus is ₹${(results.totalCorpus / 10000000).toFixed(2)} Cr`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 gradient-text">FinHack</h1>
              <p className="text-muted-foreground">Policy-aware simulations for SIP, FD, RD and retirement planning</p>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={language}
                onValueChange={(v) => {
                  setLanguage(v);
                  toast.message("Language", {
                    description: "Multilingual support can be wired to Google Translate API (requires API key/back-end).",
                  });
                }}
              >
                <SelectTrigger className="w-[10.5rem] border border-border bg-card hidden md:flex">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="bn">Bengali</SelectItem>
                </SelectContent>
              </Select>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="w-full flex flex-wrap gap-1 glass p-1">
              <TabsTrigger value="decoder" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Decoder
              </TabsTrigger>
              <TabsTrigger value="retirement" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Retirement
              </TabsTrigger>
              <TabsTrigger value="insurance" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Insurance
              </TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Education
              </TabsTrigger>
              <TabsTrigger value="npsSchemes" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                NPS Schemes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeSection === "decoder" ? (
            <div className="space-y-4">
              <DecoderPolicyMarketHub
                mode="product"
                hideHeader
                defaultTab="curves"
                visibleTabs={["curves"]}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Hybrid retirement scenarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">NPS + private term insurance + EPF/gratuity (UI ready; data connectors next).</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-secondary">NPS</Badge>
                    <Badge variant="secondary" className="bg-secondary">Term insurance</Badge>
                    <Badge variant="secondary" className="bg-secondary">EPF</Badge>
                    <Badge variant="secondary" className="bg-secondary">Gratuity</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === "retirement" ? (
            <div className="space-y-6">
              <ComparisonToggle showComparison={showComparison} setShowComparison={setShowComparison} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Section - Inputs */}
                <div className="lg:col-span-5">
                  <div className={showComparison ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "space-y-4"}>
                    <InputSection inputs={inputs} updateInput={updateInput} onCalculate={handleCalculate} title="Scenario A" />

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
                            <h3 className="text-sm font-medium text-muted-foreground px-1">Scenario B Results</h3>
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
          ) : null}

          {activeSection === "insurance" ? (
            <PolicyMarketHub mode="product" hideHeader defaultTab="insurance" visibleTabs={["insurance"]} />
          ) : null}

          {activeSection === "education" ? (
            <EducationSection />
          ) : null}

          {activeSection === "npsSchemes" ? (
            <NpsSchemesTab />
          ) : null}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p className="text-xs text-gray-500 mt-2">
            * Projections are based on assumed returns and may vary. Past performance does not guarantee future results.{" "}
            NPS and other investment data displayed here are sourced from the official NPS Trust website{" "}
            (<a
              href="https://npstrust.org.in/weekly-snapshot-nps-schemes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              npstrust.org.in/weekly-snapshot-nps-schemes
            </a>
            ) and were downloaded on a specific date; values may be outdated, incomplete, or contain errors. This tool is for
            educational illustration only and should not be treated as accurate, real-time financial information or investment
            advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
