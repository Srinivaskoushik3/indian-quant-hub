// Stock metadata: sector classification, market cap, dividend info

export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  marketCap: 'Large Cap' | 'Mid Cap' | 'Small Cap';
  dividendYield: number; // annual %
  nextExDate: string; // ISO date
  annualDividend: number; // per share in INR
}

export const STOCK_METADATA: Record<string, StockMeta> = {
  'RELIANCE.NS': { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', marketCap: 'Large Cap', dividendYield: 0.32, nextExDate: '2026-06-15', annualDividend: 9 },
  'TCS.NS': { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Technology', marketCap: 'Large Cap', dividendYield: 1.25, nextExDate: '2026-05-20', annualDividend: 52 },
  'INFY.NS': { symbol: 'INFY.NS', name: 'Infosys', sector: 'Technology', marketCap: 'Large Cap', dividendYield: 2.1, nextExDate: '2026-05-28', annualDividend: 34 },
  'HDFCBANK.NS': { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Financial Services', marketCap: 'Large Cap', dividendYield: 1.1, nextExDate: '2026-06-10', annualDividend: 19.5 },
  'ICICIBANK.NS': { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Financial Services', marketCap: 'Large Cap', dividendYield: 0.85, nextExDate: '2026-07-05', annualDividend: 10 },
  'HINDUNILVR.NS': { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG', marketCap: 'Large Cap', dividendYield: 1.65, nextExDate: '2026-06-22', annualDividend: 42 },
  'ITC.NS': { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', marketCap: 'Large Cap', dividendYield: 3.2, nextExDate: '2026-05-10', annualDividend: 15.5 },
  'SBIN.NS': { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Financial Services', marketCap: 'Large Cap', dividendYield: 1.8, nextExDate: '2026-05-18', annualDividend: 13.7 },
  'BHARTIARTL.NS': { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', marketCap: 'Large Cap', dividendYield: 0.5, nextExDate: '2026-08-12', annualDividend: 8 },
  'KOTAKBANK.NS': { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Financial Services', marketCap: 'Large Cap', dividendYield: 0.1, nextExDate: '2026-07-20', annualDividend: 2 },
};

export function getStockMeta(symbol: string): StockMeta | undefined {
  return STOCK_METADATA[symbol];
}

export function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    'Technology': 'hsl(199 89% 48%)',
    'Financial Services': 'hsl(142 71% 45%)',
    'Energy': 'hsl(38 92% 50%)',
    'FMCG': 'hsl(280 65% 60%)',
    'Telecom': 'hsl(340 75% 55%)',
  };
  return colors[sector] || 'hsl(215 20% 55%)';
}

export function getMarketCapColor(cap: string): string {
  const colors: Record<string, string> = {
    'Large Cap': 'hsl(142 71% 45%)',
    'Mid Cap': 'hsl(38 92% 50%)',
    'Small Cap': 'hsl(0 72% 51%)',
  };
  return colors[cap] || 'hsl(215 20% 55%)';
}
