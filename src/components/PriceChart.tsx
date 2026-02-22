import { motion } from 'framer-motion';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

interface Props {
  dates: string[];
  closes: number[];
  sma50: (number | null)[];
  sma200: (number | null)[];
}

export default function PriceChart({ dates, closes, sma50, sma200 }: Props) {
  const data = dates.map((date, i) => ({
    date: date.slice(5),
    price: closes[i],
    sma50: sma50[i],
    sma200: sma200[i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Price & Moving Averages
      </h3>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
            <XAxis dataKey="date" stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} />
            <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                background: 'hsl(222 40% 10% / 0.95)',
                border: '1px solid hsl(220 20% 25%)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                color: 'hsl(210 40% 93%)',
              }}
              labelStyle={{ color: 'hsl(215 20% 55%)' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(215 20% 55%)', fontSize: 12 }} />
            <Area type="monotone" dataKey="price" stroke="hsl(142 71% 45%)" fill="url(#priceGrad)" strokeWidth={2} name="Price" dot={false} />
            <Line type="monotone" dataKey="sma50" stroke="hsl(38 92% 50%)" strokeWidth={1.5} dot={false} name="SMA 50" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="sma200" stroke="hsl(199 89% 48%)" strokeWidth={1.5} dot={false} name="SMA 200" strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
