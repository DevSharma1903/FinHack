import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { policyLibrarySeed } from "@/lib/policyMarketData";
import { clampNumber, computeInsuranceNeed } from "@/lib/insurance";
import { simulateInvestment } from "@/lib/investmentSim";

function formatCurrency(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";

  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PolicyMarketHub({
  mode = "product",
  defaultTab = "curves",
  visibleTabs = ["curves", "insurance", "education"],
  hideHeader = false,
} = {}) {
  const isProduct = mode === "product";

  const [tabValue, setTabValue] = useState(defaultTab);

  const [insuranceInputs, setInsuranceInputs] = useLocalStorageState("pmh.insurance", {
    age: 28,
    annualIncome: 1200000,
    annualExpenses: 600000,
    dependents: 2,
    liabilities: 1500000,
    currentCover: 5000000,
    goalYears: 20,
  });

  const [curveInputs, setCurveInputs] = useLocalStorageState("pmh.curves", {
    years: 20,
    age: 28,
    goalAge: 60,
    monthlyInvestment: 10000,
    expectedReturn: 12,
    inflation: 6,
  });

  useEffect(() => {
    setTabValue(defaultTab);
  }, [defaultTab]);

  const curveResults = useMemo(() => {
    const yearsFromAge = clampNumber(Number(curveInputs.goalAge) - Number(curveInputs.age), 1, 60, 20);
    const years = isProduct ? yearsFromAge : clampNumber(curveInputs.years, 1, 60, 20);
    const monthlyInvestment = clampNumber(curveInputs.monthlyInvestment, 0, 10000000, 10000);
    const expectedReturn = clampNumber(curveInputs.expectedReturn, 0, 30, 12);
    const inflation = clampNumber(curveInputs.inflation, 0, 20, 6);

    const sip = simulateInvestment({ years, monthlyInvestment, expectedReturn, inflation, investmentType: "sip" });
    const rd = simulateInvestment({ years, monthlyInvestment, expectedReturn, inflation, investmentType: "rd" });
    const fd = simulateInvestment({ years, monthlyInvestment, expectedReturn, inflation, investmentType: "fd" });

    const chartData = Array.from({ length: years }, (_, idx) => {
      const year = idx + 1;
      const sipPoint = sip.yearlyData[idx] || {};
      const rdPoint = rd.yearlyData[idx] || {};
      const fdPoint = fd.yearlyData[idx] || {};
      return {
        year,
        sip: sipPoint.totalCorpus || 0,
        rd: rdPoint.totalCorpus || 0,
        fd: fdPoint.totalCorpus || 0,
      };
    });

    return { sip, rd, fd, chartData };
  }, [curveInputs, isProduct]);

  const insurance = useMemo(() => {
    return computeInsuranceNeed({
      age: clampNumber(insuranceInputs.age, 18, 70, 30),
      annualIncome: clampNumber(insuranceInputs.annualIncome, 0, 100000000, 0),
      annualExpenses: clampNumber(insuranceInputs.annualExpenses, 0, 100000000, 0),
      dependents: clampNumber(insuranceInputs.dependents, 0, 10, 0),
      liabilities: clampNumber(insuranceInputs.liabilities, 0, 1000000000, 0),
      currentCover: clampNumber(insuranceInputs.currentCover, 0, 1000000000, 0),
      goalYears: clampNumber(insuranceInputs.goalYears, 5, 40, 20),
    });
  }, [insuranceInputs]);

  return (
    <Card className="glass">
      {!hideHeader ? (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Policy & Market Hub</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Growth curves, insurance needs, and tax-aware education for Indian investors.
              </p>
            </div>
          </div>
        </CardHeader>
      ) : null}

      <CardContent>
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="flex w-full flex-wrap items-center justify-start gap-1 glass p-1">
            {visibleTabs.includes("curves") ? (
              <TabsTrigger value="curves" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Growth Curves
              </TabsTrigger>
            ) : null}
            {visibleTabs.includes("insurance") ? (
              <TabsTrigger value="insurance" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Insurance
              </TabsTrigger>
            ) : null}
            {visibleTabs.includes("education") ? (
              <TabsTrigger value="education" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Education
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="curves" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="glass-strong rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Curve inputs</p>

                  <div className="grid grid-cols-2 gap-3">
                    {isProduct ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Current age</Label>
                          <Input value={curveInputs.age} onChange={(e) => setCurveInputs((p) => ({ ...p, age: e.target.value }))} className="bg-secondary" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Goal age</Label>
                          <Input value={curveInputs.goalAge} onChange={(e) => setCurveInputs((p) => ({ ...p, goalAge: e.target.value }))} className="bg-secondary" />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Years</Label>
                        <Input value={curveInputs.years} onChange={(e) => setCurveInputs((p) => ({ ...p, years: e.target.value }))} className="bg-secondary" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Monthly investment</Label>
                      <Input value={curveInputs.monthlyInvestment} onChange={(e) => setCurveInputs((p) => ({ ...p, monthlyInvestment: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Expected return (p.a.)</Label>
                      <Input value={curveInputs.expectedReturn} onChange={(e) => setCurveInputs((p) => ({ ...p, expectedReturn: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Inflation</Label>
                      <Input value={curveInputs.inflation} onChange={(e) => setCurveInputs((p) => ({ ...p, inflation: e.target.value }))} className="bg-secondary" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    <div className="glass rounded-2xl p-4 hover:border-primary/40 transition-all duration-200">
                      <p className="text-xs text-muted-foreground">SIP corpus</p>
                      <p className="mt-2 text-base font-semibold text-primary">{formatCurrency(curveResults.sip.totalCorpus)}</p>
                    </div>
                    <div className="glass rounded-2xl p-4 hover:border-primary/40 transition-all duration-200">
                      <p className="text-xs text-muted-foreground">RD corpus</p>
                      <p className="mt-2 text-base font-semibold text-success">{formatCurrency(curveResults.rd.totalCorpus)}</p>
                    </div>
                    <div className="glass rounded-2xl p-4 hover:border-primary/40 transition-all duration-200">
                      <p className="text-xs text-muted-foreground">FD corpus</p>
                      <p className="mt-2 text-base font-semibold text-accent-foreground">{formatCurrency(curveResults.fd.totalCorpus)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="glass-strong rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">SIP vs RD vs FD</p>
                    <Badge variant="secondary" className="bg-secondary border-primary/20">calculated</Badge>
                  </div>

                  <div className="mt-4 h-[22rem] md:h-[28rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curveResults.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            return (
                              <div className="rounded-lg p-3 border border-border bg-card">
                                <p className="text-sm font-semibold text-foreground mb-2">Year: {label}</p>
                                {payload.map((p) => (
                                  <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
                                    {String(p.name)}: {formatCurrency(p.value)}
                                  </p>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Legend formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />

                        <Area type="monotone" dataKey="sip" name="SIP" stroke="hsl(195, 100%, 65%)" fill="hsl(195, 100%, 65%)" fillOpacity={0.25} strokeWidth={3} dot={false} isAnimationActive animationDuration={1200} />
                        <Area type="monotone" dataKey="rd" name="RD" stroke="hsl(142, 76%, 50%)" fill="hsl(142, 76%, 50%)" fillOpacity={0.25} strokeWidth={3} dot={false} isAnimationActive animationDuration={1300} />
                        <Area type="monotone" dataKey="fd" name="FD" stroke="hsl(250, 70%, 65%)" fill="hsl(250, 70%, 65%)" fillOpacity={0.2} strokeWidth={3} dot={false} isAnimationActive animationDuration={1400} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insurance" className="mt-4">
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground">Insurance needs calculator</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This is implemented (local calculation + persistence). You can later connect premium quotes from insurers.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Age</Label>
                      <Input value={insuranceInputs.age} onChange={(e) => setInsuranceInputs((p) => ({ ...p, age: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Dependents</Label>
                      <Input value={insuranceInputs.dependents} onChange={(e) => setInsuranceInputs((p) => ({ ...p, dependents: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Annual income</Label>
                      <Input value={insuranceInputs.annualIncome} onChange={(e) => setInsuranceInputs((p) => ({ ...p, annualIncome: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Annual expenses</Label>
                      <Input value={insuranceInputs.annualExpenses} onChange={(e) => setInsuranceInputs((p) => ({ ...p, annualExpenses: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Liabilities</Label>
                      <Input value={insuranceInputs.liabilities} onChange={(e) => setInsuranceInputs((p) => ({ ...p, liabilities: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Existing cover</Label>
                      <Input value={insuranceInputs.currentCover} onChange={(e) => setInsuranceInputs((p) => ({ ...p, currentCover: e.target.value }))} className="bg-secondary" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs text-muted-foreground">Income replacement years</Label>
                      <Input value={insuranceInputs.goalYears} onChange={(e) => setInsuranceInputs((p) => ({ ...p, goalYears: e.target.value }))} className="bg-secondary" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="glass rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground">Suggested new cover</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{formatCurrency(insurance.recommendedCover)}</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground">Coverage multiple</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{insurance.coverageMultiple.toFixed(1)}x</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground">Recommendation</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{insurance.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">India tax basics for SIP, RD, FD and retirement planning</p>
                    <Badge variant="secondary" className="bg-secondary">library</Badge>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instrument</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>What to watch</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policyLibrarySeed.map((p, idx) => (
                          <TableRow key={`${p.instrument}-${idx}`}>
                            <TableCell className="font-medium">{p.instrument}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-secondary">{p.category}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.note}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator className="my-4" />

                  <p className="text-sm font-semibold text-foreground">How to use this in planning</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Compare returns across SIP/FD/RD using post-tax assumptions, and choose deductions (old tax regime) that
                    match your horizon and liquidity needs.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="glass rounded-2xl p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Education layer</p>
                  <p className="text-sm text-muted-foreground">
                    Quick reference for common Indian tax-saving choices and where they fit in a retirement plan.
                  </p>

                  <div className="space-y-3">
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">80C (deduction)</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Common buckets include EPF/VPF, PPF, ELSS, life insurance premium, home-loan principal, SCSS and Sukanya.
                      </p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">NPS (80CCD)</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Contributions can qualify under 80CCD(1) (within overall limit), 80CCD(1B) (additional), and 80CCD(2)
                        for employer contributions (if applicable).
                      </p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">80D (health insurance)</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Premiums for health insurance (self/family/parents) can reduce taxable income under Section 80D (limits vary).
                      </p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">FD/RD taxation</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Interest is generally taxable as per your slab. Use post-tax return for comparisons, and remember TDS may apply.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}