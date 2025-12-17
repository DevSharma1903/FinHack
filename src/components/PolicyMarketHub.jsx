import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { defaultFeeds, policyLibrarySeed } from "@/lib/policyMarketData";
import { fetchAndParseFeed } from "@/lib/rss";
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

function formatDateMaybe(value) {
  if (!value) return "-";
  return value;
}

export function PolicyMarketHub() {
  const [feeds, setFeeds] = useLocalStorageState("pmh.feeds", defaultFeeds);
  const [alertsEnabled, setAlertsEnabled] = useLocalStorageState("pmh.alertsEnabled", true);
  const [keywordQuery, setKeywordQuery] = useLocalStorageState("pmh.keywords", "ltcg, epf, nps, rd, fd, sip");
  const [notifyInApp, setNotifyInApp] = useLocalStorageState("pmh.notifyInApp", true);
  const [webhookUrl, setWebhookUrl] = useLocalStorageState("pmh.webhookUrl", "");
  const [proxyMode, setProxyMode] = useLocalStorageState("pmh.proxyMode", "none");
  const [pollSeconds, setPollSeconds] = useLocalStorageState("pmh.pollSeconds", 0);

  const [newFeedTitle, setNewFeedTitle] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");

  const [feedItems, setFeedItems] = useState([]);
  const [feedErrors, setFeedErrors] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshAtRef = useRef(null);

  const [seenItemIds, setSeenItemIds] = useLocalStorageState("pmh.seenItemIds", []);
  const [policyDocText, setPolicyDocText] = useLocalStorageState("pmh.policyDocText", "");

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
    monthlyInvestment: 10000,
    expectedReturn: 12,
    inflation: 6,
  });

  const keywords = useMemo(() => {
    return String(keywordQuery)
      .split(/[\,\n]/g)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [keywordQuery]);

  const isMatch = useCallback(
    (item) => {
      if (!alertsEnabled || keywords.length === 0) return false;
      const haystack = `${item.title || ""} ${item.summary || ""} ${item.feedTitle || ""}`.toLowerCase();
      return keywords.some((k) => haystack.includes(k));
    },
    [alertsEnabled, keywords],
  );

  const matchingItems = useMemo(() => {
    return feedItems.filter((item) => isMatch(item));
  }, [feedItems, isMatch]);

  const curveResults = useMemo(() => {
    const years = clampNumber(curveInputs.years, 1, 60, 20);
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
  }, [curveInputs]);

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

  const addFeed = () => {
    const title = newFeedTitle.trim();
    const url = newFeedUrl.trim();
    if (!title || !url) {
      toast.error("Please provide both a title and a URL.");
      return;
    }

    setFeeds((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        title,
        url,
        tags: [],
      },
    ]);
    setNewFeedTitle("");
    setNewFeedUrl("");
    toast.success("Feed added");
  };

  const updateFeed = (id, patch) => {
    setFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeFeed = (id) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    setFeedItems((prev) => prev.filter((i) => i.feedId !== id));
    setFeedErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const refreshFeeds = useCallback(async () => {
    const usableFeeds = feeds.filter((f) => typeof f.url === "string" && f.url.trim().length > 0);
    if (usableFeeds.length === 0) {
      toast.error("Add at least one feed URL to refresh.");
      return;
    }

    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled(
        usableFeeds.map((feed) => fetchAndParseFeed(feed, { proxy: proxyMode })),
      );

      const nextErrors = {};
      const nextItems = [];

      results.forEach((res, idx) => {
        const feed = usableFeeds[idx];
        if (res.status === "fulfilled") {
          nextItems.push(...res.value);
        } else {
          nextErrors[feed.id] = res.reason?.message || "Failed to load";
        }
      });

      setFeedErrors(nextErrors);
      setFeedItems((prev) => {
        const map = new Map();
        prev.forEach((i) => map.set(`${i.feedId}:${i.id}`, i));
        nextItems.forEach((i) => map.set(`${i.feedId}:${i.id}`, i));
        return Array.from(map.values()).sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
      });

      lastRefreshAtRef.current = new Date().toISOString();

      const seen = new Set(seenItemIds);
      const freshMatching = nextItems.filter((i) => !seen.has(`${i.feedId}:${i.id}`) && isMatch(i));

      if (freshMatching.length > 0) {
        const toAdd = freshMatching.map((i) => `${i.feedId}:${i.id}`);
        setSeenItemIds((prev) => Array.from(new Set([...prev, ...toAdd])));

        if (notifyInApp) {
          toast.success("Policy alert", {
            description: `${freshMatching.length} new matching item(s) detected.`,
          });
        }

        if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.trim().length > 0) {
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "policy_alert", items: freshMatching.slice(0, 20) }),
            });
          } catch {
            toast.message("Webhook failed", { description: "The webhook POST request failed (check CORS/back-end)." });
          }
        }
      }

      toast.success("Feeds refreshed", {
        description: `Loaded ${nextItems.length} item(s).`,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [feeds, isMatch, notifyInApp, proxyMode, seenItemIds, setSeenItemIds, webhookUrl]);

  useEffect(() => {
    const s = Number(pollSeconds);
    if (!Number.isFinite(s) || s <= 0) return;
    const id = window.setInterval(() => {
      refreshFeeds();
    }, s * 1000);

    return () => window.clearInterval(id);
  }, [pollSeconds, refreshFeeds]);

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Policy, Feeds & Advanced Scenarios</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              RSS feeds, keyword alerts, SIP vs RD vs FD curves, and a policy/education library.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-card/40" onClick={refreshFeeds} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh feeds"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="feeds">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-secondary/50">
            <TabsTrigger value="feeds" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Feeds & Alerts
            </TabsTrigger>
            <TabsTrigger value="curves" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Growth Curves
            </TabsTrigger>
            <TabsTrigger value="insurance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Insurance
            </TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Policy Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feeds" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-4">
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Feeds</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-card/40">
                        {feeds.length}
                      </Badge>
                      <Badge variant="secondary" className="bg-secondary/60">
                        Last refresh: {formatDateMaybe(lastRefreshAtRef.current)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feed</TableHead>
                          <TableHead className="hidden md:table-cell">URL</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeds.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">{f.title}</p>
                                <div className="flex flex-wrap gap-1">
                                  {(f.tags || []).map((t) => (
                                    <Badge key={t} variant="secondary" className="bg-secondary/60">
                                      {t}
                                    </Badge>
                                  ))}
                                  {feedErrors[f.id] ? (
                                    <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                                      {feedErrors[f.id]}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Input
                                value={f.url}
                                onChange={(e) => updateFeed(f.id, { url: e.target.value })}
                                className="bg-secondary/30"
                                placeholder="https://.../feed.xml"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" className="bg-card/40" onClick={() => removeFeed(f.id)}>
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Matches</p>
                    <Badge variant="outline" className="bg-card/40">
                      {matchingItems.length}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {matchingItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No matching items yet. Refresh feeds to load data.</p>
                    ) : (
                      matchingItems.slice(0, 10).map((item) => (
                        <div key={`${item.feedId}:${item.id}`} className="glass rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.feedTitle} • {formatDateMaybe(item.publishedAt)}
                              </p>
                            </div>
                            {item.link ? (
                              <Button
                                variant="outline"
                                className="bg-card/40"
                                onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
                              >
                                Open
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="glass rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Add feed</p>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input value={newFeedTitle} onChange={(e) => setNewFeedTitle(e.target.value)} placeholder="e.g., CBDT notifications" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">RSS/Atom URL</Label>
                    <Input value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} placeholder="https://.../feed.xml" />
                  </div>
                  <Button className="w-full" onClick={addFeed}>
                    Add
                  </Button>
                </div>

                <div className="glass rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Alert settings</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} className="data-[state=checked]:bg-accent" />
                      <p className="text-xs text-muted-foreground">Enable keyword alerts</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={notifyInApp} onCheckedChange={setNotifyInApp} className="data-[state=checked]:bg-accent" />
                      <p className="text-xs text-muted-foreground">Notify</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Keywords (comma/newline separated)</Label>
                    <Textarea value={keywordQuery} onChange={(e) => setKeywordQuery(e.target.value)} className="bg-secondary/30" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Webhook URL (optional)</Label>
                    <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="bg-secondary/30" placeholder="https://your-server/webhook" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">RSS proxy</Label>
                      <Select value={proxyMode} onValueChange={setProxyMode}>
                        <SelectTrigger className="bg-secondary/40">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Direct</SelectItem>
                          <SelectItem value="allorigins">AllOrigins (CORS workaround)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Poll (seconds)</Label>
                      <Input
                        value={pollSeconds}
                        onChange={(e) => setPollSeconds(clampNumber(e.target.value, 0, 3600, 0))}
                        className="bg-secondary/30"
                        placeholder="0 = off"
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="bg-card/40" onClick={() => setSeenItemIds([])}>
                    Reset seen items
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curves" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="glass rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Curve inputs</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Years</Label>
                      <Input value={curveInputs.years} onChange={(e) => setCurveInputs((p) => ({ ...p, years: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Monthly investment</Label>
                      <Input value={curveInputs.monthlyInvestment} onChange={(e) => setCurveInputs((p) => ({ ...p, monthlyInvestment: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Expected return (p.a.)</Label>
                      <Input value={curveInputs.expectedReturn} onChange={(e) => setCurveInputs((p) => ({ ...p, expectedReturn: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Inflation</Label>
                      <Input value={curveInputs.inflation} onChange={(e) => setCurveInputs((p) => ({ ...p, inflation: e.target.value }))} className="bg-secondary/30" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    <div className="glass rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground">SIP corpus</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{formatCurrency(curveResults.sip.totalCorpus)}</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground">RD corpus</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{formatCurrency(curveResults.rd.totalCorpus)}</p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground">FD corpus</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{formatCurrency(curveResults.fd.totalCorpus)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">SIP vs RD vs FD</p>
                    <Badge variant="secondary" className="bg-secondary/60">calculated</Badge>
                  </div>

                  <div className="mt-4 h-[22rem] md:h-[28rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curveResults.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sipGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.15} />
                          </linearGradient>
                          <linearGradient id="rdGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.15} />
                          </linearGradient>
                          <linearGradient id="fdGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.15} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            return (
                              <div className="glass rounded-lg p-3 border border-border">
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

                        <Area type="monotone" dataKey="sip" name="SIP" stroke="hsl(217, 91%, 60%)" fill="url(#sipGradient)" strokeWidth={2} dot={false} isAnimationActive animationDuration={1200} />
                        <Area type="monotone" dataKey="rd" name="RD" stroke="hsl(160, 84%, 39%)" fill="url(#rdGradient)" strokeWidth={2} dot={false} isAnimationActive animationDuration={1300} />
                        <Area type="monotone" dataKey="fd" name="FD" stroke="hsl(280, 70%, 60%)" fill="url(#fdGradient)" strokeWidth={2} dot={false} isAnimationActive animationDuration={1400} />
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
                      <Input value={insuranceInputs.age} onChange={(e) => setInsuranceInputs((p) => ({ ...p, age: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Dependents</Label>
                      <Input value={insuranceInputs.dependents} onChange={(e) => setInsuranceInputs((p) => ({ ...p, dependents: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Annual income</Label>
                      <Input value={insuranceInputs.annualIncome} onChange={(e) => setInsuranceInputs((p) => ({ ...p, annualIncome: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Annual expenses</Label>
                      <Input value={insuranceInputs.annualExpenses} onChange={(e) => setInsuranceInputs((p) => ({ ...p, annualExpenses: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Liabilities</Label>
                      <Input value={insuranceInputs.liabilities} onChange={(e) => setInsuranceInputs((p) => ({ ...p, liabilities: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Existing cover</Label>
                      <Input value={insuranceInputs.currentCover} onChange={(e) => setInsuranceInputs((p) => ({ ...p, currentCover: e.target.value }))} className="bg-secondary/30" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs text-muted-foreground">Income replacement years</Label>
                      <Input value={insuranceInputs.goalYears} onChange={(e) => setInsuranceInputs((p) => ({ ...p, goalYears: e.target.value }))} className="bg-secondary/30" />
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
                    <p className="text-sm font-semibold text-foreground">Policies affecting SIP, RD, FD, and hybrids</p>
                    <Badge variant="secondary" className="bg-secondary/60">library</Badge>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
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
                              <Badge variant="secondary" className="bg-secondary/60">{p.category}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.note}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator className="my-4" />

                  <p className="text-sm font-semibold text-foreground">Paste policy doc (optional)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If you have the Google Docs policy list, paste the raw text here. Next step can be a backend/LLM pipeline
                    to extract trends and map them to instruments.
                  </p>
                  <Textarea
                    className="mt-3 bg-secondary/30"
                    placeholder="Paste policy list text here..."
                    value={policyDocText}
                    onChange={(e) => setPolicyDocText(e.target.value)}
                  />
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="glass rounded-2xl p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Education layer</p>
                  <p className="text-sm text-muted-foreground">
                    This is kept intentionally concise. The innovative part is the RSS-to-alert pipeline + growth curve comparison.
                  </p>

                  <div className="space-y-3">
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">Tax impacts</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        When a feed item matches “LTCG / TDS / surcharge”, you can treat it as a potential drag on post-tax returns.
                      </p>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">What this app will do next</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Attach policy events to parameter changes (tax rate, expected return, inflation) and re-run scenarios.
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="bg-card/40" onClick={() => toast.message("Next: connect real policy parser + shock model")}> 
                    Roadmap
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
