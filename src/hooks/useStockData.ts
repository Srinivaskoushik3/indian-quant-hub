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

export function useStockData(symbol: string): UseStockDataResult {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!symbol) return;

    // Check cache
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setIsLive(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('yahoo-finance', {
        body: { symbol, range: '1y', interval: '1d' },
      });

      if (fnError) throw fnError;

      if (response?.error) {
        throw new Error(response.error);
      }

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
        setData(stockData);
        setIsLive(true);
      } else {
        throw new Error('No data');
      }
    } catch (err) {
      console.warn(`Live data unavailable for ${symbol}, using mock data:`, err);
      setData(generateMockData(symbol));
      setIsLive(false);
      setError('Using simulated data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, isLive };
}
