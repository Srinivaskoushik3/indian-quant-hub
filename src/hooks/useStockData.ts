import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateMockData, type StockData } from '@/lib/stockData';

interface UseStockDataResult {
  data: StockData | null;
  loading: boolean;
  error: string | null;
  isLive: boolean;
}

const cache = new Map<string, { data: StockData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchStockData(symbol: string): Promise<{ data: StockData; isLive: boolean }> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: cached.data, isLive: true };
  }

  try {
    const { data: response, error: fnError } = await supabase.functions.invoke('yahoo-finance', {
      body: { symbol, range: '1y', interval: '1d' },
    });

    if (fnError) throw fnError;
    if (response?.error) throw new Error(response.error);

    if (response?.closes?.length > 0) {
      const stockData: StockData = {
        dates: response.dates,
        opens: response.opens,
        highs: response.highs,
        lows: response.lows,
        closes: response.closes,
        volumes: response.volumes,
      };
      cache.set(symbol, { data: stockData, timestamp: Date.now() });
      return { data: stockData, isLive: true };
    }
    throw new Error('No data');
  } catch (err) {
    console.warn(`Live data unavailable for ${symbol}, using mock:`, err);
    return { data: generateMockData(symbol), isLive: false };
  }
}

export function useStockData(symbol: string): UseStockDataResult {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    const result = await fetchStockData(symbol);
    setData(result.data);
    setIsLive(result.isLive);
    if (!result.isLive) setError('Using simulated data');
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, isLive };
}

/** Fetch data for multiple symbols, returns a map of symbol -> StockData */
export function useMultiStockData(symbols: string[]): {
  dataMap: Map<string, StockData>;
  loading: boolean;
  isLive: boolean;
} {
  const [dataMap, setDataMap] = useState<Map<string, StockData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Stable key for symbols array
  const symbolsKey = symbols.slice().sort().join(',');

  useEffect(() => {
    if (symbols.length === 0) {
      setDataMap(new Map());
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(symbols.map(s => fetchStockData(s).then(r => [s, r] as const)))
      .then(results => {
        if (cancelled) return;
        const map = new Map<string, StockData>();
        let anyLive = false;
        for (const [sym, result] of results) {
          map.set(sym, result.data);
          if (result.isLive) anyLive = true;
        }
        setDataMap(map);
        setIsLive(anyLive);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbolsKey]);

  return { dataMap, loading, isLive };
}
