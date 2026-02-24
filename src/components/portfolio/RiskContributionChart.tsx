import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { RiskContribution } from '@/lib/portfolioAnalytics';

interface Props {
  risks: RiskContribution[];
}

export default function RiskContributionChart({ risks }: Props) {
  const data = risks.map(r => ({
    name: r.symbol.replace('.NS', ''),
    contribution: parseFloat(r.contribution.toFixed(1)),
    volatility: parseFloat(r.volatility.toFixed(1)),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Risk Contribution</h3>
      <p className="mb-4 text-xs text-muted-foreground">Volatility-based contribution per stock</p>
      {risks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ bottom: 20 }}>
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                formatter={(val: number, name: string) => [`${val}%`, name === 'contribution' ? 'Risk Share' : 'Volatility']}
              />
              <Bar dataKey="contribution" radius={[6, 6, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.contribution > 30 ? 'hsl(0 72% 51%)' : 'hsl(199 89% 48%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
