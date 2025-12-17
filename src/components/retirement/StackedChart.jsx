import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formatCurrency = (value) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${(value / 1000).toFixed(0)}K`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-border">
        <p className="text-sm font-semibold text-foreground mb-2">Age: {label} years</p>
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
      <h3 className="text-lg font-semibold text-foreground mb-4">Growth Over Time</h3>
      <div className="h-[26rem] md:h-[32rem]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="principalGradientB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="returnsGradientB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(40, 90%, 50%)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="hsl(40, 90%, 50%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, opacity: 0.6 }} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
            
            <Area
              type="monotone"
              dataKey="principal"
              stackId="1"
              stroke="hsl(217, 91%, 60%)"
              fill="url(#principalGradient)"
              name="Principal (A)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(217, 91%, 60%)" }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="returns"
              stackId="1"
              stroke="hsl(160, 84%, 39%)"
              fill="url(#returnsGradient)"
              name="Returns (A)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(160, 84%, 39%)" }}
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
                  stroke="hsl(280, 70%, 60%)"
                  fill="url(#principalGradientB)"
                  name="Principal (B)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(280, 70%, 60%)" }}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="returnsB"
                  stackId="2"
                  stroke="hsl(40, 90%, 50%)"
                  fill="url(#returnsGradientB)"
                  name="Returns (B)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(40, 90%, 50%)" }}
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
