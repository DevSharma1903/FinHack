import { TrendingUp, Wallet, PiggyBank, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/i18n";

const formatCurrency = (value) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export function ResultCards({ results, isComparison = false }) {
  const { t } = useI18n();

  const returnPct = typeof results.returnPercentage === "number" && Number.isFinite(results.returnPercentage)
    ? results.returnPercentage
    : null;

  const cards = [
    {
      title: t("Total Corpus"),
      value: results.totalCorpus,
      subValue: results.inflationAdjusted,
      subLabel: t("Inflation adjusted"),
      icon: TrendingUp,
      textColor: "text-foreground",
    },
    {
      title: t("Investment Amount"),
      value: results.totalInvested,
      icon: Wallet,
      textColor: "text-foreground",
    },
    {
      title: t("Returns Earned"),
      value: results.returnsEarned,
      subValue: returnPct === null ? null : `+${returnPct.toFixed(1)}%`,
      subLabel: t("gain"),
      icon: PiggyBank,
      textColor: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-card border border-border rounded-lg p-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${isComparison ? "ring-1 ring-border" : ""}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-md bg-muted border border-border">
              <card.icon className="w-5 h-5 text-foreground" />
            </div>
            {card.subValue && typeof card.subValue === "string" && card.subValue.startsWith("+") && (
              <span className="text-sm font-semibold px-2 py-1 rounded-full border border-border">
                {card.subValue}
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
          <p className={`text-2xl font-bold ${card.textColor}`}>
            {formatCurrency(card.value)}
          </p>
          
          {card.subValue && typeof card.subValue === "number" && (
            <div className="flex items-center gap-1 mt-2">
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Value adjusted for")} {card.subLabel}</p>
                </TooltipContent>
              </Tooltip>
              <p className="text-xs text-muted-foreground">
                {card.subLabel}: {formatCurrency(card.subValue)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
