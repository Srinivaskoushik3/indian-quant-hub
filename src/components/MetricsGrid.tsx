import { motion } from 'framer-motion';
import { TrendingUp, Activity, AlertTriangle, BarChart2 } from 'lucide-react';

interface Props {
  totalReturn: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function MetricsGrid({ totalReturn, sharpeRatio, volatility, maxDrawdown }: Props) {
  const metrics = [
    {
      label: 'Total Return',
      value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`,
      icon: TrendingUp,
      color: totalReturn >= 0 ? 'text-success' : 'text-destructive',
    },
    {
      label: 'Sharpe Ratio',
      value: sharpeRatio.toFixed(2),
      icon: BarChart2,
      color: sharpeRatio > 1 ? 'text-success' : sharpeRatio > 0 ? 'text-warning' : 'text-destructive',
    },
    {
      label: 'Volatility',
      value: `${volatility.toFixed(2)}%`,
      icon: Activity,
      color: volatility < 25 ? 'text-success' : volatility < 40 ? 'text-warning' : 'text-destructive',
    },
    {
      label: 'Max Drawdown',
      value: `-${maxDrawdown.toFixed(2)}%`,
      icon: AlertTriangle,
      color: maxDrawdown < 15 ? 'text-success' : maxDrawdown < 30 ? 'text-warning' : 'text-destructive',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {metrics.map((m) => (
        <motion.div key={m.label} variants={item} className="glass-card p-5">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <m.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{m.label}</span>
          </div>
          <p className={`font-mono text-2xl font-bold ${m.color}`}>{m.value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
