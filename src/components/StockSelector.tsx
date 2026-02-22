import { INDIAN_STOCKS, type StockOption } from '@/lib/stockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface Props {
  selected: string;
  onSelect: (symbol: string) => void;
}

export default function StockSelector({ selected, onSelect }: Props) {
  const current = INDIAN_STOCKS.find(s => s.symbol === selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card flex items-center gap-3 px-4 py-3"
    >
      <Search className="h-4 w-4 text-muted-foreground" />
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-[280px] border-0 bg-transparent text-foreground focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Select a stock">
            {current && (
              <span>
                <span className="font-mono text-primary">{current.symbol.replace('.NS', '')}</span>
                <span className="ml-2 text-muted-foreground">— {current.name}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="glass-card border-border bg-card">
          {INDIAN_STOCKS.map((stock) => (
            <SelectItem key={stock.symbol} value={stock.symbol} className="cursor-pointer hover:bg-secondary">
              <span className="font-mono text-primary">{stock.symbol.replace('.NS', '')}</span>
              <span className="ml-2 text-muted-foreground">{stock.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
}
