/**
 * ML Feature Engineering for Stock Prediction
 * Computes technical indicators as features for the prediction model
 */

export interface StockFeatures {
  sma5: number;
  sma10: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  volumeChange: number;
  volatility10: number;
  volatility20: number;
  momentum5: number;
  momentum10: number;
  momentum20: number;
  priceToSma50: number;
  priceToSma200: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerWidth: number;
  currentPrice: number;
  avgVolume20: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
}

function calcSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  const changes = data.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < changes.length; i++) {
    const diff = changes[i] - changes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcVolatility(data: number[], period: number): number {
  if (data.length < period + 1) return 0;
  const prices = data.slice(-period - 1);
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance * 252) * 100;
}

export function extractFeatures(closes: number[], volumes: number[]): StockFeatures {
  const n = closes.length;
  const lastPrice = closes[n - 1];
  const sma50 = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macd = ema12 - ema26;
  
  // MACD Signal (9-period EMA of MACD values - approximated)
  const macdValues: number[] = [];
  for (let i = Math.max(0, n - 30); i < n; i++) {
    const e12 = calcEMA(closes.slice(0, i + 1), 12);
    const e26 = calcEMA(closes.slice(0, i + 1), 26);
    macdValues.push(e12 - e26);
  }
  const macdSignal = calcEMA(macdValues, 9);
  
  // Bollinger Bands
  const sma20 = calcSMA(closes, 20);
  const last20 = closes.slice(-20);
  const std20 = Math.sqrt(last20.reduce((a, p) => a + (p - sma20) ** 2, 0) / 20);
  
  return {
    sma5: calcSMA(closes, 5),
    sma10: calcSMA(closes, 10),
    sma20: sma20,
    sma50: sma50,
    ema12,
    ema26,
    rsi14: calcRSI(closes, 14),
    macd,
    macdSignal,
    macdHistogram: macd - macdSignal,
    volumeChange: volumes.length >= 2 ? (volumes[n - 1] - volumes[n - 2]) / volumes[n - 2] * 100 : 0,
    volatility10: calcVolatility(closes, 10),
    volatility20: calcVolatility(closes, 20),
    momentum5: n >= 6 ? (lastPrice - closes[n - 6]) / closes[n - 6] * 100 : 0,
    momentum10: n >= 11 ? (lastPrice - closes[n - 11]) / closes[n - 11] * 100 : 0,
    momentum20: n >= 21 ? (lastPrice - closes[n - 21]) / closes[n - 21] * 100 : 0,
    priceToSma50: (lastPrice / sma50 - 1) * 100,
    priceToSma200: (lastPrice / sma200 - 1) * 100,
    bollingerUpper: sma20 + 2 * std20,
    bollingerLower: sma20 - 2 * std20,
    bollingerWidth: (4 * std20) / sma20 * 100,
    currentPrice: lastPrice,
    avgVolume20: calcSMA(volumes.map(v => v), 20),
    dailyReturn: n >= 2 ? (lastPrice - closes[n - 2]) / closes[n - 2] * 100 : 0,
    weeklyReturn: n >= 6 ? (lastPrice - closes[n - 6]) / closes[n - 6] * 100 : 0,
    monthlyReturn: n >= 22 ? (lastPrice - closes[n - 22]) / closes[n - 22] * 100 : 0,
  };
}

/** Simple statistical linear regression prediction */
export function statisticalPredict(closes: number[]): {
  predictedReturn: number;
  confidence: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
} {
  if (closes.length < 30) return { predictedReturn: 0, confidence: 0, direction: 'NEUTRAL' };
  
  // Use momentum + mean reversion signals
  const momentum5 = (closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6];
  const momentum20 = (closes[closes.length - 1] - closes[closes.length - 21]) / closes[closes.length - 21];
  const rsi = calcRSI(closes);
  
  // Mean reversion component
  const sma50 = calcSMA(closes, 50);
  const deviation = (closes[closes.length - 1] - sma50) / sma50;
  
  // Composite signal
  let signal = 0;
  signal += momentum5 > 0 ? 0.3 : -0.3;
  signal += momentum20 > 0 ? 0.2 : -0.2;
  signal += rsi < 30 ? 0.3 : rsi > 70 ? -0.3 : 0;
  signal += deviation < -0.05 ? 0.2 : deviation > 0.05 ? -0.2 : 0;
  
  const predictedReturn = signal * 2; // Scale to approximate % return
  const confidence = Math.min(Math.abs(signal) * 100, 85);
  const direction = signal > 0.1 ? 'UP' : signal < -0.1 ? 'DOWN' : 'NEUTRAL';
  
  return { predictedReturn, confidence, direction };
}

/** Compute recent model accuracy using walk-forward evaluation */
export function evaluateAccuracy(closes: number[], lookback: number = 30): {
  directionalAccuracy: number;
  rmse: number;
  mae: number;
} {
  if (closes.length < lookback + 30) return { directionalAccuracy: 50, rmse: 0, mae: 0 };
  
  let correct = 0;
  let totalSqErr = 0;
  let totalAbsErr = 0;
  const testCount = lookback;
  
  for (let i = 0; i < testCount; i++) {
    const endIdx = closes.length - testCount + i;
    const trainData = closes.slice(0, endIdx);
    const actualReturn = (closes[endIdx] - closes[endIdx - 1]) / closes[endIdx - 1] * 100;
    const prediction = statisticalPredict(trainData);
    
    if ((prediction.predictedReturn > 0 && actualReturn > 0) || (prediction.predictedReturn < 0 && actualReturn < 0)) {
      correct++;
    }
    totalSqErr += (prediction.predictedReturn - actualReturn) ** 2;
    totalAbsErr += Math.abs(prediction.predictedReturn - actualReturn);
  }
  
  return {
    directionalAccuracy: (correct / testCount) * 100,
    rmse: Math.sqrt(totalSqErr / testCount),
    mae: totalAbsErr / testCount,
  };
}
