import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useI18n } from "@/i18n/i18n";

const formatCurrency = (value) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${(value / 1000).toFixed(0)}K`;
};

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg p-3 border border-border bg-card">
        <p className="text-sm font-semibold text-foreground mb-2">{t("Age:")} {label} {t("years")}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-foreground">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function StackedChart({ data, comparisonData = null, showComparison = false }) {
  const { t } = useI18n();

  const chartData = data.map((item, index) => ({
    age: item.age,
    principal: item.totalInvested,
    returns: item.returnsEarned,
    ...(showComparison && comparisonData && comparisonData[index] && {
      principalB: comparisonData[index].totalInvested,
      returnsB: comparisonData[index].returnsEarned,
    }),
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">{t("Growth Over Time")}</h3>
      <div className="h-[26rem] md:h-[32rem]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="age" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, opacity: 0.6 }} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
            
            <Area
              type="monotone"
              dataKey="principal"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.12}
              name={t("Principal (A)")}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="returns"
              stackId="1"
              stroke="hsl(var(--success))"
              fill="hsl(var(--success))"
              fillOpacity={0.10}
              name={t("Returns (A)")}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            
            {showComparison && (
              <>
                <Area
                  type="monotone"
                  dataKey="principalB"
                  stackId="2"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.08}
                  name={t("Principal (B)")}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="returnsB"
                  stackId="2"
                  stroke="hsl(var(--border))"
                  fill="hsl(var(--border))"
                  fillOpacity={0.10}
                  name={t("Returns (B)")}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
