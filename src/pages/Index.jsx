import { useEffect, useMemo, useState } from "react";
import { useRetirementCalculator } from "@/hooks/useRetirementCalculator";
import { InputSection } from "@/components/retirement/InputSection";
import { ResultCards } from "@/components/retirement/ResultCards";
import { StackedChart } from "@/components/retirement/StackedChart";
import { ComparisonToggle } from "@/components/retirement/ComparisonToggle";
import { DetailedStats } from "@/components/retirement/DetailedStats";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PolicyMarketHub } from "@/components/PolicyMarketHub";
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
  const [latestInsight, setLatestInsight] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("pmh.latestInsight");
      setLatestInsight(raw ? JSON.parse(raw) : null);
    } catch {
      setLatestInsight(null);
    }
  }, [activeSection]);

  const policyImpactText = useMemo(() => {
    if (!latestInsight?.message) return null;
    return latestInsight.message;
  }, [latestInsight]);

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
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">FinHack</h1>
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
                <SelectTrigger className="w-[10.5rem] glass border-white/10 bg-card/40 hidden md:flex">
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
            <TabsList className="w-full flex flex-wrap gap-1 bg-secondary/50">
              <TabsTrigger value="decoder" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Decoder
              </TabsTrigger>
              <TabsTrigger value="retirement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Retirement
              </TabsTrigger>
              <TabsTrigger value="policy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Policy & News
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Alerts
              </TabsTrigger>
              <TabsTrigger value="insurance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Insurance
              </TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Education
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeSection === "decoder" ? (
            <div className="space-y-4">
              {policyImpactText ? (
                <Card className="glass border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">Policy impact</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">Connected to latest RSS updates</p>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/60">live</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground">{policyImpactText}</p>
                    {latestInsight?.title ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Source: {latestInsight.feedTitle} • {latestInsight.publishedAt || ""}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              <PolicyMarketHub
                mode="product"
                hideHeader
                defaultTab="curves"
                visibleTabs={["curves"]}
              />

              <Card className="glass border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Hybrid retirement scenarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">NPS + private term insurance + EPF/gratuity (UI ready; data connectors next).</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-secondary/60">NPS</Badge>
                    <Badge variant="secondary" className="bg-secondary/60">Term insurance</Badge>
                    <Badge variant="secondary" className="bg-secondary/60">EPF</Badge>
                    <Badge variant="secondary" className="bg-secondary/60">Gratuity</Badge>
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

          {activeSection === "policy" ? (
            <PolicyMarketHub mode="product" hideHeader defaultTab="feeds" visibleTabs={["feeds"]} />
          ) : null}

          {activeSection === "alerts" ? (
            <PolicyMarketHub mode="product" hideHeader defaultTab="alerts" visibleTabs={["alerts"]} />
          ) : null}

          {activeSection === "insurance" ? (
            <PolicyMarketHub mode="product" hideHeader defaultTab="insurance" visibleTabs={["insurance"]} />
          ) : null}

          {activeSection === "education" ? (
            <PolicyMarketHub mode="product" hideHeader defaultTab="education" visibleTabs={["education"]} />
          ) : null}
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
