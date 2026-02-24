import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Shield } from 'lucide-react';

interface Props {
  score: number;
}

export default function DiversificationScore({ score }: Props) {
  const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Moderate' : 'Low';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Diversification Score</h3>
      </div>
      <div className="flex items-end gap-3">
        <span className={`font-mono text-4xl font-bold ${color}`}>{score}</span>
        <span className="mb-1 text-sm text-muted-foreground">/ 100</span>
        <span className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-semibold ${color} ${
          score >= 70 ? 'bg-success/10 border-success/20' : score >= 40 ? 'bg-warning/10 border-warning/20' : 'bg-destructive/10 border-destructive/20'
        }`}>
          {label}
        </span>
      </div>
      <div className="mt-4">
        <Progress value={score} className="h-2" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Based on concentration, sector spread, and correlation analysis
      </p>
    </motion.div>
  );
}
