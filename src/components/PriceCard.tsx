import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  price: number;
  previousPrice: number;
  symbol: string;
}

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const steps = 20;
    const diff = value - display;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(prev => prev + diff / steps);
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(value);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return <span>₹{display.toFixed(decimals)}</span>;
}

export default function PriceCard({ price, previousPrice, symbol }: Props) {
  const change = price - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className={`glass-card p-6 ${isPositive ? 'glow-green' : 'glow-red'}`}
    >
      <p className="mb-1 text-sm text-muted-foreground">
        {symbol.replace('.NS', '')} · Live Price
      </p>
      <div className="flex items-end gap-3">
        <span className="font-mono text-3xl font-bold text-foreground animate-count-up">
          <AnimatedNumber value={price} />
        </span>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </motion.div>
  );
}
