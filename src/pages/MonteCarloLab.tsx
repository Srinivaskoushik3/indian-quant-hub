import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';
import { supabase } from '@/integrations/supabase/client';
import { useMultiStockData } from '@/hooks/useStockData';
import { INDIAN_STOCKS } from '@/lib/stockData';
import { runSimulation, estimatePortfolioParams, type SimulationResult, type RiskMetrics } from '@/lib/monteCarloEngine';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Activity, TrendingDown, BarChart3, Save, Server, Monitor, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from 'recharts';

export default function MonteCarloLab() {
  const [user, setUser] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [simCount, setSimCount] = useState(1000);
  const [horizon, setHorizon] = useState(252);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [computeMode, setComputeMode] = useState<'client' | 'server'>('client');
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('watchlist').select('stock_symbol').then(({ data }) => {
      if (data) setWatchlist(data.map(d => d.stock_symbol));
    });
  }, [user]);

  const { dataMap, loading: stocksLoading } = useMultiStockData(watchlist);

  const portfolioParams = useMemo(() => {
    const pricesMap = new Map<string, number[]>();
    for (const [sym, data] of dataMap) {
      pricesMap.set(sym, data.closes);
    }
    return estimatePortfolioParams(pricesMap);
  }, [dataMap]);

  const runClientSim = useCallback(() => {
    setRunning(true);
    // Run in next tick to allow UI to update
    setTimeout(() => {
      const res = runSimulation({
        initialValue: portfolioParams.currentValue,
        mu: portfolioParams.mu,
        sigma: portfolioParams.sigma,
        simCount,
        horizon,
        confidenceLevel: confidenceLevel / 100,
      });
      setResult(res);
      setRunning(false);
      toast({ title: 'Simulation Complete', description: `${simCount} paths simulated over ${horizon} days` });
    }, 50);
  }, [portfolioParams, simCount, horizon, confidenceLevel, toast]);

  const runServerSim = useCallback(async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('monte-carlo', {
        body: {
          initialValue: portfolioParams.currentValue,
          mu: portfolioParams.mu,
          sigma: portfolioParams.sigma,
          simCount: Math.min(simCount, 10000),
          horizon,
        },
      });
      if (error) throw error;
      // Server returns percentiles only at sampled days - interpolate to full horizon
      const serverP5 = data.percentilePaths.p5 as number[];
      const serverP50 = data.percentilePaths.p50 as number[];
      const serverP95 = data.percentilePaths.p95 as number[];
      const pDays: number[] = data.percentileDays || serverP5.map((_: number, i: number) => i);
      
      // Build full-length percentile arrays by linear interpolation
      const interpFull = (sparse: number[]) => {
        const full: number[] = new Array(horizon + 1);
        let j = 0;
        for (let d = 0; d <= horizon; d++) {
          if (j + 1 < pDays.length && d >= pDays[j + 1]) j++;
          if (d <= pDays[0]) { full[d] = sparse[0]; continue; }
          if (j + 1 >= pDays.length) { full[d] = sparse[sparse.length - 1]; continue; }
          const t = (d - pDays[j]) / (pDays[j + 1] - pDays[j]);
          full[d] = sparse[j] + t * (sparse[j + 1] - sparse[j]);
        }
        return full;
      };

      setResult({
        paths: (data.samplePaths || []).map((values: number[]) => ({ values })),
        finalValues: data.finalValues,
        metrics: data.metrics as RiskMetrics,
        percentilePaths: { p5: interpFull(serverP5), p50: interpFull(serverP50), p95: interpFull(serverP95) },
      });
      const actualCount = data.actualSimCount || simCount;
      toast({ title: 'Server Simulation Complete', description: `${actualCount} paths computed on server` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Server error', description: 'Falling back to client simulation', variant: 'destructive' });
      runClientSim();
    } finally {
      setRunning(false);
    }
  }, [portfolioParams, simCount, horizon, toast, runClientSim]);

  const handleRun = () => {
    if (computeMode === 'server') runServerSim();
    else runClientSim();
  };

  const saveSnapshot = async () => {
    if (!user || !result) return;
    const { error } = await supabase.from('monte_carlo_snapshots' as any).insert({
      user_id: user.id,
      symbols: watchlist,
      simulation_count: simCount,
      time_horizon: horizon,
      confidence_level: confidenceLevel / 100,
      var_95: result.metrics.var95,
      var_99: result.metrics.var99,
      cvar_95: result.metrics.cvar95,
      prob_negative: result.metrics.probNegative,
      worst_5pct: result.metrics.worst5pct,
      median_return: result.metrics.medianReturn,
      best_5pct: result.metrics.best5pct,
      max_drawdown_mean: result.metrics.maxDrawdownMean,
      initial_value: portfolioParams.currentValue,
    });
    if (error) {
      toast({ title: 'Save failed', description: 'Could not save snapshot. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Snapshot saved to database' });
    }
  };

  // Chart data
  const spaghettiData = useMemo(() => {
    if (!result) return [];
    const step = Math.max(1, Math.floor(horizon / 100));
    const data: any[] = [];
    for (let day = 0; day <= horizon; day += step) {
      const point: any = { day };
      point.p5 = result.percentilePaths.p5[day];
      point.p50 = result.percentilePaths.p50[day];
      point.p95 = result.percentilePaths.p95[day];
      // Sample paths
      for (let p = 0; p < Math.min(result.paths.length, 50); p++) {
        point[`path${p}`] = result.paths[p].values[day];
      }
      data.push(point);
    }
    return data;
  }, [result, horizon]);

  const histogramData = useMemo(() => {
    if (!result) return [];
    const returns = result.finalValues.map(v => (v - portfolioParams.currentValue) / portfolioParams.currentValue * 100);
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const bins = 40;
    const binWidth = (max - min) / bins;
    const histogram: { range: string; count: number; midpoint: number }[] = [];
    for (let i = 0; i < bins; i++) {
      const lo = min + i * binWidth;
      const hi = lo + binWidth;
      const count = returns.filter(r => r >= lo && r < hi).length;
      histogram.push({ range: `${lo.toFixed(0)}%`, count, midpoint: (lo + hi) / 2 });
    }
    return histogram;
  }, [result, portfolioParams.currentValue]);

  if (!user) {
    return (
      <div className="gradient-bg min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card max-w-md p-10 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-foreground">Sign in to access Monte Carlo Lab</h2>
            <p className="mb-6 text-sm text-muted-foreground">Run risk simulations on your portfolio.</p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><a href="/auth">Sign In</a></Button>
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
          <h1 className="text-2xl font-bold text-foreground">Monte Carlo Risk Lab</h1>
          <p className="text-sm text-muted-foreground">Stochastic simulation using Geometric Brownian Motion</p>
        </motion.div>
        <div className="neon-line" />

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {watchlist.length} stocks · ₹{portfolioParams.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              μ = {(portfolioParams.mu * 100).toFixed(1)}% · σ = {(portfolioParams.sigma * 100).toFixed(1)}%
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-foreground">
                Simulations <span className="font-mono text-primary">{simCount.toLocaleString()}</span>
              </label>
              <Slider value={[simCount]} onValueChange={([v]) => setSimCount(v)} min={100} max={10000} step={100} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-foreground">
                Horizon (days) <span className="font-mono text-primary">{horizon}</span>
              </label>
              <Slider value={[horizon]} onValueChange={([v]) => setHorizon(v)} min={21} max={504} step={21} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-foreground">
                Confidence <span className="font-mono text-primary">{confidenceLevel}%</span>
              </label>
              <Slider value={[confidenceLevel]} onValueChange={([v]) => setConfidenceLevel(v)} min={80} max={99} step={1} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={computeMode === 'client' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComputeMode('client')}
              className={computeMode === 'client' ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
            >
              <Monitor className="mr-1 h-4 w-4" /> Client
            </Button>
            <Button
              variant={computeMode === 'server' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComputeMode('server')}
              className={computeMode === 'server' ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
            >
              <Server className="mr-1 h-4 w-4" /> Server
            </Button>
            <Button onClick={handleRun} disabled={running || stocksLoading || watchlist.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Zap className="mr-1 h-4 w-4" /> {running ? 'Running...' : 'Run Simulation'}
            </Button>
            {result && (
              <Button onClick={saveSnapshot} variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
                <Save className="mr-1 h-4 w-4" /> Save Snapshot
              </Button>
            )}
          </div>
        </motion.div>

        {/* Results */}
        {result && (
          <>
            {/* Risk Metrics Grid */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="95% VaR" value={`${result.metrics.var95.toFixed(2)}%`} icon={<TrendingDown className="h-4 w-4" />} color="destructive" />
              <MetricCard label="99% VaR" value={`${result.metrics.var99.toFixed(2)}%`} icon={<TrendingDown className="h-4 w-4" />} color="destructive" />
              <MetricCard label="CVaR (Expected Shortfall)" value={`${result.metrics.cvar95.toFixed(2)}%`} icon={<Activity className="h-4 w-4" />} color="warning" />
              <MetricCard label="P(Negative Return)" value={`${result.metrics.probNegative.toFixed(1)}%`} icon={<BarChart3 className="h-4 w-4" />} color="muted" />
              <MetricCard label="Worst 5%" value={`${result.metrics.worst5pct.toFixed(2)}%`} icon={<TrendingDown className="h-4 w-4" />} color="destructive" />
              <MetricCard label="Median Return" value={`${result.metrics.medianReturn.toFixed(2)}%`} icon={<Activity className="h-4 w-4" />} color="primary" />
              <MetricCard label="Best 5%" value={`+${result.metrics.best5pct.toFixed(2)}%`} icon={<BarChart3 className="h-4 w-4" />} color="success" />
              <MetricCard label="Avg Max Drawdown" value={`${result.metrics.maxDrawdownMean.toFixed(2)}%`} icon={<TrendingDown className="h-4 w-4" />} color="warning" />
            </motion.div>

            {/* Spaghetti Chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Simulation Paths with Confidence Bands</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={spaghettiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, '']} />
                  {/* Confidence band */}
                  <Area dataKey="p95" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.08} />
                  <Area dataKey="p5" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                  {/* Sample paths */}
                  {Array.from({ length: Math.min(result.paths.length, 30) }, (_, i) => (
                    <Line key={i} dataKey={`path${i}`} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} dot={false} strokeWidth={1} />
                  ))}
                  {/* Percentile lines */}
                  <Line dataKey="p5" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} strokeDasharray="6 3" name="5th %ile" />
                  <Line dataKey="p50" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Median" />
                  <Line dataKey="p95" stroke="hsl(var(--success))" strokeWidth={2} dot={false} strokeDasharray="6 3" name="95th %ile" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Distribution Histogram */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Return Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                  <ReferenceLine x={histogramData.findIndex(d => d.midpoint >= -result.metrics.var95)} stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'VaR 95%', fill: 'hsl(var(--destructive))', fontSize: 11 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </>
        )}

        {!result && !running && watchlist.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col items-center gap-3 p-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Configure parameters above and click <strong>Run Simulation</strong></p>
          </motion.div>
        )}

        {watchlist.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col items-center gap-3 p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add stocks to your <a href="/portfolio" className="text-primary underline">Portfolio watchlist</a> first</p>
          </motion.div>
        )}
      </main>
      <Disclaimer />
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    destructive: 'text-destructive bg-destructive/10 border-destructive/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    muted: 'text-muted-foreground bg-muted/50 border-border',
  };
  return (
    <div className="glass-card flex items-center gap-3 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${colorMap[color] || colorMap.muted}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
