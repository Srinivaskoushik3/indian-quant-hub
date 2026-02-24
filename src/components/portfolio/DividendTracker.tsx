import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getStockMeta } from '@/lib/stockMetadata';
import { generateMockData } from '@/lib/stockData';
import { Calendar, IndianRupee, TrendingUp } from 'lucide-react';

interface Props {
  symbols: string[];
}

export default function DividendTracker({ symbols }: Props) {
  const dividendData = useMemo(() => {
    return symbols.map(sym => {
      const meta = getStockMeta(sym);
      const data = generateMockData(sym);
      const price = data.closes[data.closes.length - 1];
      return {
        symbol: sym.replace('.NS', ''),
        yield: meta?.dividendYield ?? 0,
        annualDividend: meta?.annualDividend ?? 0,
        nextExDate: meta?.nextExDate ?? '—',
        price,
        income: meta?.annualDividend ?? 0, // per share
      };
    }).sort((a, b) => b.yield - a.yield);
  }, [symbols]);

  const totalYTDIncome = dividendData.reduce((s, d) => s + d.income, 0);
  const expectedAnnualIncome = totalYTDIncome; // simplified
  const avgYield = dividendData.length > 0 ? dividendData.reduce((s, d) => s + d.yield, 0) / dividendData.length : 0;

  if (symbols.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center text-sm text-muted-foreground">
        Add stocks to track dividends
      </motion.div>
    );
  }

  const chartData = dividendData.map(d => ({
    name: d.symbol,
    yield: d.yield,
    income: d.annualDividend,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs font-medium">Total Annual Income</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-success">₹{expectedAnnualIncome.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">per share held</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Dividend Yield</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-accent">{avgYield.toFixed(2)}%</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Upcoming Ex-Dates</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">{dividendData.filter(d => d.nextExDate !== '—').length}</p>
        </div>
      </div>

      {/* Yield chart */}
      <motion.div className="glass-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">Dividend Yield by Stock</h4>
        <div className="h-[200px]">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ bottom: 20 }}>
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                formatter={(val: number, name: string) => [`${val}%`, 'Yield']}
              />
              <Bar dataKey="yield" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.yield > 2 ? 'hsl(142 71% 45%)' : 'hsl(199 89% 48%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Upcoming dividends calendar */}
      <motion.div className="glass-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">📅 Upcoming Dividend Calendar</h4>
        <div className="space-y-2">
          {dividendData
            .filter(d => d.nextExDate !== '—')
            .sort((a, b) => new Date(a.nextExDate).getTime() - new Date(b.nextExDate).getTime())
            .map(d => {
              const isHighYield = d.yield > 2;
              return (
                <div key={d.symbol} className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-foreground">{d.symbol}</span>
                    {isHighYield && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">High Yield</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Ex-Date: {new Date(d.nextExDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    <p className="font-mono text-xs text-foreground">₹{d.annualDividend}/share · {d.yield}%</p>
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}
