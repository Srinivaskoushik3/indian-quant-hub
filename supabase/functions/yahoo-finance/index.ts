import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const validRanges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];
const validIntervals = ['1d', '1wk', '1mo'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { symbol, range = '1y', interval = '1d' } = await req.json();

    // Validate symbol format (Indian NSE stocks only)
    if (!symbol || typeof symbol !== 'string' || !/^[A-Z]+\.NS$/.test(symbol) || symbol.length > 20) {
      return new Response(JSON.stringify({ error: 'Invalid symbol format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate range and interval
    if (!validRanges.includes(range) || !validIntervals.includes(interval)) {
      return new Response(JSON.stringify({ error: 'Invalid range or interval' }), {
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
      console.error(`Yahoo Finance API error [${response.status}]: ${text}`);
      return new Response(JSON.stringify({ error: 'Failed to fetch stock data. Please try again.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return new Response(JSON.stringify({ error: 'No data returned for symbol' }), {
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
    return new Response(JSON.stringify({ error: 'Failed to fetch stock data. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
