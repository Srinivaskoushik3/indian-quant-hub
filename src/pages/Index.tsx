import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import StockSelector from '@/components/StockSelector';
import PriceCard from '@/components/PriceCard';
import RecommendationCard from '@/components/RecommendationCard';
import MetricsGrid from '@/components/MetricsGrid';
import PriceChart from '@/components/PriceChart';
import RSIChart from '@/components/RSIChart';
import Disclaimer from '@/components/Disclaimer';
import { useStockData } from '@/hooks/useStockData';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import {
  calculateSMA, calculateRSI, getRecommendation,
  calculateTotalReturn, calculateSharpeRatio, calculateVolatility, calculateMaxDrawdown,
} from '@/lib/indicators';

export default function Index() {
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
  const { data, loading, isLive } = useStockData(selectedStock);

  const analysis = useMemo(() => {
    if (!data) return null;
    const sma50 = calculateSMA(data.closes, 50);
    const sma200 = calculateSMA(data.closes, 200);
    const rsi = calculateRSI(data.closes);

    const lastIdx = data.closes.length - 1;
    const currentSMA50 = sma50[lastIdx];
    const currentSMA200 = sma200[lastIdx];
    const currentRSI = rsi[lastIdx];
    const recommendation = getRecommendation(currentSMA50, currentSMA200, currentRSI);

    return {
      data,
      sma50,
      sma200,
      rsi,
      currentSMA50,
      currentSMA200,
      currentRSI,
      recommendation,
      currentPrice: data.closes[lastIdx],
      previousPrice: data.closes[lastIdx - 1],
      totalReturn: calculateTotalReturn(data.closes),
      sharpeRatio: calculateSharpeRatio(data.closes),
      volatility: calculateVolatility(data.closes),
      maxDrawdown: calculateMaxDrawdown(data.closes),
    };
  }, [data]);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Trading Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Real-time analysis · Indian equities
              </p>
              <Badge variant="outline" className={`text-xs ${isLive ? 'border-success/30 text-success' : 'border-muted text-muted-foreground'}`}>
                {isLive ? <><Wifi className="mr-1 h-3 w-3" /> Live</> : <><WifiOff className="mr-1 h-3 w-3" /> Mock</>}
              </Badge>
            </div>
          </div>
          <StockSelector selected={selectedStock} onSelect={setSelectedStock} />
        </motion.div>

        <div className="neon-line" />

        {loading || !analysis ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[140px] rounded-2xl" />
              <Skeleton className="h-[140px] rounded-2xl" />
            </div>
            <Skeleton className="h-[100px] rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Price & Recommendation */}
            <div className="grid gap-4 md:grid-cols-2">
              <PriceCard
                price={analysis.currentPrice}
                previousPrice={analysis.previousPrice}
                symbol={selectedStock}
              />
              <RecommendationCard
                recommendation={analysis.recommendation}
                rsi={analysis.currentRSI}
                sma50={analysis.currentSMA50}
                sma200={analysis.currentSMA200}
              />
            </div>

            {/* Metrics */}
            <MetricsGrid
              totalReturn={analysis.totalReturn}
              sharpeRatio={analysis.sharpeRatio}
              volatility={analysis.volatility}
              maxDrawdown={analysis.maxDrawdown}
            />

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-1">
              <PriceChart
                dates={analysis.data.dates}
                closes={analysis.data.closes}
                sma50={analysis.sma50}
                sma200={analysis.sma200}
              />
              <RSIChart
                dates={analysis.data.dates}
                rsi={analysis.rsi}
              />
            </div>
          </>
        )}
      </main>

      <Disclaimer />
    </div>
  );
}
