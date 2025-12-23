import * as React from "react";
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const NavTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg p-3 border border-border bg-card">
      <p className="text-sm font-semibold text-foreground mb-2">Date: {label}</p>
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
  const [data, setData] = React.useState<NavDataResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [leftId, setLeftId] = React.useState<string>("");
  const [rightId, setRightId] = React.useState<string>("");

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
        setLeftId((prev) => prev || ids[0] || "");
        setRightId((prev) => prev || ids[1] || ids[0] || "");
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load NPS NAV data");
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
  const chartData = React.useMemo(() => mergeSchemesToChartData(schemes), [schemes]);
  const idToLabel = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of schemes) m.set(s.id, s.label);
    return m;
  }, [schemes]);

  const compareIds = React.useMemo(() => {
    const a = leftId;
    const b = rightId;
    return { a, b };
  }, [leftId, rightId]);

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">NPS NAV (Last 12 months)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Multi-scheme NAV history from your uploaded NPS NAV files.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error && schemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheme data found.</p>
          ) : null}

          {schemes.length > 0 ? (
            <div className="h-[22rem] md:h-[28rem]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v) => formatNav(v)}
                    width={64}
                  />
                  <Tooltip content={<NavTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{idToLabel.get(String(value)) || String(value)}</span>
                    )}
                  />

                  {schemes.map((s, idx) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      name={s.label}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls
                      isAnimationActive
                      animationDuration={800}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Compare two schemes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Scheme A</p>
              <Select value={leftId} onValueChange={setLeftId}>
                <SelectTrigger className="border border-border bg-card">
                  <SelectValue placeholder="Select scheme" />
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
              <p className="text-xs text-muted-foreground">Scheme B</p>
              <Select value={rightId} onValueChange={setRightId}>
                <SelectTrigger className="border border-border bg-card">
                  <SelectValue placeholder="Select scheme" />
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
          </div>

          {compareIds.a && compareIds.b ? (
            <div className="h-[22rem] md:h-[28rem]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v) => formatNav(v)}
                    width={64}
                  />
                  <Tooltip content={<NavTooltip />} />
                  <Legend formatter={(value) => <span className="text-sm text-foreground">{String(value)}</span>} />

                  <Line
                    type="monotone"
                    dataKey={compareIds.a}
                    name={idToLabel.get(compareIds.a) || compareIds.a}
                    stroke={COLORS[0]}
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                    isAnimationActive
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey={compareIds.b}
                    name={idToLabel.get(compareIds.b) || compareIds.b}
                    stroke={COLORS[2]}
                    strokeWidth={3}
                    dot={false}
                    connectNulls
                    isAnimationActive
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select two schemes to compare.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
