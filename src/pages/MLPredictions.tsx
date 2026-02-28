import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';
import { supabase } from '@/integrations/supabase/client';
import { useStockData } from '@/hooks/useStockData';
import { INDIAN_STOCKS } from '@/lib/stockData';
import { extractFeatures, statisticalPredict, evaluateAccuracy, type StockFeatures } from '@/lib/mlFeatures';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3, Shield, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

interface AIPrediction {
  direction: string;
  nextDayReturn: number;
  fiveDayReturn: number;
  confidence: number;
  probPositive: number;
  keyFactors: { factor: string; impact: string; weight: number }[];
  reasoning: string;
  riskLevel: string;
}

export default function MLPredictions() {
  const [user, setUser] = useState<any>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [modelType, setModelType] = useState<'combined' | 'statistical' | 'ai'>('combined');
  const { toast } = useToast();

  const { data: stockData, loading: stockLoading } = useStockData(selectedSymbol);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const features = useMemo(() => {
    if (!stockData) return null;
    return extractFeatures(stockData.closes, stockData.volumes);
  }, [stockData]);

  const statPrediction = useMemo(() => {
    if (!stockData) return null;
    return statisticalPredict(stockData.closes);
  }, [stockData]);

  const accuracy = useMemo(() => {
    if (!stockData) return null;
    return evaluateAccuracy(stockData.closes);
  }, [stockData]);

  const fetchAIPrediction = async () => {
    if (!features || !statPrediction || !accuracy) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ml-predict', {
        body: {
          symbol: selectedSymbol.replace('.NS', ''),
          features,
          statisticalPrediction: statPrediction,
          accuracy,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiPrediction(data.prediction);
      toast({ title: 'AI Analysis Complete', description: `Prediction generated for ${selectedSymbol.replace('.NS', '')}` });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'AI Error', description: 'Failed to get AI prediction. Please try again.', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  // Feature importance chart data
  const featureImportance = useMemo(() => {
    if (!aiPrediction?.keyFactors) return [];
    return aiPrediction.keyFactors.map(f => ({
      factor: f.factor,
      weight: f.weight,
      fill: f.impact === 'POSITIVE' ? 'hsl(var(--success))' : f.impact === 'NEGATIVE' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
    }));
  }, [aiPrediction]);

  // Predicted vs actual (last 20 days from statistical model)
  const predVsActual = useMemo(() => {
    if (!stockData || stockData.closes.length < 50) return [];
    const data: any[] = [];
    for (let i = 20; i >= 1; i--) {
      const endIdx = stockData.closes.length - i;
      const trainData = stockData.closes.slice(0, endIdx);
      const pred = statisticalPredict(trainData);
      const actual = (stockData.closes[endIdx] - stockData.closes[endIdx - 1]) / stockData.closes[endIdx - 1] * 100;
      data.push({
        day: stockData.dates[endIdx],
        predicted: Number(pred.predictedReturn.toFixed(3)),
        actual: Number(actual.toFixed(3)),
      });
    }
    return data;
  }, [stockData]);

  // Combine results
  const combinedDirection = useMemo(() => {
    if (modelType === 'statistical') return statPrediction?.direction || 'NEUTRAL';
    if (modelType === 'ai') return aiPrediction?.direction || 'NEUTRAL';
    // Combined
    if (!statPrediction || !aiPrediction) return statPrediction?.direction || 'NEUTRAL';
    const statSignal = statPrediction.direction === 'UP' ? 1 : statPrediction.direction === 'DOWN' ? -1 : 0;
    const aiSignal = aiPrediction.direction === 'BULLISH' ? 1 : aiPrediction.direction === 'BEARISH' ? -1 : 0;
    const combined = statSignal * 0.4 + aiSignal * 0.6;
    return combined > 0.2 ? 'BULLISH' : combined < -0.2 ? 'BEARISH' : 'NEUTRAL';
  }, [statPrediction, aiPrediction, modelType]);

  const directionIcon = combinedDirection === 'BULLISH' || combinedDirection === 'UP' ? <TrendingUp className="h-5 w-5" /> : combinedDirection === 'BEARISH' || combinedDirection === 'DOWN' ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />;
  const directionColor = combinedDirection === 'BULLISH' || combinedDirection === 'UP' ? 'text-success' : combinedDirection === 'BEARISH' || combinedDirection === 'DOWN' ? 'text-destructive' : 'text-hold';

  if (!user) {
    return (
      <div className="gradient-bg min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card max-w-md p-10 text-center">
            <Brain className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-foreground">Sign in to access AI Predictions</h2>
            <p className="mb-6 text-sm text-muted-foreground">ML-powered stock forecasting engine.</p>
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
          <h1 className="text-2xl font-bold text-foreground">AI Prediction Engine</h1>
          <p className="text-sm text-muted-foreground">Statistical + AI-enhanced stock analysis</p>
        </motion.div>
        <div className="neon-line" />

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-wrap items-center gap-3 p-5">
          <Select value={selectedSymbol} onValueChange={(v) => { setSelectedSymbol(v); setAiPrediction(null); }}>
            <SelectTrigger className="w-[220px] border-border bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-border bg-card">
              {INDIAN_STOCKS.map(s => (
                <SelectItem key={s.symbol} value={s.symbol}>
                  <span className="font-mono text-primary">{s.symbol.replace('.NS', '')}</span>
                  <span className="ml-2 text-muted-foreground">{s.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            {(['combined', 'statistical', 'ai'] as const).map(t => (
              <Button key={t} variant={modelType === t ? 'default' : 'outline'} size="sm"
                onClick={() => setModelType(t)}
                className={modelType === t ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
              >
                {t === 'combined' ? 'Combined' : t === 'statistical' ? 'Statistical' : 'AI Only'}
              </Button>
            ))}
          </div>

          <Button onClick={fetchAIPrediction} disabled={aiLoading || stockLoading || !features} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {aiLoading ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Brain className="mr-1 h-4 w-4" />}
            {aiLoading ? 'Analyzing...' : 'Get AI Prediction'}
          </Button>
        </motion.div>

        {stockLoading ? (
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        ) : features && (
          <>
            {/* Prediction Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <p className="text-xs text-muted-foreground">Direction</p>
                <div className={`mt-1 flex items-center gap-2 text-2xl font-bold ${directionColor}`}>
                  {directionIcon} {combinedDirection}
                </div>
                {aiPrediction && <Badge className="mt-2" variant="outline">{aiPrediction.riskLevel} Risk</Badge>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
                <p className="text-xs text-muted-foreground">Predicted Returns</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Next Day</span>
                    <span className="font-mono font-bold text-foreground">
                      {aiPrediction ? `${aiPrediction.nextDayReturn > 0 ? '+' : ''}${aiPrediction.nextDayReturn.toFixed(2)}%` : statPrediction ? `${statPrediction.predictedReturn > 0 ? '+' : ''}${statPrediction.predictedReturn.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                  {aiPrediction && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">5-Day</span>
                      <span className="font-mono font-bold text-foreground">{aiPrediction.fiveDayReturn > 0 ? '+' : ''}{aiPrediction.fiveDayReturn.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <p className="text-xs text-muted-foreground">Model Metrics</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-mono font-bold text-foreground">{aiPrediction ? aiPrediction.confidence.toFixed(0) : statPrediction?.confidence.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dir. Accuracy</span>
                    <span className="font-mono font-bold text-foreground">{accuracy?.directionalAccuracy.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">RMSE</span>
                    <span className="font-mono font-bold text-foreground">{accuracy?.rmse.toFixed(4) || 0}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* AI Reasoning */}
            {aiPrediction?.reasoning && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Brain className="h-4 w-4 text-accent" /> AI Analysis</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{aiPrediction.reasoning}</p>
              </motion.div>
            )}

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Feature Importance */}
              {featureImportance.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Key Factor Importance</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={featureImportance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <YAxis dataKey="factor" type="category" width={120} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                        {featureImportance.map((entry, i) => (
                          <rect key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Predicted vs Actual */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Predicted vs Actual (Last 20 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={predVsActual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                    <Line dataKey="predicted" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2 }} name="Predicted" />
                    <Line dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Technical Indicators Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Technical Indicator Snapshot</h3>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <IndicatorBadge label="RSI(14)" value={features.rsi14.toFixed(1)} status={features.rsi14 < 30 ? 'oversold' : features.rsi14 > 70 ? 'overbought' : 'neutral'} />
                <IndicatorBadge label="MACD" value={features.macdHistogram.toFixed(4)} status={features.macdHistogram > 0 ? 'bullish' : 'bearish'} />
                <IndicatorBadge label="Volatility" value={`${features.volatility20.toFixed(1)}%`} status={features.volatility20 > 30 ? 'high' : 'normal'} />
                <IndicatorBadge label="Momentum(20d)" value={`${features.momentum20.toFixed(2)}%`} status={features.momentum20 > 0 ? 'bullish' : 'bearish'} />
                <IndicatorBadge label="Bollinger" value={`${features.bollingerWidth.toFixed(1)}%`} status={features.currentPrice > features.bollingerUpper ? 'overbought' : features.currentPrice < features.bollingerLower ? 'oversold' : 'neutral'} />
              </div>
            </motion.div>
          </>
        )}
      </main>
      <Disclaimer />
    </div>
  );
}

function IndicatorBadge({ label, value, status }: { label: string; value: string; status: string }) {
  const colors: Record<string, string> = {
    bullish: 'border-success/30 bg-success/10 text-success',
    bearish: 'border-destructive/30 bg-destructive/10 text-destructive',
    oversold: 'border-success/30 bg-success/10 text-success',
    overbought: 'border-destructive/30 bg-destructive/10 text-destructive',
    neutral: 'border-border bg-muted/50 text-muted-foreground',
    normal: 'border-border bg-muted/50 text-muted-foreground',
    high: 'border-warning/30 bg-warning/10 text-warning',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[status] || colors.neutral}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="font-mono text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-60">{status}</p>
    </div>
  );
}
