import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { SectorAllocation } from '@/lib/portfolioAnalytics';
import { getSectorColor } from '@/lib/stockMetadata';

interface Props {
  sectors: SectorAllocation[];
}

export default function SectorChart({ sectors }: Props) {
  const data = sectors.map(s => ({
    ...s,
    fill: getSectorColor(s.sector),
    overexposed: s.weight > 35,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Allocation by Sector</h3>
      <p className="mb-4 text-xs text-muted-foreground">Stocks above 35% highlighted</p>
      {sectors.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="sector" stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} width={75} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                formatter={(val: number) => [`${val.toFixed(1)}%`, 'Weight']}
              />
              <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.overexposed ? 'hsl(0 72% 51%)' : d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
