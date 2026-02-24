import { motion, AnimatePresence } from 'framer-motion';
import type { SmartInsight } from '@/lib/portfolioAnalytics';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface Props {
  insights: SmartInsight[];
}

const iconMap = { warning: AlertTriangle, info: Info, success: CheckCircle };
const colorMap = {
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-accent/30 bg-accent/5',
  success: 'border-success/30 bg-success/5',
};
const iconColorMap = { warning: 'text-warning', info: 'text-accent', success: 'text-success' };

export default function SmartInsights({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">🧠 Smart Insights</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence>
          {insights.map((insight, i) => {
            const Icon = iconMap[insight.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card border p-4 ${colorMap[insight.type]}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${iconColorMap[insight.type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{insight.icon} {insight.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
