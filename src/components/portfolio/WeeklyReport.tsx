import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateMockData } from '@/lib/stockData';
import { calculateTotalReturn, calculateVolatility, calculateSharpeRatio } from '@/lib/indicators';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

interface Props {
  symbols: string[];
}

export default function WeeklyReport({ symbols }: Props) {
  const report = useMemo(() => {
    if (symbols.length === 0) return null;

    const stockReturns = symbols.map(sym => {
      const data = generateMockData(sym);
      const closes = data.closes;
      const weeklyCloses = closes.slice(-5);
      const weekReturn = weeklyCloses.length >= 2
        ? ((weeklyCloses[weeklyCloses.length - 1] - weeklyCloses[0]) / weeklyCloses[0]) * 100
        : 0;
      return { symbol: sym, weekReturn, closes };
    });

    const best = stockReturns.reduce((a, b) => a.weekReturn > b.weekReturn ? a : b);
    const worst = stockReturns.reduce((a, b) => a.weekReturn < b.weekReturn ? a : b);

    // Portfolio-level metrics (equal-weight)
    const allCloses = symbols.map(sym => generateMockData(sym).closes);
    const portfolioCloses = allCloses[0].map((_, i) => {
      const sum = allCloses.reduce((s, c) => s + (c[i] || 0), 0);
      return sum / allCloses.length;
    });
    const weeklyReturn = portfolioCloses.length >= 5
      ? ((portfolioCloses[portfolioCloses.length - 1] - portfolioCloses[portfolioCloses.length - 5]) / portfolioCloses[portfolioCloses.length - 5]) * 100
      : 0;

    // Weekly trend (last 12 weeks)
    const weeklyTrend: { week: string; return: number }[] = [];
    for (let w = 11; w >= 0; w--) {
      const end = portfolioCloses.length - w * 5;
      const start = end - 5;
      if (start >= 0 && end > 0 && end <= portfolioCloses.length) {
        const ret = ((portfolioCloses[end - 1] - portfolioCloses[start]) / portfolioCloses[start]) * 100;
        weeklyTrend.push({ week: `W${12 - w}`, return: parseFloat(ret.toFixed(2)) });
      }
    }

    return {
      weeklyReturn,
      bestStock: best.symbol.replace('.NS', ''),
      bestReturn: best.weekReturn,
      worstStock: worst.symbol.replace('.NS', ''),
      worstReturn: worst.weekReturn,
      volatility: calculateVolatility(portfolioCloses),
      sharpe: calculateSharpeRatio(portfolioCloses),
      trend: weeklyTrend,
    };
  }, [symbols]);

  if (!report || symbols.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center text-sm text-muted-foreground">
        Add stocks to your watchlist to generate weekly reports
      </motion.div>
    );
  }

  const isUp = report.weeklyReturn >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Weekly Return', value: `${isUp ? '+' : ''}${report.weeklyReturn.toFixed(2)}%`, icon: isUp ? TrendingUp : TrendingDown, color: isUp ? 'text-success' : 'text-destructive' },
          { label: 'Best Performer', value: `${report.bestStock} (${report.bestReturn >= 0 ? '+' : ''}${report.bestReturn.toFixed(2)}%)`, icon: TrendingUp, color: 'text-success' },
          { label: 'Worst Performer', value: `${report.worstStock} (${report.worstReturn.toFixed(2)}%)`, icon: TrendingDown, color: 'text-destructive' },
          { label: 'Sharpe Ratio', value: report.sharpe.toFixed(2), icon: BarChart3, color: report.sharpe > 1 ? 'text-success' : 'text-warning' },
        ].map((m) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <m.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{m.label}</span>
            </div>
            <p className={`mt-1 font-mono text-lg font-bold ${m.color}`}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">12-Week Return Trend</h4>
        <div className="h-[200px]">
          <ResponsiveContainer>
            <LineChart data={report.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis dataKey="week" stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                formatter={(val: number) => [`${val}%`, 'Return']}
              />
              <Line type="monotone" dataKey="return" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ fill: 'hsl(142 71% 45%)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
