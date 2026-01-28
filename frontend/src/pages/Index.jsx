import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRetirementCalculator } from "@/hooks/useRetirementCalculator";
import { InputSection } from "@/components/retirement/InputSection";
import { ResultCards } from "@/components/retirement/ResultCards";
import { StackedChart } from "@/components/retirement/StackedChart";
import { ComparisonToggle } from "@/components/retirement/ComparisonToggle";
import { DetailedStats } from "@/components/retirement/DetailedStats";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PolicyMarketHub } from "@/components/PolicyMarketHub";
import { DecoderPolicyMarketHub } from "@/components/DecoderPolicyMarketHub";
import { NpsSchemesTab } from "@/components/NpsSchemesTab";
import { EducationSection } from "@/components/EducationSection";
import PolicySection from "@/components/PolicySection";
import { Button } from "@/components/ui/button";
import { Trans, useI18n } from "@/i18n/i18n";
import { toast } from "sonner";
import { logout } from "@/lib/auth";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathToSection = {
    "/decoder": "decoder",
    "/retirement": "retirement",
    "/insurance": "insurance",
    "/education": "education",
    "/nps": "npsSchemes",
    "/policy": "policy",
  };

  const initialActiveSection = pathToSection[location.pathname] || "decoder";
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
  const [activeSection, setActiveSection] = useState(initialActiveSection);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { t, language, isTranslating } = useI18n();

  const sections = [
    { id: "decoder", label: <Trans>Decoder</Trans>, short: "D" },
    { id: "retirement", label: <Trans>Retirement</Trans>, short: "R" },
    { id: "insurance", label: <Trans>Insurance</Trans>, short: "I" },
    { id: "education", label: <Trans>Education</Trans>, short: "E" },
    { id: "npsSchemes", label: <Trans>NPS</Trans>, short: "N" },
    { id: "policy", label: <Trans>Policy</Trans>, short: "P" },
  ];

  const activeLabel = sections.find((s) => s.id === activeSection)?.label;

  useEffect(() => {
    setActiveSection(initialActiveSection);
  }, [initialActiveSection]);

  const handleCalculate = () => {
    setCalculated(true);
    toast.success(t("Calculation updated!"), {
      description: t(`Your projected corpus is ₹${(results.totalCorpus / 10000000).toFixed(2)} Cr`),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none truncate">Invest$ure</p>
              <p className="hidden sm:block text-xs text-muted-foreground mt-1 truncate">
                <Trans>Real time simulations for SIP, FD, RD and retirement planning</Trans>
              </p>
            </div>

            <div className="hidden md:block min-w-0">
              <p className="text-xs text-muted-foreground">{t("Section")}</p>
              <p className="text-sm font-medium text-foreground truncate">{activeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                aria-label={t("Section")}
              >
                <option value="decoder">decoder</option>
                <option value="retirement">retirement</option>
                <option value="insurance">insurance</option>
                <option value="education">education</option>
                <option value="npsSchemes">nps</option>
                <option value="policy">policy</option>
              </select>
            </div>

            <LanguageSelector />
            {isTranslating && language !== "en" ? (
              <p className="hidden md:block text-xs text-muted-foreground">{t("Translating...")}</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-6">
          <aside
            className={
              "hidden md:flex shrink-0 flex-col border border-border bg-card rounded-lg shadow-sm overflow-hidden transition-[width] duration-200 " +
              (sidebarCollapsed ? "w-16" : "w-56")
            }
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-border">
              <p
                className={
                  "text-xs font-medium text-muted-foreground overflow-hidden transition-[max-width,opacity] duration-200 " +
                  (sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100")
                }
              >
                {t("Sections")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="h-8 w-8 px-0"
                aria-label={sidebarCollapsed ? t("Expand sidebar") : t("Collapse sidebar")}
              >
                {sidebarCollapsed ? ">" : "<"}
              </Button>
            </div>

            <nav className="p-2 space-y-1">
              {sections.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    className={
                      "w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-200 " +
                      (isActive ? "bg-secondary text-foreground" : "hover:bg-muted/40 text-muted-foreground")
                    }
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/20 text-xs font-semibold text-foreground">
                      {s.short}
                    </span>
                    <span
                      className={
                        "whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 " +
                        (sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100")
                      }
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="space-y-6">
              {activeSection === "decoder" ? (
                <div className="space-y-4">
                  <DecoderPolicyMarketHub
                    mode="product"
                    hideHeader
                    defaultTab="curves"
                    visibleTabs={["curves"]}
                  />
                </div>
              ) : null}

              {activeSection === "retirement" ? (
                <div className="space-y-6">
                  <ComparisonToggle showComparison={showComparison} setShowComparison={setShowComparison} />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5">
                      <div className={showComparison ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "space-y-4"}>
                        <InputSection inputs={inputs} updateInput={updateInput} onCalculate={handleCalculate} title={t("Scenario A")} />

                        {showComparison && (
                          <InputSection
                            inputs={comparisonInputs}
                            updateInput={updateComparisonInput}
                            onCalculate={handleCalculate}
                            title={t("Scenario B")}
                            isComparison
                          />
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                      {calculated && (
                        <>
                          <div className={showComparison ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "space-y-4"}>
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium text-muted-foreground px-1">
                                {showComparison ? t("Scenario A Results") : t("Your Results")}
                              </h3>
                              <ResultCards results={results} />
                              <DetailedStats results={results} />
                            </div>

                            {showComparison && (
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground px-1">{t("Scenario B Results")}</h3>
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

              {activeSection === "policy" ? (
                <PolicySection />
              ) : null}
            </div>

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
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;