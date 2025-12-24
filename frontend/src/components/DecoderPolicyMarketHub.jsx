import { useState } from "react";
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

import { generateSipRdFdExplanation } from "@/lib/gemini";

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

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Backend error");
    } finally {
      setLoading(false);
    }
  }

  async function generateAiExplanation() {
    if (!result) return;

    setAiLoading(true);
    setAiError("");
    setAiExplanation("");

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
        },
        recommendedOption: recommended,
      });

      setAiExplanation(text);
    } catch (err) {
      console.error(err);
      setAiError(err instanceof Error ? err.message : "Failed to generate explanation.");
    } finally {
      setAiLoading(false);
    }
  }

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
      alert("Backend error");
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
      alert("Backend error");
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
      alert("Backend error");
    } finally {
      setMissedLoading(false);
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl">Investment Allocation Simulator</CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Label className="text-sm">Rural mode</Label>
              <p className="text-xs text-muted-foreground">Debt trap, variable income, missed payments</p>
            </div>
            <Switch checked={isRural} onCheckedChange={setIsRural} className="data-[state=checked]:bg-accent" />
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
                    <Label>{key.replace("_", " ")}</Label>
                    <Input
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={key}
                    />
                  </div>
                )
              )}
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Monthly Expenses</p>
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
                    <Label>{key.replace("_", " ")}</Label>
                    <Input
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={key}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4 space-y-2">
              <Label className="text-sm text-muted-foreground">Financial goals</Label>
              <Textarea
                value={financialGoals}
                onChange={(e) => setFinancialGoals(e.target.value)}
                placeholder="E.g., emergency fund in 2 years, child education, retirement, buy a home..."
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground">
                This will be used to generate a personalized explanation (optional).
              </p>
            </div>

            <Button onClick={generate} disabled={loading}>
              {loading ? "Calculating..." : "Generate Investment Graph"}
            </Button>

            {result && (
              <>
                {(() => {
                  const finalValues = getFinalValuesFromYearlyProjection(result.yearly_projection);
                  const recommended = getRecommendedOptionFromProjection(finalValues);
                  return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Recommended option</p>
                          <p className="text-lg font-semibold">{recommended}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">SIP (final)</p>
                          <p className="text-lg font-semibold">{formatCurrency(finalValues.sip)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">RD (final)</p>
                          <p className="text-lg font-semibold">{formatCurrency(finalValues.rd)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">FD (final)</p>
                          <p className="text-lg font-semibold">{formatCurrency(finalValues.fd)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Saving capacity</p>
                      <p className="text-lg font-semibold">
                        {result.saving_capacity.charAt(0).toUpperCase() + result.saving_capacity.slice(1)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Risk profile</p>
                      <p className="text-lg font-semibold">
                        {result.risk_profile.charAt(0).toUpperCase() + result.risk_profile.slice(1)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Monthly savings</p>
                      <p className="text-lg font-semibold">{formatCurrency(result.monthly_savings)}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.yearly_projection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={formatCurrency} />
                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="sip"
                        name="SIP"
                        stroke="#38bdf8"
                        fill="#38bdf8"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="rd"
                        name="RD"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="fd"
                        name="FD"
                        stroke="#a855f7"
                        fill="#a855f7"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <Card className="glass">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">AI explanation (Gemini)</p>
                      <Button
                        onClick={generateAiExplanation}
                        disabled={aiLoading}
                        variant="secondary"
                        className="bg-secondary"
                      >
                        {aiLoading ? "Generating..." : "Generate explanation"}
                      </Button>
                    </div>

                    {aiError ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">{aiError}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Make sure `VITE_GEMINI_API_KEY` is set in `frontend/.env` and restart the dev server.
                        </p>
                      </div>
                    ) : null}

                    {aiExplanation ? (
                      <div className="rounded-lg border border-border bg-card p-4">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{aiExplanation}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click “Generate explanation” to see why SIP/RD/FD is recommended for your inputs.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : (
          <Tabs value={ruralTab} onValueChange={setRuralTab}>
            <TabsList className="flex w-full flex-wrap items-center justify-start gap-1 glass p-1">
              <TabsTrigger value="debtTrap" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Debt Trap
              </TabsTrigger>
              <TabsTrigger value="variableIncome" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Variable Income
              </TabsTrigger>
              <TabsTrigger value="missedPayments" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Missed Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="debtTrap" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {["Loan_Repayment", "Peak_Income", "Lean_Income", "Zero_Income_Months", "Loan_Interest"].map((key) => (
                  <div key={key} className="space-y-1">
                    <Label>{key.replaceAll("_", " ")}</Label>
                    <Input value={debtForm[key]} onChange={(e) => updateDebt(key, e.target.value)} placeholder={key} />
                  </div>
                ))}
              </div>

              <Button onClick={generateDebtTrap} disabled={debtLoading}>
                {debtLoading ? "Checking..." : "Check Debt Trap"}
              </Button>

              {debtResult ? (
                <Card className="glass">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Result</p>
                      <span className={debtResult.debt_trap ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-success"}>
                        {debtResult.debt_trap ? "Debt-trap risk" : "Looks safe"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minimum income considered: {formatCurrency(debtResult.min_income_used)}
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
                      <p className="text-sm">No red flags detected based on the inputs.</p>
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
                    <Label>{key.replaceAll("_", " ")}</Label>
                    <Input value={varForm[key]} onChange={(e) => updateVar(key, e.target.value)} placeholder={key} />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Monthly Expenses</p>
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
                      <Label>{key.replace("_", " ")}</Label>
                      <Input value={varForm[key]} onChange={(e) => updateVar(key, e.target.value)} placeholder={key} />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={generateVariableIncome} disabled={varLoading}>
                {varLoading ? "Calculating..." : "Generate 10-Year Graph"}
              </Button>

              {varResult ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Saving capacity</p>
                        <p className="text-lg font-semibold">
                          {String(varResult.saving_capacity || "-")
                            .charAt(0)
                            .toUpperCase() + String(varResult.saving_capacity || "").slice(1)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Risk profile</p>
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
                        <Area type="monotone" dataKey="sip" name="SIP" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="rd" name="RD" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="fd" name="FD" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
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
                    <Label>{key.replaceAll("_", " ")}</Label>
                    <Input value={missedForm[key]} onChange={(e) => updateMissed(key, e.target.value)} placeholder={key} />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Monthly Expenses</p>
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
                      <Label>{key.replace("_", " ")}</Label>
                      <Input value={missedForm[key]} onChange={(e) => updateMissed(key, e.target.value)} placeholder={key} />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={generateMissedPayments} disabled={missedLoading}>
                {missedLoading ? "Calculating..." : "Compare With/Without Missed Payments"}
              </Button>

              {missedResult ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="glass">
                      <CardContent className="pt-5 space-y-1">
                        <p className="text-xs text-muted-foreground">Without missed payments (10Y)</p>
                        <p className="text-lg font-semibold">{formatCurrency(missedResult.normal_final)}</p>
                      </CardContent>
                    </Card>
                    <Card className="glass">
                      <CardContent className="pt-5 space-y-1">
                        <p className="text-xs text-muted-foreground">With missed payments (10Y)</p>
                        <p className="text-lg font-semibold">{formatCurrency(missedResult.missed_final)}</p>
                        <p className="text-xs text-muted-foreground">You still make: {formatCurrency(missedResult.missed_final)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="glass">
                    <CardContent className="pt-5 space-y-3">
                      <p className="text-sm font-semibold">Impact</p>
                      <p className="text-sm text-muted-foreground">
                        Difference after 10 years: {formatCurrency(missedResult.delta_final)}
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
                            <Area type="monotone" dataKey="normal_total" name="No missed" stroke="#22c55e" fill="#22c55e" fillOpacity={0.18} />
                            <Area type="monotone" dataKey="missed_total" name="Missed" stroke="#f97316" fill="#f97316" fillOpacity={0.18} />
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
