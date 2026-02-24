import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { MarketCapAllocation } from '@/lib/portfolioAnalytics';
import { getMarketCapColor } from '@/lib/stockMetadata';

interface Props {
  caps: MarketCapAllocation[];
}

export default function MarketCapChart({ caps }: Props) {
  const data = caps.map(c => ({ name: c.cap, value: parseFloat(c.weight.toFixed(1)), fill: getMarketCapColor(c.cap) }));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Market Cap Distribution</h3>
      {caps.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {data.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                formatter={(val: number) => [`${val}%`, 'Weight']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
