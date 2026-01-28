import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Info } from "lucide-react";

import { generateSipRdFdExplanation } from "@/lib/gemini";
import { useI18n } from "@/i18n/i18n";
import { translateText } from "@/services/translate";

/* ================= helpers ================= */

function formatCurrency(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ================= component ================= */

export function DecoderPolicyMarketHub() {
  const { t, language } = useI18n();

  const [isRural, setIsRural] = useState(false);
  const [form, setForm] = useState({
    Income: "",
    Age: "",
    Dependents: "",
    Occupation: "",
    City_Tier: "",

    Rent: "",
    Loan_Repayment: "",
    Insurance: "",
    Groceries: "",
    Transport: "",
    Eating_Out: "",
    Entertainment: "",
    Utilities: "",
    Healthcare: "",
    Education: "",
    Miscellaneous: "",
  });

  const [financialGoals, setFinancialGoals] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendedOption, setRecommendedOption] = useState(null);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState("");
  const [graphResult, setGraphResult] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiExplanationEn, setAiExplanationEn] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTranslateLoading, setAiTranslateLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [adviceHash, setAdviceHash] = useState(null);
  const [adviceHashTime, setAdviceHashTime] = useState(null);
  const [hashLoading, setHashLoading] = useState(false); 
  const [hashError, setHashError] = useState("");


  const aiTranslateAbortRef = useRef(null);

  const [ruralTab, setRuralTab] = useState("debtTrap");
  const [debtForm, setDebtForm] = useState({
    Loan_Repayment: "",
    Peak_Income: "",
    Lean_Income: "",
    Zero_Income_Months: "0",
    Loan_Interest: "24",
  });
  const [debtResult, setDebtResult] = useState(null);
  const [debtLoading, setDebtLoading] = useState(false);

  const [varForm, setVarForm] = useState({
    Income: "",
    Age: "",
    Dependents: "",
    Occupation: "",
    City_Tier: "",

    Rent: "",
    Loan_Repayment: "",
    Insurance: "",
    Groceries: "",
    Transport: "",
    Eating_Out: "",
    Entertainment: "",
    Utilities: "",
    Healthcare: "",
    Education: "",
    Miscellaneous: "",

    Peak_Income: "",
    Lean_Income: "",
    Zero_Income_Months: "0",
  });
  const [varResult, setVarResult] = useState(null);
  const [varLoading, setVarLoading] = useState(false);

  const [missedForm, setMissedForm] = useState({
    Income: "",
    Age: "",
    Dependents: "",
    Occupation: "",
    City_Tier: "",

    Rent: "",
    Loan_Repayment: "",
    Insurance: "",
    Groceries: "",
    Transport: "",
    Eating_Out: "",
    Entertainment: "",
    Utilities: "",
    Healthcare: "",
    Education: "",
    Miscellaneous: "",

    Missed_Months: "",
  });
  const [missedResult, setMissedResult] = useState(null);
  const [missedLoading, setMissedLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function getFinalValuesFromYearlyProjection(yearlyProjection) {
    if (!Array.isArray(yearlyProjection) || yearlyProjection.length === 0) {
      return { sip: 0, rd: 0, fd: 0 };
    }
    const last = yearlyProjection[yearlyProjection.length - 1] || {};
    return {
      sip: Number(last.sip) || 0,
      rd: Number(last.rd) || 0,
      fd: Number(last.fd) || 0,
    };
  }

  function getRecommendedOptionFromProjection({ sip, rd, fd }) {
    const entries = [
      { key: "SIP", value: sip },
      { key: "RD", value: rd },
      { key: "FD", value: fd },
    ];
    entries.sort((a, b) => b.value - a.value);
    return entries[0]?.key || "-";
  }

  function updateDebt(key, value) {
    setDebtForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateVar(key, value) {
    setVarForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateMissed(key, value) {
    setMissedForm((prev) => ({ ...prev, [key]: value }));
  }

  // Helper function to render appropriate input based on field type
  function renderInputField(key, value, onChange, placeholder) {
    if (key === "Income") {
      return (
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={placeholder}
        />
      );
    }
    
    if (key === "Dependents") {
      return (
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={placeholder}
        />
      );
    }
    
    if (key === "Occupation") {
      return (
        <Select value={value} onValueChange={(val) => onChange(key, val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Self Employed">Self Employed</SelectItem>
            <SelectItem value="Student">Student</SelectItem>
            <SelectItem value="Retired">Retired</SelectItem>
            <SelectItem value="Professional">Professional</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    if (key === "City_Tier") {
      return (
        <Select value={value} onValueChange={(val) => onChange(key, val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tier 1">Tier 1</SelectItem>
            <SelectItem value="Tier 2">Tier 2</SelectItem>
            <SelectItem value="Tier 3">Tier 3</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    // Default to text input for other fields
    return (
      <Input
        value={value}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
      />
    );
  }

  function toYearlyFromMonthly(monthlyProjection) {
    if (!Array.isArray(monthlyProjection)) return [];
    const years = Math.floor(monthlyProjection.length / 12);
    return Array.from({ length: years }, (_, idx) => {
      const point = monthlyProjection[Math.min((idx + 1) * 12 - 1, monthlyProjection.length - 1)] || {};
      return {
        year: idx + 1,
        sip: Number(point.sip) || 0,
        rd: Number(point.rd) || 0,
        fd: Number(point.fd) || 0,
        total: Number(point.total) || 0,
      };
    });
  }

  async function generate() {
    setLoading(true);
    setResult(null);
    setAiExplanation("");
    setAiError("");

    const payload = {};
    for (const key in form) {
      payload[key] =
        key === "Occupation" || key === "City_Tier"
          ? form[key]
          : Number(form[key]) || 0;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/investment-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      setResult(data);
      
      // Extract recommended option
      const finalValues = getFinalValuesFromYearlyProjection(data.yearly_projection);
      const recommended = getRecommendedOptionFromProjection(finalValues);
      setRecommendedOption(recommended);
      
    } catch (err) {
      console.error(err);
      alert(t("Backend error"));
    } finally {
      setLoading(false);
    }
  }

  async function hashAdviceOnBackend(adviceText) {
    setHashLoading(true);
    setHashError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/advice/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advice_text: adviceText,
          user_id: "demo-user",        // or real user id
          model_used: "gemini"
        }),
      });

      if (!res.ok) throw new Error("Hashing failed");

      const data = await res.json();
      setAdviceHash(data.advice_hash);
      setAdviceHashTime(data.created_at);
    } catch (err) {
      console.error(err);
      setHashError("Verification failed");
    } finally {
      setHashLoading(false);
    }
  }

  async function generateInvestmentGraph() {
    setGraphLoading(true);
    setGraphResult(null);

    const payload = {};
    for (const key in form) {
      payload[key] =
        key === "Occupation" || key === "City_Tier"
          ? form[key]
          : Number(form[key]) || 0;
    }

    // Force allocation based on selected investment type
    if (selectedInvestmentType === "SIP") {
      payload.sip_pct = 100;
      payload.rd_pct = 0;
      payload.fd_pct = 0;
    } else if (selectedInvestmentType === "RD") {
      payload.sip_pct = 0;
      payload.rd_pct = 100;
      payload.fd_pct = 0;
    } else if (selectedInvestmentType === "FD") {
      payload.sip_pct = 0;
      payload.rd_pct = 0;
      payload.fd_pct = 100;
    }
    // For Hybrid, use the ML model's recommendation (no forced allocation)

    try {
      const res = await fetch("http://127.0.0.1:8000/investment-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      setGraphResult(data);
      
    } catch (err) {
      console.error(err);
      alert(t("Backend error"));
    } finally {
      setGraphLoading(false);
    }
  }

  async function generateAiExplanation() {
    if (!result) return;

    setAiLoading(true);
    setAiTranslateLoading(false);
    setAiError("");
    setAiExplanation("");
    setAiExplanationEn("");

    try {
      const finalValues = getFinalValuesFromYearlyProjection(result.yearly_projection);
      const recommended = getRecommendedOptionFromProjection(finalValues);

      const text = await generateSipRdFdExplanation({
        userInputs: {
          monthlyIncome: Number(form.Income) || 0,
          monthlyInvestmentAmount: Number(result.monthly_savings) || 0,
          monthlyAllocationSip: formatCurrency(Number(result.monthly_investment?.sip) || 0),
          monthlyAllocationRd: formatCurrency(Number(result.monthly_investment?.rd) || 0),
          monthlyAllocationFd: formatCurrency(Number(result.monthly_investment?.fd) || 0),
          durationYears: Array.isArray(result.yearly_projection) ? result.yearly_projection.length : 10,
          savingCapacity: result.saving_capacity,
          riskProfile: result.risk_profile,
          financialGoals,
        },
        calculationResults: {
          sipValue: formatCurrency(finalValues.sip),
          rdValue: formatCurrency(finalValues.rd),
          fdValue: formatCurrency(finalValues.fd),
          sipPct: result.sip_pct,
          rdPct: result.rd_pct,
          fdPct: result.fd_pct,
        },
        recommendedOption: recommended,
      });

      setAiExplanationEn(text);
      await hashAdviceOnBackend(text);

      if (language === "en") {
        setAiExplanation(text);
      } else {
        if (aiTranslateAbortRef.current) aiTranslateAbortRef.current.abort();
        const controller = new AbortController();
        aiTranslateAbortRef.current = controller;
        setAiTranslateLoading(true);
        const translated = await translateText(text, language, "en", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setAiExplanation(translated);
        }
      }
    } catch (err) {
      console.error(err);
      setAiError(err instanceof Error ? err.message : t("Failed to generate explanation."));
    } finally {
      setAiLoading(false);
      setAiTranslateLoading(false);
    }
  }

  useEffect(() => {
    if (!aiExplanationEn) {
      setAiExplanation("");
      return;
    }

    if (language === "en") {
      if (aiTranslateAbortRef.current) aiTranslateAbortRef.current.abort();
      setAiTranslateLoading(false);
      setAiExplanation(aiExplanationEn);
      return;
    }

    if (aiTranslateAbortRef.current) aiTranslateAbortRef.current.abort();
    const controller = new AbortController();
    aiTranslateAbortRef.current = controller;
    setAiTranslateLoading(true);

    translateText(aiExplanationEn, language, "en", { signal: controller.signal })
      .then((translated) => {
        if (!controller.signal.aborted) {
          setAiExplanation(translated);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAiTranslateLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [aiExplanationEn, language]);

  async function generateDebtTrap() {
    setDebtLoading(true);
    setDebtResult(null);

    const payload = {
      Loan_Repayment: Number(debtForm.Loan_Repayment) || 0,
      Peak_Income: Number(debtForm.Peak_Income) || 0,
      Lean_Income: Number(debtForm.Lean_Income) || 0,
      Zero_Income_Months: Number(debtForm.Zero_Income_Months) || 0,
      Loan_Interest: Number(debtForm.Loan_Interest) || 24,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/debt-trap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setDebtResult(data);
    } catch (err) {
      console.error(err);
      alert(t("Backend error"));
    } finally {
      setDebtLoading(false);
    }
  }

  async function generateVariableIncome() {
    setVarLoading(true);
    setVarResult(null);

    const payload = {};
    for (const key in varForm) {
      payload[key] =
        key === "Occupation" || key === "City_Tier"
          ? varForm[key]
          : Number(varForm[key]) || 0;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/investment-graph/variable-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const yearly = toYearlyFromMonthly(data.yearly_projection);
      setVarResult({ ...data, yearly_projection: yearly });
    } catch (err) {
      console.error(err);
      alert(t("Backend error"));
    } finally {
      setVarLoading(false);
    }
  }

  async function generateMissedPayments() {
    setMissedLoading(true);
    setMissedResult(null);

    const payload = {};
    for (const key in missedForm) {
      payload[key] =
        key === "Occupation" || key === "City_Tier"
          ? missedForm[key]
          : Number(missedForm[key]) || 0;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/investment-graph/missed-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const normalYearly = toYearlyFromMonthly(data.normal_projection);
      const missedYearly = toYearlyFromMonthly(data.missed_projection);
      const normalFinal = normalYearly[normalYearly.length - 1]?.total ?? 0;
      const missedFinal = missedYearly[missedYearly.length - 1]?.total ?? 0;
      setMissedResult({
        ...data,
        normal_yearly: normalYearly,
        missed_yearly: missedYearly,
        normal_final: normalFinal,
        missed_final: missedFinal,
        delta_final: normalFinal - missedFinal,
      });
    } catch (err) {
      console.error(err);
      alert(t("Backend error"));
    } finally {
      setMissedLoading(false);
    }
  }

  return (
    <Card className="bg-card border border-border rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl">{t("Investment Allocation Simulator")}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Label className="text-sm">{t("Rural mode")}</Label>
              <p className="text-xs text-muted-foreground">{t("Debt trap, variable income, missed payments")}</p>
            </div>
            <Switch checked={isRural} onCheckedChange={setIsRural} className="data-[state=checked]:bg-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isRural ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {["Income", "Age", "Dependents", "Occupation", "City_Tier"].map(
                (key) => (
                  <div key={key} className="space-y-1">
                    {key === "Dependents" ? (
                      <div className="flex items-center gap-1">
                        <Label>{t("Dependents")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                              aria-label={t("Dependents info")}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm text-muted-foreground">
                              {t("Represents the number of people financially dependent on you.")}
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <Label>{t(key === "Income" ? "Monthly Income" : key.replace("_", " "))}</Label>
                    )}
                    {renderInputField(key, form[key], update, t(key === "Income" ? "Monthly Income" : key.replace("_", " ")))}
                  </div>
                )
              )}
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">{t("Monthly Expenses")}</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Rent",
                  "Loan_Repayment",
                  "Insurance",
                  "Groceries",
                  "Transport",
                  "Eating_Out",
                  "Entertainment",
                  "Utilities",
                  "Healthcare",
                  "Education",
                  "Miscellaneous",
                ].map((key) => (
                  <div key={key} className="space-y-1">
                    <Label>{t(key.replace("_", " "))}</Label>
                    <Input
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={t(key.replace("_", " "))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-2">
              <Label className="text-sm text-muted-foreground">{t("Financial goals")}</Label>
              <Textarea
                value={financialGoals}
                onChange={(e) => setFinancialGoals(e.target.value)}
                placeholder={t("E.g., emergency fund in 2 years, child education, retirement, buy a home...")}
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground">
                {t("This will be used to generate a personalized explanation (optional).")}
              </p>
            </div>

            <Button onClick={generate} disabled={loading}>
              {loading ? t("Calculating...") : t("Get Recommended Option")}
            </Button>

            {recommendedOption && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">{t("Recommended option")}</p>
                      <p className="text-lg font-semibold">{recommendedOption}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <Label>{t("View investment growth for:")}</Label>
                  <Select value={selectedInvestmentType} onValueChange={setSelectedInvestmentType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("Select investment type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="SIP">SIP</SelectItem>
                      <SelectItem value="RD">RD</SelectItem>
                      <SelectItem value="FD">FD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedInvestmentType && (
                  <Button onClick={generateInvestmentGraph} disabled={graphLoading}>
                    {graphLoading ? t("Generating...") : t("Generate Graph")}
                  </Button>
                )}

                {graphResult && (
                  <>
                    {(() => {
                      const projection = Array.isArray(graphResult.yearly_projection) ? graphResult.yearly_projection : [];
                      const displayProjection = projection.map((p) => {
                        const sip = Number(p?.sip) || 0;
                        const rd = Number(p?.rd) || 0;
                        const fd = Number(p?.fd) || 0;

                        if (selectedInvestmentType === "SIP") return { ...p, sip: sip + rd + fd, rd: 0, fd: 0 };
                        if (selectedInvestmentType === "RD") return { ...p, rd: sip + rd + fd, sip: 0, fd: 0 };
                        if (selectedInvestmentType === "FD") return { ...p, fd: sip + rd + fd, sip: 0, rd: 0 };
                        return p;
                      });

                      const finalValues = getFinalValuesFromYearlyProjection(displayProjection);

                      return (
                        <>
                          {selectedInvestmentType === "Hybrid" ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <Card>
                                <CardContent className="pt-4">
                                  <p className="text-xs text-muted-foreground">{t("SIP (final)")}</p>
                                  <p className="text-lg font-semibold">{formatCurrency(finalValues.sip)}</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-4">
                                  <p className="text-xs text-muted-foreground">{t("RD (final)")}</p>
                                  <p className="text-lg font-semibold">{formatCurrency(finalValues.rd)}</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-4">
                                  <p className="text-xs text-muted-foreground">{t("FD (final)")}</p>
                                  <p className="text-lg font-semibold">{formatCurrency(finalValues.fd)}</p>
                                </CardContent>
                              </Card>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                              <Card>
                                <CardContent className="pt-4">
                                  <p className="text-xs text-muted-foreground">{t(`${selectedInvestmentType} (final)`)}</p>
                                  <p className="text-lg font-semibold">
                                    {formatCurrency(
                                      selectedInvestmentType === "SIP"
                                        ? finalValues.sip
                                        : selectedInvestmentType === "RD"
                                          ? finalValues.rd
                                          : finalValues.fd
                                    )}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-xs text-muted-foreground">{t("Saving capacity")}</p>
                                <p className="text-lg font-semibold">
                                  {graphResult.saving_capacity.charAt(0).toUpperCase() + graphResult.saving_capacity.slice(1)}
                                </p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-xs text-muted-foreground">{t("Risk profile")}</p>
                                <p className="text-lg font-semibold">
                                  {graphResult.risk_profile.charAt(0).toUpperCase() + graphResult.risk_profile.slice(1)}
                                </p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardContent className="pt-4">
                                <p className="text-xs text-muted-foreground">{t("Monthly savings")}</p>
                                <p className="text-lg font-semibold">{formatCurrency(graphResult.monthly_savings)}</p>
                              </CardContent>
                            </Card>

                            {selectedInvestmentType === "Hybrid" ? (
                              <>
                                <Card>
                                  <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">{t("SIP Percentage Allocation")}</p>
                                    <p className="text-lg font-semibold">{graphResult.sip_pct}%</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">{t("RD Percentage Allocation")}</p>
                                    <p className="text-lg font-semibold">{graphResult.rd_pct}%</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">{t("FD Percentage Allocation")}</p>
                                    <p className="text-lg font-semibold">{graphResult.fd_pct}%</p>
                                  </CardContent>
                                </Card>
                              </>
                            ) : null}
                          </div>

                          <div className="h-[360px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={displayProjection}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={formatCurrency} />
                                <Tooltip formatter={formatCurrency} />
                                <Legend />

                                {selectedInvestmentType === "Hybrid" ? (
                                  <>
                                    <Area type="monotone" dataKey="sip" name="SIP" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground) / 0.10)" fillOpacity={1} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="rd" name="RD" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.12)" fillOpacity={1} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="fd" name="FD" stroke="hsl(var(--foreground) / 0.70)" fill="hsl(var(--foreground) / 0.08)" fillOpacity={1} isAnimationActive={false} />
                                  </>
                                ) : selectedInvestmentType === "SIP" ? (
                                  <Area type="monotone" dataKey="sip" name="SIP" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground) / 0.10)" fillOpacity={1} isAnimationActive={false} />
                                ) : selectedInvestmentType === "RD" ? (
                                  <Area type="monotone" dataKey="rd" name="RD" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.12)" fillOpacity={1} isAnimationActive={false} />
                                ) : (
                                  <Area type="monotone" dataKey="fd" name="FD" stroke="hsl(var(--foreground) / 0.70)" fill="hsl(var(--foreground) / 0.08)" fillOpacity={1} isAnimationActive={false} />
                                )}
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          {selectedInvestmentType === "Hybrid" ? (
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "This graph shows how your total monthly savings are optimally split between SIP, RD and FD to maximize long-term returns."
                              )}
                            </p>
                          ) : null}
                          {/* ================= AI EXPLANATION ================= */}
                          <Card className="bg-card border border-border rounded-lg shadow-sm mt-6">
                            <CardHeader>
                              <CardTitle className="text-lg">Personalized Investment Explanation</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {!aiExplanation && (
                                <Button
                                  onClick={generateAiExplanation}
                                  disabled={aiLoading}
                                >
                                  {aiLoading ? "Generating explanation…" : "Explain this recommendation"}
                                </Button>
                              )}

                              {aiError && (
                                <p className="text-sm text-destructive">{aiError}</p>
                              )}

                              {aiExplanation && (
                                <>
                                  <div className="whitespace-pre-line text-sm leading-relaxed">
                                    {aiExplanation}
                                  </div>

                                  {/* ===== Blockchain verification ===== */}
                                  <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                                    <p className="text-sm font-semibold text-foreground">
                                      Integrity verification
                                    </p>

                                    {hashLoading ? (
                                      <p className="text-xs text-muted-foreground">
                                        Generating cryptographic proof…
                                      </p>
                                    ) : adviceHash ? (
                                      <>
                                        <p className="text-xs text-muted-foreground">
                                          SHA-256 hash stored on immutable ledger
                                        </p>
                                        <p className="break-all text-[11px] text-muted-foreground">
                                          {adviceHash}
                                        </p>
                                      </>
                                    ) : hashError ? (
                                      <p className="text-xs text-destructive">{hashError}</p>
                                    ) : null}
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>

                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <Tabs value={ruralTab} onValueChange={setRuralTab}>
            <TabsList className="flex w-full flex-wrap items-center justify-start gap-1 bg-muted border border-border rounded-md p-1">
              <TabsTrigger value="debtTrap" className="rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                {t("Debt Trap")}
              </TabsTrigger>
              <TabsTrigger value="variableIncome" className="rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                {t("Variable Income")}
              </TabsTrigger>
              <TabsTrigger value="missedPayments" className="rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                {t("Missed Payments")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="debtTrap" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {["Loan_Repayment", "Peak_Income", "Lean_Income", "Zero_Income_Months", "Loan_Interest"].map((key) => (
                  <div key={key} className="space-y-1">
                    <Label>{t(key.replaceAll("_", " "))}</Label>
                    <Input value={debtForm[key]} onChange={(e) => updateDebt(key, e.target.value)} placeholder={t(key.replaceAll("_", " "))} />
                  </div>
                ))}
              </div>

              <Button onClick={generateDebtTrap} disabled={debtLoading}>
                {debtLoading ? t("Checking...") : t("Check Debt Trap")}
              </Button>

              {debtResult ? (
                <Card className="bg-card border border-border rounded-lg shadow-sm">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{t("Result")}</p>
                      <span className="text-sm font-semibold text-foreground">
                        {debtResult.debt_trap ? t("Debt-trap risk") : t("Looks safe")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("Minimum income considered:")} {formatCurrency(debtResult.min_income_used)}
                    </p>
                    {Array.isArray(debtResult.reasons) && debtResult.reasons.length ? (
                      <div className="space-y-1">
                        {debtResult.reasons.map((r, idx) => (
                          <p key={`${r}-${idx}`} className="text-sm">
                            {r}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">{t("No red flags detected based on the inputs.")}</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="variableIncome" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Income",
                  "Age",
                  "Dependents",
                  "Occupation",
                  "City_Tier",
                  "Peak_Income",
                  "Lean_Income",
                  "Zero_Income_Months",
                ].map((key) => (
                  <div key={key} className="space-y-1">
                    {key === "Dependents" ? (
                      <div className="flex items-center gap-1">
                        <Label>{t("Dependents")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                              aria-label={t("Dependents info")}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm text-muted-foreground">
                              {t("Represents the number of people financially dependent on you.")}
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <Label>{t(key === "Income" ? "Monthly Income" : key.replaceAll("_", " "))}</Label>
                    )}
                    {key === "Income" || key === "Dependents" || key === "Occupation" || key === "City_Tier" 
                      ? renderInputField(key, varForm[key], updateVar, t(key === "Income" ? "Monthly Income" : key.replaceAll("_", " ")))
                      : <Input value={varForm[key]} onChange={(e) => updateVar(key, e.target.value)} placeholder={t(key.replaceAll("_", " "))} />
                    }
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">{t("Monthly Expenses")}</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Rent",
                    "Loan_Repayment",
                    "Insurance",
                    "Groceries",
                    "Transport",
                    "Eating_Out",
                    "Entertainment",
                    "Utilities",
                    "Healthcare",
                    "Education",
                    "Miscellaneous",
                  ].map((key) => (
                    <div key={key} className="space-y-1">
                      <Label>{t(key.replace("_", " "))}</Label>
                      <Input value={varForm[key]} onChange={(e) => updateVar(key, e.target.value)} placeholder={t(key.replace("_", " "))} />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={generateVariableIncome} disabled={varLoading}>
                {varLoading ? t("Calculating...") : t("Generate 10-Year Graph")}
              </Button>

              {varResult ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">{t("Saving capacity")}</p>
                        <p className="text-lg font-semibold">
                          {String(varResult.saving_capacity || "-")
                            .charAt(0)
                            .toUpperCase() + String(varResult.saving_capacity || "").slice(1)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">{t("Risk profile")}</p>
                        <p className="text-lg font-semibold">
                          {String(varResult.risk_profile || "-")
                            .charAt(0)
                            .toUpperCase() + String(varResult.risk_profile || "").slice(1)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={varResult.yearly_projection}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip formatter={formatCurrency} />
                        <Legend />
                        <Area type="monotone" dataKey="sip" name="SIP" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground) / 0.10)" fillOpacity={1} isAnimationActive={false} />
                        <Area type="monotone" dataKey="rd" name="RD" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.12)" fillOpacity={1} isAnimationActive={false} />
                        <Area type="monotone" dataKey="fd" name="FD" stroke="hsl(var(--foreground) / 0.70)" fill="hsl(var(--foreground) / 0.08)" fillOpacity={1} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="missedPayments" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {["Income", "Age", "Dependents", "Occupation", "City_Tier", "Missed_Months"].map((key) => (
                  <div key={key} className="space-y-1">
                    {key === "Dependents" ? (
                      <div className="flex items-center gap-1">
                        <Label>{t("Dependents")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                              aria-label={t("Dependents info")}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm text-muted-foreground">
                              {t("Represents the number of people financially dependent on you.")}
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <Label>{t(key === "Income" ? "Monthly Income" : key.replaceAll("_", " "))}</Label>
                    )}
                    {key === "Income" || key === "Dependents" || key === "Occupation" || key === "City_Tier" 
                      ? renderInputField(key, missedForm[key], updateMissed, t(key === "Income" ? "Monthly Income" : key.replaceAll("_", " ")))
                      : <Input value={missedForm[key]} onChange={(e) => updateMissed(key, e.target.value)} placeholder={t(key.replaceAll("_", " "))} />
                    }
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">{t("Monthly Expenses")}</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Rent",
                    "Loan_Repayment",
                    "Insurance",
                    "Groceries",
                    "Transport",
                    "Eating_Out",
                    "Entertainment",
                    "Utilities",
                    "Healthcare",
                    "Education",
                    "Miscellaneous",
                  ].map((key) => (
                    <div key={key} className="space-y-1">
                      <Label>{t(key.replace("_", " "))}</Label>
                      <Input value={missedForm[key]} onChange={(e) => updateMissed(key, e.target.value)} placeholder={t(key.replace("_", " "))} />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={generateMissedPayments} disabled={missedLoading}>
                {missedLoading ? t("Calculating...") : t("Compare With/Without Missed Payments")}
              </Button>

              {missedResult ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-card border border-border rounded-lg shadow-sm">
                      <CardContent className="pt-5 space-y-1">
                        <p className="text-xs text-muted-foreground">{t("Without missed payments (10Y)")}</p>
                        <p className="text-lg font-semibold">{formatCurrency(missedResult.normal_final)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border border-border rounded-lg shadow-sm">
                      <CardContent className="pt-5 space-y-1">
                        <p className="text-xs text-muted-foreground">{t("With missed payments (10Y)")}</p>
                        <p className="text-lg font-semibold">{formatCurrency(missedResult.missed_final)}</p>
                        <p className="text-xs text-muted-foreground">{t("You still make:")} {formatCurrency(missedResult.missed_final)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-card border border-border rounded-lg shadow-sm">
                    <CardContent className="pt-5 space-y-3">
                      <p className="text-sm font-semibold">{t("Impact")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("Difference after 10 years:")} {formatCurrency(missedResult.delta_final)}
                      </p>
                      <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={missedResult.normal_yearly.map((p, idx) => ({
                              year: p.year,
                              normal_total: p.total,
                              missed_total: missedResult.missed_yearly[idx]?.total ?? 0,
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={formatCurrency} />
                            <Tooltip formatter={formatCurrency} />
                            <Legend />
                            <Area type="monotone" dataKey="normal_total" name={t("No missed")} stroke="hsl(var(--foreground))" fill="hsl(var(--foreground) / 0.10)" fillOpacity={1} isAnimationActive={false} />
                            <Area type="monotone" dataKey="missed_total" name={t("Missed")} stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.12)" fillOpacity={1} isAnimationActive={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
