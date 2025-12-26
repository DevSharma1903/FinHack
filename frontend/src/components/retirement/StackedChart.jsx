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
          <p key={index} className="text-sm" style={{ color: entry.color }}>
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
    <div className="glass rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
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
              stroke="hsl(195, 100%, 65%)"
              fill="hsl(195, 100%, 65%)"
              fillOpacity={0.3}
              name={t("Principal (A)")}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(195, 100%, 75%)", fill: "hsl(195, 100%, 65%)" }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="returns"
              stackId="1"
              stroke="hsl(142, 76%, 50%)"
              fill="hsl(142, 76%, 50%)"
              fillOpacity={0.3}
              name={t("Returns (A)")}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(142, 76%, 60%)", fill: "hsl(142, 76%, 50%)" }}
              isAnimationActive
              animationDuration={1400}
              animationEasing="ease-out"
            />
            
            {showComparison && (
              <>
                <Area
                  type="monotone"
                  dataKey="principalB"
                  stackId="2"
                  stroke="hsl(250, 70%, 65%)"
                  fill="hsl(250, 70%, 65%)"
                  fillOpacity={0.25}
                  name={t("Principal (B)")}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(250, 70%, 75%)", fill: "hsl(250, 70%, 65%)" }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="returnsB"
                  stackId="2"
                  stroke="hsl(45, 100%, 55%)"
                  fill="hsl(45, 100%, 55%)"
                  fillOpacity={0.25}
                  name={t("Returns (B)")}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(45, 100%, 65%)", fill: "hsl(45, 100%, 55%)" }}
                  isAnimationActive
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
