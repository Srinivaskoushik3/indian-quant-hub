import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { AllocationItem } from '@/lib/portfolioAnalytics';

const COLORS = [
  'hsl(142 71% 45%)', 'hsl(199 89% 48%)', 'hsl(38 92% 50%)',
  'hsl(280 65% 60%)', 'hsl(340 75% 55%)', 'hsl(190 70% 50%)',
  'hsl(60 70% 50%)', 'hsl(15 80% 55%)', 'hsl(220 65% 55%)', 'hsl(100 50% 45%)',
];

interface Props {
  items: AllocationItem[];
}

export default function AllocationChart({ items }: Props) {
  const data = items.map((i, idx) => ({
    name: i.symbol.replace('.NS', ''),
    value: parseFloat(i.weight.toFixed(2)),
    fill: COLORS[idx % COLORS.length],
    price: i.price,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Allocation by Stock</h3>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Add stocks to your watchlist to see allocation</p>
      ) : (
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="h-[220px] w-[220px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                  {data.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                  formatter={(val: number, name: string, props: any) => [`${val.toFixed(1)}% · ₹${props.payload.price.toFixed(2)}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Top Holdings</p>
            {items.slice(0, 5).map((item, i) => (
              <div key={item.symbol} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="flex-1 text-sm text-foreground">{item.symbol.replace('.NS', '')}</span>
                <span className="font-mono text-sm text-muted-foreground">{item.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
