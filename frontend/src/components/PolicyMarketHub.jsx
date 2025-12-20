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

function deriveInsightFromItems(items = []) {
  const item = items[0];
  if (!item) return null;

  const title = String(item.title || "");
  const summary = String(item.summary || "");
  const text = `${title} ${summary}`.toLowerCase();

  let message = "Policy update detected. Review impact on post-tax returns.";
  if (/(ltcg|stcg|capital gains|tds|surcharge|deduction|section 80|80c|80ccd)/i.test(text)) {
    message = "Based on recent tax policy updates, post-tax equity returns may change. Review your SIP assumptions.";
  } else if (/(repo|bank rate|interest rate|deposit rate|fd rate|fixed deposit)/i.test(text)) {
    message = "Based on recent interest-rate updates, FD/RD returns may shift. Recheck your fixed-income assumptions.";
  } else if (/(pension|nps|epf|gratuity)/i.test(text)) {
    message = "Based on recent pension/retirement updates, review NPS/EPF assumptions and contribution strategy.";
  }

  return {
    message,
    title,
    feedTitle: item.feedTitle,
    publishedAt: item.publishedAt,
    link: item.link,
    createdAt: new Date().toISOString(),
  };
}

export function PolicyMarketHub({
  mode = "product",
  defaultTab = "feeds",
  visibleTabs = ["feeds", "curves", "alerts", "insurance", "education"],
  hideHeader = false,
  autoRefreshOnMount,
} = {}) {
  const isProduct = mode === "product";
  const isLocalOnly = isProduct;
  const shouldAutoRefresh = typeof autoRefreshOnMount === "boolean" ? autoRefreshOnMount : isProduct;

  const [tabValue, setTabValue] = useState(defaultTab);
  const [feeds, setFeeds] = useLocalStorageState("pmh.feeds", defaultFeeds);
  const [alertsEnabled, setAlertsEnabled] = useLocalStorageState("pmh.alertsEnabled", true);
  const [keywordQuery, setKeywordQuery] = useLocalStorageState("pmh.keywords", "ltcg, epf, nps, rd, fd, sip");
  const [notifyInApp, setNotifyInApp] = useLocalStorageState("pmh.notifyInApp", true);
  const [webhookUrl, setWebhookUrl] = useLocalStorageState("pmh.webhookUrl", "");
  const [proxyMode, setProxyMode] = useLocalStorageState("pmh.proxyMode", "none");
  const [pollSeconds, setPollSeconds] = useLocalStorageState("pmh.pollSeconds", 0);
  const [marketRiskEnabled, setMarketRiskEnabled] = useLocalStorageState("pmh.marketRiskEnabled", true);

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
    age: 28,
    goalAge: 60,
    monthlyInvestment: 10000,
    expectedReturn: 12,
    inflation: 6,
  });

  useEffect(() => {
    if (!isProduct) return;
    const hasAnyUrl = Array.isArray(feeds) && feeds.some((f) => typeof f?.url === "string" && f.url.trim().length > 0);
    if (!hasAnyUrl) {
      setFeeds(defaultFeeds);
    }
  }, [feeds, isProduct, setFeeds]);

  const localPlaceholderItems = useMemo(() => {
    return [
      {
        id: "local-1",
        feedId: "local",
        feedTitle: "Local placeholder",
        title: "(Placeholder) Budget policy update detected: review LTCG assumptions",
        publishedAt: new Date().toISOString().slice(0, 10),
        summary: "Local-only mode: no external fetching. Replace sources later when you approve.",
      },
      {
        id: "local-2",
        feedId: "local",
        feedTitle: "Local placeholder",
        title: "(Placeholder) Interest-rate environment shift may impact FD/RD returns",
        publishedAt: new Date().toISOString().slice(0, 10),
        summary: "Local-only mode: these are demo items, not scraped from the web.",
      },
    ];
  }, []);

  useEffect(() => {
    setTabValue(defaultTab);
  }, [defaultTab]);

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
    if (isLocalOnly) {
      setFeedErrors({});
      setFeedItems(localPlaceholderItems);
      lastRefreshAtRef.current = new Date().toISOString();
      try {
        const insight = deriveInsightFromItems(localPlaceholderItems);
        if (insight) {
          window.localStorage.setItem("pmh.latestInsight", JSON.stringify(insight));
        }
      } catch {
        // ignore
      }
      toast.message("Local-only mode", { description: "External sources are disabled. Showing placeholder updates." });
      return;
    }

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
        return Array.from(map.values()).sort((a, b) =>
          String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")),
        );
      });

      lastRefreshAtRef.current = new Date().toISOString();

      const seen = new Set(seenItemIds);
      const freshMatching = nextItems.filter((i) => !seen.has(`${i.feedId}:${i.id}`) && isMatch(i));

      try {
        const insight = deriveInsightFromItems(freshMatching.length > 0 ? freshMatching : nextItems);
        if (insight) {
          window.localStorage.setItem("pmh.latestInsight", JSON.stringify(insight));
        }
      } catch {
        // ignore
      }

      if (freshMatching.length > 0) {
        const toAdd = freshMatching.map((i) => `${i.feedId}:${i.id}`);
        setSeenItemIds((prev) => Array.from(new Set([...prev, ...toAdd])));

        if (notifyInApp) {
          toast.success("Policy alert", {
            description: `${freshMatching.length} new matching item(s) detected.`,
          });
        }

        if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.trim().length > 0) {
          toast.message("Webhook disabled", { description: "Local-only mode: outgoing requests are disabled." });
        }
      }

      toast.success("Feeds refreshed", {
        description: `Loaded ${nextItems.length} item(s).`,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [feeds, isLocalOnly, isMatch, localPlaceholderItems, notifyInApp, proxyMode, seenItemIds, setSeenItemIds, webhookUrl]);

  useEffect(() => {
    if (!shouldAutoRefresh) return;
    refreshFeeds();
  }, [refreshFeeds, shouldAutoRefresh]);

  useEffect(() => {
    const s = Number(pollSeconds);
    if (!Number.isFinite(s) || s <= 0) return;
    const id = window.setInterval(() => {
      refreshFeeds();
    }, s * 1000);

    return () => window.clearInterval(id);
  }, [pollSeconds, refreshFeeds]);

  return (
    <Card className="glass">
      {!hideHeader ? (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Policy & Market Hub</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time feeds, policy-aware insights, and cross-instrument comparisons.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="bg-card" onClick={refreshFeeds} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
      ) : null}

      <CardContent>
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="flex w-full flex-wrap items-center justify-start gap-1 glass p-1">
            {visibleTabs.includes("feeds") ? (
              <TabsTrigger value="feeds" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Policy & News
              </TabsTrigger>
            ) : null}
            {visibleTabs.includes("curves") ? (
              <TabsTrigger value="curves" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Growth Curves
              </TabsTrigger>
            ) : null}
            {visibleTabs.includes("alerts") ? (
              <TabsTrigger value="alerts" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-200">
                Alerts
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

          <TabsContent value="feeds" className="mt-4">
            {isProduct ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <div className="glass-strong rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Highlights</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-card border-primary/30">
                          {matchingItems.length}
                        </Badge>
                        <Badge variant="secondary" className="bg-secondary border-primary/20">
                          Updated: {formatDateMaybe(lastRefreshAtRef.current)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {matchingItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No relevant policy signals detected yet.</p>
                      ) : (
                        matchingItems.slice(0, 10).map((item) => (
                          <div key={`${item.feedId}:${item.id}`} className="glass rounded-2xl p-4 hover:border-primary/40 transition-all duration-200">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.feedTitle} • {formatDateMaybe(item.publishedAt)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="bg-card"
                                onClick={() => toast.message("Links disabled", { description: "Local-only mode: external links are disabled." })}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="glass-strong rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Latest updates</p>
                      <Badge variant="outline" className="bg-card border-primary/30">
                        {feedItems.length}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {feedItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Refresh to load updates.</p>
                      ) : (
                        feedItems.slice(0, 8).map((item) => (
                          <div key={`${item.feedId}:${item.id}:latest`} className="glass rounded-2xl p-4 hover:border-primary/40 transition-all duration-200">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.feedTitle} • {formatDateMaybe(item.publishedAt)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="bg-card"
                                onClick={() => toast.message("Links disabled", { description: "Local-only mode: external links are disabled." })}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl p-5 bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Monitoring</p>
                      <Badge variant="outline" className="bg-card">{feeds.length}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {feeds.map((f) => (
                        <div key={f.id} className="rounded-2xl p-4 bg-secondary">
                          <p className="text-sm font-medium text-foreground">{f.title}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(f.tags || []).map((t) => (
                              <Badge key={t} variant="secondary" className="bg-secondary">
                                {t}
                              </Badge>
                            ))}
                            {feedErrors[f.id] ? (
                              <Badge variant="secondary" className="bg-destructive text-destructive-foreground">
                                {feedErrors[f.id]}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
            ) : (
              <div className="text-sm text-muted-foreground">Local-only mode: feed management UI is disabled in this build.</div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-4">
                <div className="glass rounded-2xl p-5">
                  <p className="text-sm font-semibold text-foreground">In-app alerts</p>
                  <p className="mt-1 text-sm text-muted-foreground">Alerts appear as notification popups when new matching items are detected.</p>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} className="data-[state=checked]:bg-accent" />
                        <p className="text-sm text-foreground">Keyword alerts</p>
                      </div>
                      <Badge variant="secondary" className="bg-secondary">
                        {alertsEnabled ? "On" : "Off"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={notifyInApp} onCheckedChange={setNotifyInApp} className="data-[state=checked]:bg-accent" />
                        <p className="text-sm text-foreground">Popup notifications</p>
                      </div>
                      <Badge variant="secondary" className="bg-secondary">
                        {notifyInApp ? "Enabled" : "Muted"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={marketRiskEnabled} onCheckedChange={setMarketRiskEnabled} className="data-[state=checked]:bg-accent" />
                        <p className="text-sm text-foreground">Market risk indicators</p>
                      </div>
                      <Badge variant="secondary" className="bg-secondary">
                        {marketRiskEnabled ? "On" : "Off"}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Keywords (comma/newline separated)</Label>
                    <Textarea value={keywordQuery} onChange={(e) => setKeywordQuery(e.target.value)} className="bg-secondary" />
                  </div>
                </div>

                <div className="glass rounded-2xl p-5">
                  <p className="text-sm font-semibold text-foreground">Webhook alerts</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Provide a webhook endpoint to receive POST events. Note: browser CORS rules may require a backend relay.
                  </p>

                  <div className="mt-4 space-y-2">
                    <Label className="text-xs text-muted-foreground">Webhook URL (optional)</Label>
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="bg-secondary"
                      placeholder="(disabled in local-only mode)"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="glass rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">Events sent</p>
                      <p className="mt-2 text-sm text-muted-foreground">policy_alert (new feed items matching keywords)</p>
                      <p className="mt-1 text-sm text-muted-foreground">policy_change (reserved)</p>
                      <p className="mt-1 text-sm text-muted-foreground">market_risk (reserved)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="glass rounded-2xl p-5">
                  <p className="text-sm font-semibold text-foreground">Refresh cadence</p>
                  <p className="mt-1 text-sm text-muted-foreground">Optional auto-refresh. Keep it off unless you need background monitoring.</p>

                  <div className="mt-4 space-y-2">
                    <Label className="text-xs text-muted-foreground">Poll (seconds)</Label>
                    <Input
                      value={pollSeconds}
                      onChange={(e) => setPollSeconds(clampNumber(e.target.value, 0, 3600, 0))}
                      className="bg-secondary"
                      placeholder="0 = off"
                    />
                  </div>

                  {!isProduct ? (
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs text-muted-foreground">RSS proxy</Label>
                      <Select value={proxyMode} onValueChange={setProxyMode}>
                        <SelectTrigger className="bg-secondary">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Direct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <Button variant="outline" className="mt-4 w-full bg-card" onClick={() => setSeenItemIds([])}>
                    Reset seen items
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

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
                    <p className="text-sm font-semibold text-foreground">Policies affecting SIP, RD, FD, and hybrids</p>
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

                  <p className="text-sm font-semibold text-foreground">Paste policy doc (optional)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If you have the Google Docs policy list, paste the raw text here. Next step can be a backend/LLM pipeline
                    to extract trends and map them to instruments.
                  </p>
                  <Textarea
                    className="mt-3 bg-secondary"
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

                  <Button variant="outline" className="bg-card" onClick={() => toast.message("Next: connect real policy parser + shock model")}> 
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