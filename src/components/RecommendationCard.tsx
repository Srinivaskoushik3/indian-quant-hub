import { motion } from 'framer-motion';
import type { Recommendation } from '@/lib/indicators';

interface Props {
  recommendation: Recommendation;
  rsi: number | null;
  sma50: number | null;
  sma200: number | null;
}

const config: Record<Recommendation, { label: string; className: string; glowClass: string }> = {
  BUY: { label: 'Strong Buy', className: 'bg-success/20 text-success border-success/30', glowClass: 'glow-green' },
  SELL: { label: 'Sell Signal', className: 'bg-destructive/20 text-destructive border-destructive/30', glowClass: 'glow-red' },
  HOLD: { label: 'Hold Position', className: 'bg-hold/20 text-hold border-hold/30', glowClass: 'glow-blue' },
};

export default function RecommendationCard({ recommendation, rsi, sma50, sma200 }: Props) {
  const c = config[recommendation];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className={`glass-card p-6 ${c.glowClass}`}
    >
      <p className="mb-2 text-sm text-muted-foreground">AI Recommendation</p>
      <motion.div
        key={recommendation}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${c.className}`}
      >
        <span className="mr-2 h-2 w-2 rounded-full bg-current animate-pulse-glow" />
        {c.label}
      </motion.div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div>
          <p>SMA 50</p>
          <p className="font-mono text-foreground">₹{sma50?.toFixed(2) ?? '—'}</p>
        </div>
        <div>
          <p>SMA 200</p>
          <p className="font-mono text-foreground">₹{sma200?.toFixed(2) ?? '—'}</p>
        </div>
        <div>
          <p>RSI (14)</p>
          <p className="font-mono text-foreground">{rsi?.toFixed(1) ?? '—'}</p>
        </div>
        <div>
          <p>Signal</p>
          <p className="font-mono text-foreground">
            {sma50 && sma200 ? (sma50 > sma200 ? 'Bullish' : 'Bearish') : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
