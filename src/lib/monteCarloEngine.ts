/**
 * Monte Carlo Simulation Engine using Geometric Brownian Motion (GBM)
 * 
 * dS = μSdt + σSdW
 * Discrete: S(t+1) = S(t) × exp[(μ − ½σ²)Δt + σ√Δt × Z]
 */

export interface SimulationParams {
  initialValue: number;
  mu: number;        // expected annual return
  sigma: number;     // annual volatility
  simCount: number;  // number of simulations
  horizon: number;   // trading days
  confidenceLevel: number; // e.g. 0.95
}

export interface SimulationPath {
  values: number[];  // daily values
}

export interface SimulationResult {
  paths: SimulationPath[];
  finalValues: number[];
  metrics: RiskMetrics;
  percentilePaths: {
    p5: number[];
    p50: number[];
    p95: number[];
  };
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  probNegative: number;
  worst5pct: number;
  medianReturn: number;
  best5pct: number;
  maxDrawdownMean: number;
  meanFinalValue: number;
  stdFinalValue: number;
}

/** Box-Muller transform for standard normal */
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Estimate parameters from historical prices */
export function estimateParams(prices: number[]): { mu: number; sigma: number } {
  if (prices.length < 2) return { mu: 0, sigma: 0.2 };
  
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    logReturns.push(Math.log(prices[i] / prices[i - 1]));
  }
  
  const meanDaily = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance = logReturns.reduce((a, r) => a + (r - meanDaily) ** 2, 0) / logReturns.length;
  const sigmaDaily = Math.sqrt(variance);
  
  return {
    mu: meanDaily * 252,        // annualized
    sigma: sigmaDaily * Math.sqrt(252), // annualized
  };
}

/** Run Monte Carlo simulation */
export function runSimulation(params: SimulationParams): SimulationResult {
  const { initialValue, mu, sigma, simCount, horizon } = params;
  const dt = 1 / 252;
  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);
  
  const paths: SimulationPath[] = [];
  const finalValues: number[] = [];
  const maxDrawdowns: number[] = [];
  
  // Store all daily values for percentile paths
  const allDailyValues: number[][] = Array.from({ length: horizon + 1 }, () => []);
  
  for (let sim = 0; sim < simCount; sim++) {
    const values: number[] = [initialValue];
    let peak = initialValue;
    let maxDD = 0;
    
    for (let day = 1; day <= horizon; day++) {
      const z = randn();
      const prevValue = values[day - 1];
      const nextValue = prevValue * Math.exp(drift + diffusion * z);
      values.push(nextValue);
      
      if (nextValue > peak) peak = nextValue;
      const dd = (peak - nextValue) / peak;
      if (dd > maxDD) maxDD = dd;
      
      allDailyValues[day].push(nextValue);
    }
    allDailyValues[0].push(initialValue);
    
    // Only store subset of paths for visualization (max 200)
    if (sim < 200) {
      paths.push({ values });
    }
    
    finalValues.push(values[horizon]);
    maxDrawdowns.push(maxDD);
  }
  
  // Sort for percentile calculations
  const sorted = [...finalValues].sort((a, b) => a - b);
  const returns = finalValues.map(v => (v - initialValue) / initialValue * 100);
  const sortedReturns = [...returns].sort((a, b) => a - b);
  
  const percentileIdx = (p: number) => Math.floor(p * sorted.length);
  
  // VaR = loss at percentile
  const var95 = -sortedReturns[percentileIdx(0.05)];
  const var99 = -sortedReturns[percentileIdx(0.01)];
  
  // CVaR = mean of worst losses
  const worst5pctReturns = sortedReturns.slice(0, percentileIdx(0.05));
  const cvar95 = worst5pctReturns.length > 0
    ? -worst5pctReturns.reduce((a, b) => a + b, 0) / worst5pctReturns.length
    : 0;
  
  const probNegative = returns.filter(r => r < 0).length / returns.length * 100;
  const worst5pct = sortedReturns[percentileIdx(0.05)];
  const medianReturn = sortedReturns[percentileIdx(0.5)];
  const best5pct = sortedReturns[percentileIdx(0.95)];
  const maxDrawdownMean = maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length * 100;
  const meanFinalValue = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
  const stdFinalValue = Math.sqrt(finalValues.reduce((a, v) => a + (v - meanFinalValue) ** 2, 0) / finalValues.length);
  
  // Percentile paths
  const p5: number[] = [];
  const p50: number[] = [];
  const p95: number[] = [];
  for (let day = 0; day <= horizon; day++) {
    const dayValues = [...allDailyValues[day]].sort((a, b) => a - b);
    p5.push(dayValues[percentileIdx(0.05)] ?? initialValue);
    p50.push(dayValues[percentileIdx(0.5)] ?? initialValue);
    p95.push(dayValues[percentileIdx(0.95)] ?? initialValue);
  }
  
  return {
    paths,
    finalValues,
    metrics: {
      var95,
      var99,
      cvar95,
      probNegative,
      worst5pct,
      medianReturn,
      best5pct,
      maxDrawdownMean,
      meanFinalValue,
      stdFinalValue,
    },
    percentilePaths: { p5, p50, p95 },
  };
}

/** Estimate portfolio-level params from multiple stock data */
export function estimatePortfolioParams(
  stockPrices: Map<string, number[]>
): { mu: number; sigma: number; currentValue: number } {
  const symbols = Array.from(stockPrices.keys());
  if (symbols.length === 0) return { mu: 0.1, sigma: 0.2, currentValue: 100000 };
  
  // Equal-weight portfolio
  const weight = 1 / symbols.length;
  let portfolioMu = 0;
  let portfolioVariance = 0;
  let currentValue = 0;
  
  const allParams: { mu: number; sigma: number }[] = [];
  
  for (const sym of symbols) {
    const prices = stockPrices.get(sym)!;
    const params = estimateParams(prices);
    allParams.push(params);
    portfolioMu += weight * params.mu;
    portfolioVariance += (weight * params.sigma) ** 2; // simplified, ignores correlation
    currentValue += prices[prices.length - 1] * 100; // assume 100 shares each
  }
  
  return {
    mu: portfolioMu,
    sigma: Math.sqrt(portfolioVariance),
    currentValue,
  };
}
