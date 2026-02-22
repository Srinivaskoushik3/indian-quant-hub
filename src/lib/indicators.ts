export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
      continue;
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

export type Recommendation = 'BUY' | 'SELL' | 'HOLD';

export function getRecommendation(sma50: number | null, sma200: number | null, rsi: number | null): Recommendation {
  if (sma50 === null || sma200 === null || rsi === null) return 'HOLD';
  
  if (sma50 > sma200 && rsi < 70) return 'BUY';
  if (sma50 < sma200 && rsi > 30) return 'SELL';
  return 'HOLD';
}

export function calculateTotalReturn(prices: number[]): number {
  if (prices.length < 2) return 0;
  return ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
}

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance * 252) * 100; // Annualized
}

export function calculateSharpeRatio(prices: number[], riskFreeRate: number = 0.065): number {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualReturn = meanReturn * 252;
  const stdDev = Math.sqrt(returns.reduce((a, r) => a + (r - meanReturn) ** 2, 0) / returns.length) * Math.sqrt(252);
  if (stdDev === 0) return 0;
  return (annualReturn - riskFreeRate) / stdDev;
}

export function calculateMaxDrawdown(prices: number[]): number {
  let maxDD = 0;
  let peak = prices[0];
  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = (peak - price) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100;
}
