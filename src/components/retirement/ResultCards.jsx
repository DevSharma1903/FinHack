import { TrendingUp, Wallet, PiggyBank, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const returnPct = typeof results.returnPercentage === "number" && Number.isFinite(results.returnPercentage)
    ? results.returnPercentage
    : null;

  const cards = [
    {
      title: "Total Corpus",
      value: results.totalCorpus,
      subValue: results.inflationAdjusted,
      subLabel: "Inflation adjusted",
      icon: TrendingUp,
      gradient: "from-primary to-primary/70",
      textColor: "text-primary",
    },
    {
      title: "Investment Amount",
      value: results.totalInvested,
      icon: Wallet,
      gradient: "from-muted-foreground to-muted-foreground/70",
      textColor: "text-foreground",
    },
    {
      title: "Returns Earned",
      value: results.returnsEarned,
      subValue: returnPct === null ? null : `+${returnPct.toFixed(1)}%`,
      subLabel: "gain",
      icon: PiggyBank,
      gradient: "from-accent to-accent/70",
      textColor: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`glass rounded-2xl p-5 animate-fade-in ${isComparison ? "border-accent/30" : ""}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${card.gradient}`}>
              <card.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            {card.subValue && typeof card.subValue === "string" && card.subValue.startsWith("+") && (
              <span className="text-sm font-semibold text-accent bg-accent/10 px-2 py-1 rounded-full">
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
                  <p>Value adjusted for {card.subLabel}</p>
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
