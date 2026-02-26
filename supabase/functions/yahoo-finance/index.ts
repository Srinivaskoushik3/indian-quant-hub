import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, range = '1y', interval = '1d' } = await req.json();

    if (!symbol || typeof symbol !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid symbol' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from Yahoo Finance v8 chart API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Yahoo Finance API error [${response.status}]: ${text}`);
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return new Response(JSON.stringify({ error: 'No data returned for symbol', symbol }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const dates: string[] = [];
    const opens: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const closes: number[] = [];
    const volumes: number[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      // Skip null data points
      if (quote.close?.[i] == null) continue;
      
      const d = new Date(timestamps[i] * 1000);
      dates.push(d.toISOString().split('T')[0]);
      opens.push(Math.round((quote.open?.[i] ?? 0) * 100) / 100);
      highs.push(Math.round((quote.high?.[i] ?? 0) * 100) / 100);
      lows.push(Math.round((quote.low?.[i] ?? 0) * 100) / 100);
      closes.push(Math.round((quote.close?.[i] ?? 0) * 100) / 100);
      volumes.push(Math.round(quote.volume?.[i] ?? 0));
    }

    const meta = result.meta || {};

    return new Response(JSON.stringify({
      symbol: meta.symbol,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      dates,
      opens,
      highs,
      lows,
      closes,
      volumes,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Yahoo Finance fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
