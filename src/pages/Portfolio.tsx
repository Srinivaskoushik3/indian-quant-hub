import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';
import { INDIAN_STOCKS } from '@/lib/stockData';
import { calculateSMA, calculateRSI, getRecommendation, calculateTotalReturn } from '@/lib/indicators';
import { computeAllocations, computeSectorAllocation, computeMarketCapAllocation, computeRiskContributions, computeDiversificationScore, generateSmartInsights } from '@/lib/portfolioAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useMultiStockData } from '@/hooks/useStockData';
import { Plus, Trash2, TrendingUp, TrendingDown, Star, BarChart3, PieChart, Shield, Lightbulb, DollarSign, FileText, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError, isValidStockSymbol } from '@/lib/errorMessages';

// Lazy load heavy chart components
const AllocationChart = lazy(() => import('@/components/portfolio/AllocationChart'));
const SectorChart = lazy(() => import('@/components/portfolio/SectorChart'));
const MarketCapChart = lazy(() => import('@/components/portfolio/MarketCapChart'));
const RiskContributionChart = lazy(() => import('@/components/portfolio/RiskContributionChart'));
const DiversificationScore = lazy(() => import('@/components/portfolio/DiversificationScore'));
const SmartInsights = lazy(() => import('@/components/portfolio/SmartInsights'));
const WeeklyReport = lazy(() => import('@/components/portfolio/WeeklyReport'));
const DividendTracker = lazy(() => import('@/components/portfolio/DividendTracker'));

function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full rounded-2xl" />;
}

interface WatchlistItem {
  id: string;
  stock_symbol: string;
  added_at: string;
}

interface TradeLog {
  id: string;
  stock_symbol: string;
  recommendation: string;
  price: number | null;
  timestamp: string;
}

export default function Portfolio() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [addSymbol, setAddSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('watchlist');
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchWatchlist();
    fetchTradeLogs();
  }, [user]);

  const fetchWatchlist = async () => {
    const { data } = await supabase.from('watchlist').select('*').order('added_at', { ascending: false });
    if (data) setWatchlist(data);
  };

  const fetchTradeLogs = async () => {
    const { data } = await supabase.from('trade_logs').select('*').order('timestamp', { ascending: false }).limit(50);
    if (data) setTradeLogs(data);
  };

  const addToWatchlist = async () => {
    if (!addSymbol || !user) return;
    if (!isValidStockSymbol(addSymbol)) {
      toast({ title: 'Invalid symbol', description: 'Please select a valid stock.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('watchlist').insert({ user_id: user.id, stock_symbol: addSymbol });
    if (error) {
      toast({ title: 'Error', description: getUserFriendlyError(error), variant: 'destructive' });
    } else {
      toast({ title: 'Added', description: `${addSymbol.replace('.NS', '')} added to watchlist` });
      setAddSymbol('');
      fetchWatchlist();
    }
    setLoading(false);
  };

  const removeFromWatchlist = async (id: string) => {
    await supabase.from('watchlist').delete().eq('id', id);
    setWatchlist(prev => prev.filter(w => w.id !== id));
    toast({ title: 'Removed', description: 'Stock removed from watchlist' });
  };

  const logTrade = async (symbol: string) => {
    if (!user || !isValidStockSymbol(symbol)) return;
    const stockData = stockDataMap.get(symbol);
    if (!stockData) return;
    const sma50 = calculateSMA(stockData.closes, 50);
    const sma200 = calculateSMA(stockData.closes, 200);
    const rsi = calculateRSI(stockData.closes);
    const lastIdx = stockData.closes.length - 1;
    const rec = getRecommendation(sma50[lastIdx], sma200[lastIdx], rsi[lastIdx]);
    
    await supabase.from('trade_logs').insert({
      user_id: user.id,
      stock_symbol: symbol,
      recommendation: rec,
      price: stockData.closes[lastIdx],
    });
    fetchTradeLogs();
    toast({ title: 'Logged', description: `${rec} signal for ${symbol.replace('.NS', '')} recorded` });
  };

  const symbols = useMemo(() => watchlist.map(w => w.stock_symbol), [watchlist]);
  const { dataMap: stockDataMap, loading: stocksLoading, isLive } = useMultiStockData(symbols);

  const watchlistAnalysis = useMemo(() => {
    return watchlist.map(item => {
      const data = stockDataMap.get(item.stock_symbol);
      if (!data || data.closes.length < 2) return { ...item, price: 0, change: 0, recommendation: 'HOLD' as const, totalReturn: 0 };
      const closes = data.closes;
      const lastIdx = closes.length - 1;
      const sma50 = calculateSMA(closes, 50);
      const sma200 = calculateSMA(closes, 200);
      const rsi = calculateRSI(closes);
      const rec = getRecommendation(sma50[lastIdx], sma200[lastIdx], rsi[lastIdx]);
      const totalReturn = calculateTotalReturn(closes);
      return { ...item, price: closes[lastIdx], change: ((closes[lastIdx] - closes[lastIdx - 1]) / closes[lastIdx - 1]) * 100, recommendation: rec, totalReturn };
    });
  }, [watchlist, stockDataMap]);

  // symbols already defined above with useMultiStockData

  // Portfolio analytics
  const allocations = useMemo(() => computeAllocations(symbols), [symbols]);
  const sectors = useMemo(() => computeSectorAllocation(allocations), [allocations]);
  const caps = useMemo(() => computeMarketCapAllocation(allocations), [allocations]);
  const risks = useMemo(() => computeRiskContributions(symbols), [symbols]);
  const diversScore = useMemo(() => computeDiversificationScore(allocations, sectors), [allocations, sectors]);
  const insights = useMemo(() => generateSmartInsights(allocations, sectors, risks, diversScore), [allocations, sectors, risks, diversScore]);

  if (!user) {
    return (
      <div className="gradient-bg min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card max-w-md p-10 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-foreground">Sign in to access your Portfolio</h2>
            <p className="mb-6 text-sm text-muted-foreground">Track your watchlist, log trades, and monitor performance.</p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/auth">Sign In</a>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Portfolio Intelligence</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Analytics · Allocation · Insights</p>
            {symbols.length > 0 && (
              <Badge variant="outline" className={`text-xs ${isLive ? 'border-success/30 text-success' : 'border-muted text-muted-foreground'}`}>
                {isLive ? <><Wifi className="mr-1 h-3 w-3" /> Live</> : <><WifiOff className="mr-1 h-3 w-3" /> Mock</>}
              </Badge>
            )}
          </div>
        </motion.div>

        <div className="neon-line" />

        {/* Add to Watchlist */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <Star className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">Add Stock</span>
          <Select value={addSymbol} onValueChange={setAddSymbol}>
            <SelectTrigger className="w-full border-border bg-secondary/50 sm:w-[260px]">
              <SelectValue placeholder="Choose a stock..." />
            </SelectTrigger>
            <SelectContent className="glass-card border-border bg-card">
              {INDIAN_STOCKS.filter(s => !watchlist.some(w => w.stock_symbol === s.symbol)).map(s => (
                <SelectItem key={s.symbol} value={s.symbol}>
                  <span className="font-mono text-primary">{s.symbol.replace('.NS', '')}</span>
                  <span className="ml-2 text-muted-foreground">{s.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addToWatchlist} disabled={!addSymbol || loading} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </motion.div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-5 gap-1 border-border bg-secondary/30 p-1">
            <TabsTrigger value="watchlist" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Star className="h-3.5 w-3.5" /> Watchlist
            </TabsTrigger>
            <TabsTrigger value="allocation" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <PieChart className="h-3.5 w-3.5" /> Allocation
            </TabsTrigger>
            <TabsTrigger value="dividends" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <DollarSign className="h-3.5 w-3.5" /> Dividends
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileText className="h-3.5 w-3.5" /> Report
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Insights
            </TabsTrigger>
          </TabsList>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Star className="h-5 w-5 text-primary" /> Watchlist
              </h2>
              {watchlistAnalysis.length === 0 ? (
                <div className="glass-card flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8" />
                  <p className="text-sm">Your watchlist is empty. Add stocks above to get started.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {watchlistAnalysis.map((item) => {
                      const isUp = item.change >= 0;
                      const recColor = item.recommendation === 'BUY' ? 'text-success bg-success/10 border-success/20' : item.recommendation === 'SELL' ? 'text-destructive bg-destructive/10 border-destructive/20' : 'text-hold bg-hold/10 border-hold/20';
                      return (
                        <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card group relative p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-base font-bold text-foreground">{item.stock_symbol.replace('.NS', '')}</p>
                              <p className="text-xs text-muted-foreground">{INDIAN_STOCKS.find(s => s.symbol === item.stock_symbol)?.name}</p>
                            </div>
                            <button onClick={() => removeFromWatchlist(item.id)} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 flex items-end justify-between">
                            <div>
                              <p className="font-mono text-xl font-bold text-foreground">₹{item.price.toFixed(2)}</p>
                              <p className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-success' : 'text-destructive'}`}>
                                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {isUp ? '+' : ''}{item.change.toFixed(2)}%
                              </p>
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${recColor}`}>{item.recommendation}</span>
                          </div>
                          <Button onClick={() => logTrade(item.stock_symbol)} size="sm" variant="outline" className="mt-3 w-full border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                            Log Trade Signal
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Trade History */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 text-accent" /> Trade Log
              </h2>
              {tradeLogs.length === 0 ? (
                <div className="glass-card p-8 text-center text-sm text-muted-foreground">No trades logged yet.</div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Stock</th>
                          <th className="px-4 py-3 font-medium">Signal</th>
                          <th className="px-4 py-3 font-medium">Price</th>
                          <th className="px-4 py-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeLogs.map((log) => {
                          const sigColor = log.recommendation === 'BUY' ? 'text-success' : log.recommendation === 'SELL' ? 'text-destructive' : 'text-hold';
                          return (
                            <tr key={log.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                              <td className="px-4 py-3 font-mono font-medium text-foreground">{log.stock_symbol.replace('.NS', '')}</td>
                              <td className={`px-4 py-3 font-semibold ${sigColor}`}>{log.recommendation}</td>
                              <td className="px-4 py-3 font-mono text-foreground">₹{log.price?.toFixed(2) ?? '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            <Suspense fallback={<ChartSkeleton />}>
              <DiversificationScore score={diversScore} />
            </Suspense>
            <div className="grid gap-4 lg:grid-cols-2">
              <Suspense fallback={<ChartSkeleton />}>
                <AllocationChart items={allocations} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <SectorChart sectors={sectors} />
              </Suspense>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Suspense fallback={<ChartSkeleton />}>
                <MarketCapChart caps={caps} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <RiskContributionChart risks={risks} />
              </Suspense>
            </div>
          </TabsContent>

          {/* Dividends Tab */}
          <TabsContent value="dividends">
            <Suspense fallback={<ChartSkeleton />}>
              <DividendTracker symbols={symbols} />
            </Suspense>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <FileText className="h-5 w-5 text-accent" /> Weekly Intelligence Report
              </h2>
            </motion.div>
            <Suspense fallback={<ChartSkeleton />}>
              <WeeklyReport symbols={symbols} />
            </Suspense>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Suspense fallback={<ChartSkeleton />}>
              <SmartInsights insights={insights} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Disclaimer />
    </div>
  );
}
