export interface StockOption {
  symbol: string;
  name: string;
}

export const INDIAN_STOCKS: StockOption[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  { symbol: 'ITC.NS', name: 'ITC Limited' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
];

export interface StockData {
  dates: string[];
  closes: number[];
  highs: number[];
  lows: number[];
  opens: number[];
  volumes: number[];
}

// Generate realistic mock data for demo
export function generateMockData(symbol: string): StockData {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number, i: number) => {
    const x = Math.sin(seed + i * 127.1) * 43758.5453;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const basePrice = 1000 + (seed % 3000);
  const days = 250;
  const dates: string[] = [];
  const closes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const opens: number[] = [];
  const volumes: number[] = [];

  let price = basePrice;
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = rand(-0.03, 0.035, i);
    price = price * (1 + change);
    const open = price * (1 + rand(-0.01, 0.01, i + 1000));
    const high = Math.max(price, open) * (1 + rand(0, 0.015, i + 2000));
    const low = Math.min(price, open) * (1 - rand(0, 0.015, i + 3000));

    dates.push(date.toISOString().split('T')[0]);
    closes.push(Math.round(price * 100) / 100);
    opens.push(Math.round(open * 100) / 100);
    highs.push(Math.round(high * 100) / 100);
    lows.push(Math.round(low * 100) / 100);
    volumes.push(Math.round(rand(500000, 5000000, i + 4000)));
  }

  return { dates, closes, highs, lows, opens, volumes };
}
