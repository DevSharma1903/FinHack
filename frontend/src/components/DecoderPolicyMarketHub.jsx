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

/* ================= helpers ================= */

function formatCurrency(value) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ================= component ================= */

export function DecoderPolicyMarketHub() {
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

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function generate() {
    setLoading(true);
    setResult(null);

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

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-xl">Investment Allocation Simulator</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ===== BASIC INFO ===== */}
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

        {/* ===== EXPENSES ===== */}
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

        <Button onClick={generate} disabled={loading}>
          {loading ? "Calculating..." : "Generate Investment Graph"}
        </Button>

        {/* ===== RESULT ===== */}
        {result && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Saving capacity</p>
                  <p className="text-lg font-semibold">
                    {result.saving_capacity.charAt(0).toUpperCase()+result.saving_capacity.slice(1)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Risk profile</p>
                  <p className="text-lg font-semibold">
                    {result.risk_profile.charAt(0).toUpperCase()+result.risk_profile.slice(1)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Monthly savings
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(result.monthly_savings)}
                  </p>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
