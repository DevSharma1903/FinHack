import * as React from "react";
import { parseISO, subMonths } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/i18n";
import { toast } from "sonner";

type NavPoint = {
  date: string;
  nav: number;
};

type SchemeSeries = {
  id: string;
  label: string;
  points: NavPoint[];
};

type NavDataResponse = {
  schemes: SchemeSeries[];
};

type TimeRange = "all" | "12m" | "6m" | "1m";

const COLORS = [
  "hsl(195, 100%, 65%)",
  "hsl(142, 76%, 50%)",
  "hsl(250, 70%, 65%)",
  "hsl(45, 100%, 55%)",
  "hsl(15, 90%, 60%)",
  "hsl(280, 70%, 65%)",
  "hsl(210, 90%, 60%)",
  "hsl(120, 60%, 45%)",
  "hsl(330, 80%, 60%)",
  "hsl(90, 70%, 45%)",
  "hsl(0, 0%, 70%)",
  "hsl(30, 90%, 55%)",
  "hsl(160, 80%, 45%)",
  "hsl(200, 80%, 55%)",
  "hsl(260, 65%, 60%)",
  "hsl(60, 90%, 55%)",
];

function formatNav(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(4);
}

function parseSchemeId(id: string) {
  const parts = id.split("_");
  const pfm = parts[0] || "";
  const scheme = parts[1] || "";
  const tier = parts.slice(2).join("_") || "";
  return { pfm, scheme, tier };
}

function filterPointsByRange(points: NavPoint[], range: TimeRange) {
  if (range === "all") return points;
  if (points.length === 0) return points;

  const maxDate = parseISO(points[points.length - 1].date);
  const cutoff =
    range === "12m"
      ? subMonths(maxDate, 12)
      : range === "6m"
        ? subMonths(maxDate, 6)
        : subMonths(maxDate, 1);

  return points.filter((p) => parseISO(p.date) >= cutoff);
}

function computeDomainFromValues(values: number[]) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return undefined;

  const min = Math.min(...finite);
  const max = Math.max(...finite);

  if (min === max) {
    const pad = Math.max(0.01, Math.abs(min) * 0.01);
    return [min - pad, max + pad] as [number, number];
  }

  const pad = Math.max(0.01, (max - min) * 0.12);
  return [min - pad, max + pad] as [number, number];
}

function mergeSchemesToChartData(schemes: SchemeSeries[]) {
  const allDates = new Set<string>();
  const seriesMaps = new Map<string, Map<string, number>>();

  for (const scheme of schemes) {
    const byDate = new Map<string, number>();
    for (const p of scheme.points) {
      allDates.add(p.date);
      byDate.set(p.date, p.nav);
    }
    seriesMaps.set(scheme.id, byDate);
  }

  const sortedDates = Array.from(allDates).sort();

  return sortedDates.map((date) => {
    const row: Record<string, number | string | null> = { date };
    for (const scheme of schemes) {
      const v = seriesMaps.get(scheme.id)?.get(date);
      row[scheme.id] = typeof v === "number" ? v : null;
    }
    return row;
  });
}

const NavTooltip = ({ active, payload, label, t }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg p-3 border border-border bg-card">
      <p className="text-sm font-semibold text-foreground mb-2">{t ? t("Date:") : "Date:"} {label}</p>
      {payload
        .filter((p: any) => p.value !== null && p.value !== undefined)
        .map((p: any) => (
          <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
            {String(p.name)}: {formatNav(p.value)}
          </p>
        ))}
    </div>
  );
};

export function NpsSchemesTab() {
  const { t } = useI18n();

  const [data, setData] = React.useState<NavDataResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [prediction, setPrediction] = React.useState<{ growth: string; explanation: string } | null>(null);
  const [predicting, setPredicting] = React.useState(false);

  const [singlePfm, setSinglePfm] = React.useState<string>("");
  const [singleSchemeId, setSingleSchemeId] = React.useState<string>("");
  const [singleRange, setSingleRange] = React.useState<TimeRange>("12m");

  const [leftId, setLeftId] = React.useState<string>("");
  const [rightId, setRightId] = React.useState<string>("");
  const [compareRange, setCompareRange] = React.useState<TimeRange>("12m");

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/nps/nav-data");
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = (await res.json()) as NavDataResponse;
        if (cancelled) return;
        setData(json);

        const ids = json.schemes.map((s) => s.id);
        const pfms = Array.from(new Set(ids.map((id) => parseSchemeId(id).pfm))).sort();
        const defaultPfm = pfms[0] || "";
        setSinglePfm((prev) => prev || defaultPfm);

        const defaultScheme = json.schemes.find((s) => parseSchemeId(s.id).pfm === defaultPfm)?.id || ids[0] || "";
        setSingleSchemeId((prev) => prev || defaultScheme);

        setLeftId((prev) => prev || ids[0] || "");
        setRightId((prev) => prev || ids[1] || ids[0] || "");
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || t("Failed to load NPS NAV data"));
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const schemes = data?.schemes ?? [];

  const pfmOptions = React.useMemo(() => {
    return Array.from(new Set(schemes.map((s) => parseSchemeId(s.id).pfm))).sort();
  }, [schemes]);

  const schemesForSelectedPfm = React.useMemo(() => {
    return schemes
      .filter((s) => parseSchemeId(s.id).pfm === singlePfm)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [schemes, singlePfm]);

  React.useEffect(() => {
    if (!singlePfm) return;
    if (schemesForSelectedPfm.some((s) => s.id === singleSchemeId)) return;
    setSingleSchemeId(schemesForSelectedPfm[0]?.id || "");
  }, [singlePfm, schemesForSelectedPfm, singleSchemeId]);

  const idToLabel = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of schemes) m.set(s.id, s.label);
    return m;
  }, [schemes]);

  const singleSeries = React.useMemo(() => {
    return schemes.find((s) => s.id === singleSchemeId) || null;
  }, [schemes, singleSchemeId]);

  const singlePoints = React.useMemo(() => {
    const pts = singleSeries?.points ?? [];
    return filterPointsByRange(pts, singleRange);
  }, [singleSeries, singleRange]);

  const singleChartData = React.useMemo(() => {
    return singlePoints.map((p) => ({ date: p.date, nav: p.nav }));
  }, [singlePoints]);

  const singleDomain = React.useMemo(() => {
    return computeDomainFromValues(singlePoints.map((p) => p.nav));
  }, [singlePoints]);

  const compareIds = React.useMemo(() => {
    const a = leftId;
    const b = rightId;
    return { a, b };
  }, [leftId, rightId]);

  const compareSeriesA = React.useMemo(() => schemes.find((s) => s.id === compareIds.a) || null, [schemes, compareIds.a]);
  const compareSeriesB = React.useMemo(() => schemes.find((s) => s.id === compareIds.b) || null, [schemes, compareIds.b]);

  const comparePointsA = React.useMemo(() => {
    const pts = compareSeriesA?.points ?? [];
    return filterPointsByRange(pts, compareRange);
  }, [compareSeriesA, compareRange]);
  const comparePointsB = React.useMemo(() => {
    const pts = compareSeriesB?.points ?? [];
    return filterPointsByRange(pts, compareRange);
  }, [compareSeriesB, compareRange]);

  const compareChartData = React.useMemo(() => {
    if (!compareSeriesA || !compareSeriesB) return [];
    return mergeSchemesToChartData([
      { ...compareSeriesA, points: comparePointsA },
      { ...compareSeriesB, points: comparePointsB },
    ]);
  }, [compareSeriesA, compareSeriesB, comparePointsA, comparePointsB]);

  const compareDomain = React.useMemo(() => {
    return computeDomainFromValues([...comparePointsA.map((p) => p.nav), ...comparePointsB.map((p) => p.nav)]);
  }, [comparePointsA, comparePointsB]);

  const handleGeminiPrediction = async () => {
    if (!singleSeries || singleSeries.points.length === 0) {
      toast.error("No data available for prediction");
      return;
    }

    setPredicting(true);
    setPrediction(null);

    try {
      // Prepare data for Gemini
      const navData = singleSeries.points.map(point => ({
        date: point.date,
        nav: point.nav
      }));

      const prompt = `
        Analyze the following NPS NAV data for ${singleSeries.label} and predict the percentage growth for the next 5 years.
        
        NAV Data:
        ${navData.map(d => `${d.date}: ${d.nav}`).join('\n')}
        
        Based on this historical data:
        1. Calculate the overall trend and growth pattern
        2. Consider any seasonal patterns or volatility
        3. Predict the expected percentage growth over the next 5 years
        4. Provide a brief explanation of your reasoning
        
        Please respond in this exact format:
        GROWTH: [percentage]%
        EXPLANATION: [your explanation]
      `;

      const response = await fetch('/api/gemini/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const result = await response.json();
      
      // Parse the response
      const growthMatch = result.response.match(/GROWTH:\s*([0-9.]+)%/i);
      const explanationMatch = result.response.match(/EXPLANATION:\s*(.+)/i);
      
      if (growthMatch && explanationMatch) {
        setPrediction({
          growth: growthMatch[1],
          explanation: explanationMatch[1]
        });
        toast.success("Prediction generated successfully!");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error("Failed to generate prediction. Please try again.");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border rounded-lg shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{t("NPS NAV")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("Select a fund and scheme to view NAV history.")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">{t("Loading...")}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error && schemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("No scheme data found.")}</p>
          ) : null}

          {schemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("Fund")}</p>
                <Select value={singlePfm} onValueChange={setSinglePfm}>
                  <SelectTrigger className="border border-border bg-card">
                    <SelectValue placeholder={t("Select fund")} />
                  </SelectTrigger>
                  <SelectContent>
                    {pfmOptions.map((pfm) => (
                      <SelectItem key={pfm} value={pfm}>
                        {pfm.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("Scheme")}</p>
                <Select value={singleSchemeId} onValueChange={setSingleSchemeId}>
                  <SelectTrigger className="border border-border bg-card">
                    <SelectValue placeholder={t("Select scheme")} />
                  </SelectTrigger>
                  <SelectContent>
                    {schemesForSelectedPfm.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("Range")}</p>
                <Select value={singleRange} onValueChange={(v) => setSingleRange(v as TimeRange)}>
                  <SelectTrigger className="border border-border bg-card">
                    <SelectValue placeholder={t("Select range")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All")}</SelectItem>
                    <SelectItem value="12m">{t("12 months")}</SelectItem>
                    <SelectItem value="6m">{t("6 months")}</SelectItem>
                    <SelectItem value="1m">{t("1 month")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {singleSeries && singleChartData.length > 0 ? (
            <div className="h-[22rem] md:h-[28rem]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={singleChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v) => formatNav(v)}
                    width={64}
                    domain={singleDomain as any}
                    tickCount={6}
                  />
                  <Tooltip content={<NavTooltip t={t} />} />
                  <Legend formatter={() => <span className="text-sm text-foreground">{singleSeries.label}</span>} />

                  <Line
                    type="linear"
                    dataKey="nav"
                    name={singleSeries.label}
                    stroke={COLORS[0]}
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {/* Gemini Prediction Section */}
          {singleSeries && singleChartData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  AI Prediction for {singleSeries.label}
                </div>
                <Button
                  onClick={handleGeminiPrediction}
                  disabled={predicting}
                  className="px-4 py-2 text-sm"
                >
                  {predicting ? "Predicting..." : "Predict for next 5 years"}
                </Button>
              </div>

              {prediction && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-blue-900">
                          Predicted Growth: {prediction.growth}%
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {prediction.explanation}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        *This prediction is based on historical data analysis and should not be considered as financial advice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border rounded-lg shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{t("Compare two schemes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("Scheme A")}</p>
              <Select value={leftId} onValueChange={setLeftId}>
                <SelectTrigger className="border border-border bg-card">
                  <SelectValue placeholder={t("Select scheme")} />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("Scheme B")}</p>
              <Select value={rightId} onValueChange={setRightId}>
                <SelectTrigger className="border border-border bg-card">
                  <SelectValue placeholder={t("Select scheme")} />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("Range")}</p>
              <Select value={compareRange} onValueChange={(v) => setCompareRange(v as TimeRange)}>
                <SelectTrigger className="border border-border bg-card">
                  <SelectValue placeholder={t("Select range")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All")}</SelectItem>
                  <SelectItem value="12m">{t("12 months")}</SelectItem>
                  <SelectItem value="6m">{t("6 months")}</SelectItem>
                  <SelectItem value="1m">{t("1 month")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {compareIds.a && compareIds.b ? (
            <div className="h-[22rem] md:h-[28rem]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v) => formatNav(v)}
                    width={64}
                    domain={compareDomain as any}
                    tickCount={6}
                  />
                  <Tooltip content={<NavTooltip t={t} />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{idToLabel.get(String(value)) || String(value)}</span>
                    )}
                  />

                  <Line
                    type="linear"
                    dataKey={compareIds.a}
                    name={idToLabel.get(compareIds.a) || compareIds.a}
                    stroke={COLORS[0]}
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey={compareIds.b}
                    name={idToLabel.get(compareIds.b) || compareIds.b}
                    stroke={COLORS[2]}
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Select two schemes to compare.")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
