import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const formatCurrency = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";

  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toFixed(2)}%`;
};

function StatItem({ label, value, hint }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {hint ? (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{hint}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function DetailedStats({ results }) {
  if (!results) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <StatItem label="Assumed return" value={typeof results.expectedReturn === "number" ? `${results.expectedReturn}%` : "-"} />
      <StatItem label="Assumed inflation" value={typeof results.inflation === "number" ? `${results.inflation}%` : "-"} />
      <StatItem
        label="Real return assumption"
        value={formatPercent(results.realReturnAssumptionPercent)}
        hint="Return assumption after inflation (Fisher approximation)."
      />

      <StatItem label="Years to retirement" value={`${results.years ?? "-"}`} />
      <StatItem label="Total contributions" value={formatCurrency(results.totalInvested)} />
      <StatItem label="Wealth multiplier" value={results.wealthMultiplier ? `${results.wealthMultiplier.toFixed(2)}x` : "-"} />

      <StatItem label="Nominal IRR (annual)" value={formatPercent(results.irrAnnualPercent)} hint="Estimated internal rate of return based on cashflows." />
      <StatItem label="Real IRR (annual)" value={formatPercent(results.realIrrAnnualPercent)} hint="Nominal IRR adjusted for inflation." />
      <StatItem label="Inflation-adjusted corpus" value={formatCurrency(results.inflationAdjusted)} />
    </div>
  );
}
