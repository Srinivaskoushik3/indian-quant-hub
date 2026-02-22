import { motion } from 'framer-motion';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';

interface Props {
  dates: string[];
  rsi: (number | null)[];
}

export default function RSIChart({ dates, rsi }: Props) {
  const data = dates.map((date, i) => ({
    date: date.slice(5),
    rsi: rsi[i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        RSI (Relative Strength Index)
      </h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
            <XAxis dataKey="date" stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} />
            <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: 'hsl(222 40% 10% / 0.95)',
                border: '1px solid hsl(220 20% 25%)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                color: 'hsl(210 40% 93%)',
              }}
            />
            <ReferenceLine y={70} stroke="hsl(0 72% 51%)" strokeDasharray="5 3" label={{ value: 'Overbought', fill: 'hsl(0 72% 51%)', fontSize: 10 }} />
            <ReferenceLine y={30} stroke="hsl(142 71% 45%)" strokeDasharray="5 3" label={{ value: 'Oversold', fill: 'hsl(142 71% 45%)', fontSize: 10 }} />
            <Area type="monotone" dataKey="rsi" stroke="hsl(199 89% 48%)" fill="url(#rsiGrad)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
