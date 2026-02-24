import { generateMockData } from './stockData';
import { calculateVolatility } from './indicators';
import { getStockMeta, STOCK_METADATA } from './stockMetadata';

export interface AllocationItem {
  symbol: string;
  name: string;
  sector: string;
  marketCap: string;
  price: number;
  weight: number;
  value: number;
}

export interface SectorAllocation {
  sector: string;
  weight: number;
  value: number;
  count: number;
}

export interface MarketCapAllocation {
  cap: string;
  weight: number;
  count: number;
}

export interface RiskContribution {
  symbol: string;
  volatility: number;
  contribution: number; // % of total portfolio risk
}

export function computeAllocations(symbols: string[]): AllocationItem[] {
  if (symbols.length === 0) return [];
  const items = symbols.map(sym => {
    const data = generateMockData(sym);
    const price = data.closes[data.closes.length - 1];
    const meta = getStockMeta(sym);
    return {
      symbol: sym,
      name: meta?.name || sym.replace('.NS', ''),
      sector: meta?.sector || 'Unknown',
      marketCap: meta?.marketCap || 'Unknown',
      price,
      weight: 0,
      value: price, // assume 1 share each for demo
    };
  });
  const total = items.reduce((s, i) => s + i.value, 0);
  items.forEach(i => { i.weight = (i.value / total) * 100; });
  return items.sort((a, b) => b.weight - a.weight);
}

export function computeSectorAllocation(items: AllocationItem[]): SectorAllocation[] {
  const map = new Map<string, SectorAllocation>();
  items.forEach(i => {
    const existing = map.get(i.sector) || { sector: i.sector, weight: 0, value: 0, count: 0 };
    existing.weight += i.weight;
    existing.value += i.value;
    existing.count += 1;
    map.set(i.sector, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
}

export function computeMarketCapAllocation(items: AllocationItem[]): MarketCapAllocation[] {
  const map = new Map<string, MarketCapAllocation>();
  items.forEach(i => {
    const existing = map.get(i.marketCap) || { cap: i.marketCap, weight: 0, count: 0 };
    existing.weight += i.weight;
    existing.count += 1;
    map.set(i.marketCap, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
}

export function computeRiskContributions(symbols: string[]): RiskContribution[] {
  const vols = symbols.map(sym => {
    const data = generateMockData(sym);
    return { symbol: sym, volatility: calculateVolatility(data.closes) };
  });
  const totalVol = vols.reduce((s, v) => s + v.volatility, 0);
  return vols.map(v => ({
    ...v,
    contribution: totalVol > 0 ? (v.volatility / totalVol) * 100 : 0,
  })).sort((a, b) => b.contribution - a.contribution);
}

export function computeDiversificationScore(items: AllocationItem[], sectors: SectorAllocation[]): number {
  if (items.length === 0) return 0;

  // Concentration factor (HHI-based) — lower is more diversified
  const hhi = items.reduce((s, i) => s + (i.weight / 100) ** 2, 0);
  const concentrationScore = Math.max(0, (1 - hhi) * 100);

  // Sector spread
  const maxSectors = Object.keys(STOCK_METADATA).reduce((s, k) => {
    s.add(STOCK_METADATA[k].sector);
    return s;
  }, new Set<string>()).size;
  const sectorScore = (sectors.length / maxSectors) * 100;

  // Overexposure penalty
  const maxSectorWeight = Math.max(...sectors.map(s => s.weight), 0);
  const overexposurePenalty = maxSectorWeight > 35 ? (maxSectorWeight - 35) * 2 : 0;

  const raw = (concentrationScore * 0.5 + sectorScore * 0.3 + (100 - overexposurePenalty) * 0.2);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export interface SmartInsight {
  type: 'warning' | 'info' | 'success';
  icon: string;
  title: string;
  description: string;
}

export function generateSmartInsights(
  items: AllocationItem[],
  sectors: SectorAllocation[],
  risks: RiskContribution[],
  diversScore: number
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // Concentration risk
  const topStock = items[0];
  if (topStock && topStock.weight > 30) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Concentration Risk',
      description: `${topStock.symbol.replace('.NS', '')} represents ${topStock.weight.toFixed(1)}% of your portfolio. Consider rebalancing below 30%.`,
    });
  }

  // Sector overexposure
  const topSector = sectors[0];
  if (topSector && topSector.weight > 40) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Sector Overexposure',
      description: `${topSector.sector} makes up ${topSector.weight.toFixed(1)}% of your portfolio. Diversify across more sectors.`,
    });
  }

  // High volatility
  const highVolStock = risks[0];
  if (highVolStock && highVolStock.volatility > 40) {
    insights.push({
      type: 'warning',
      icon: '📉',
      title: 'High Volatility Alert',
      description: `${highVolStock.symbol.replace('.NS', '')} has ${highVolStock.volatility.toFixed(1)}% annualized volatility — highest in your portfolio.`,
    });
  }

  // Low diversification
  if (diversScore < 40) {
    insights.push({
      type: 'warning',
      icon: '🔄',
      title: 'Suggested Rebalancing',
      description: `Your diversification score is ${diversScore}/100. Add stocks from different sectors to improve it.`,
    });
  }

  // Positive insight
  if (diversScore >= 70) {
    insights.push({
      type: 'success',
      icon: '✅',
      title: 'Well Diversified',
      description: `Your portfolio has a strong diversification score of ${diversScore}/100. Keep it up!`,
    });
  }

  if (items.length >= 5) {
    insights.push({
      type: 'info',
      icon: '📊',
      title: 'Portfolio Size',
      description: `You're tracking ${items.length} stocks. A portfolio of 8-15 stocks is generally optimal for diversification.`,
    });
  }

  return insights;
}
