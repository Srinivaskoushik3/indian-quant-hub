import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Box-Muller transform */
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Insert value into sorted array (for running percentiles) */
function insertSorted(arr: number[], val: number) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < val) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, val);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { initialValue, mu, sigma, simCount, horizon } = await req.json();

    if (typeof initialValue !== 'number' || typeof mu !== 'number' || typeof sigma !== 'number' ||
        typeof simCount !== 'number' || typeof horizon !== 'number' ||
        initialValue <= 0 || simCount < 1 || simCount > 10000 || horizon < 1 || horizon > 504) {
      return new Response(JSON.stringify({ error: 'Invalid simulation parameters' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dt = 1 / 252;
    const drift = (mu - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt);

    // Cap server simulations to avoid CPU timeout
    const count = Math.min(simCount, 2000);
    const maxSamplePaths = 50;

    // Only sample percentiles at evenly-spaced days to avoid O(n*m) memory
    const percentileStep = Math.max(1, Math.floor(horizon / 100));
    const percentileDays: number[] = [];
    for (let d = 0; d <= horizon; d += percentileStep) percentileDays.push(d);
    if (percentileDays[percentileDays.length - 1] !== horizon) percentileDays.push(horizon);

    // Collect values at percentile days using reservoir approach
    const dayValues: number[][] = percentileDays.map(() => []);

    const finalValues: number[] = [];
    const maxDrawdowns: number[] = [];
    const samplePaths: number[][] = [];

    for (let sim = 0; sim < count; sim++) {
      let value = initialValue;
      let peak = initialValue;
      let maxDD = 0;
      const collectPath = sim < maxSamplePaths;
      const path: number[] = collectPath ? [initialValue] : [];
      let pIdx = 1; // next percentile day index to check (skip day 0)

      for (let day = 1; day <= horizon; day++) {
        value = value * Math.exp(drift + diffusion * randn());
        if (value > peak) peak = value;
        const dd = (peak - value) / peak;
        if (dd > maxDD) maxDD = dd;
        if (collectPath) path.push(value);

        // Collect for percentile computation
        if (pIdx < percentileDays.length && day === percentileDays[pIdx]) {
          dayValues[pIdx].push(value);
          pIdx++;
        }
      }

      // Day 0
      dayValues[0].push(initialValue);

      if (collectPath) samplePaths.push(path);
      finalValues.push(value);
      maxDrawdowns.push(maxDD);
    }

    const sorted = [...finalValues].sort((a, b) => a - b);
    const returns = finalValues.map(v => (v - initialValue) / initialValue * 100);
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const pctIdx = (p: number) => Math.min(Math.floor(p * sorted.length), sorted.length - 1);

    const worst5 = sortedReturns.slice(0, pctIdx(0.05) + 1);

    // Compute percentile paths
    const p5: number[] = [], p50: number[] = [], p95: number[] = [];
    for (let i = 0; i < percentileDays.length; i++) {
      const dv = dayValues[i].sort((a, b) => a - b);
      const len = dv.length;
      p5.push(dv[Math.floor(0.05 * len)] ?? initialValue);
      p50.push(dv[Math.floor(0.5 * len)] ?? initialValue);
      p95.push(dv[Math.floor(0.95 * len)] ?? initialValue);
    }

    const metrics = {
      var95: -sortedReturns[pctIdx(0.05)],
      var99: -sortedReturns[pctIdx(0.01)],
      cvar95: worst5.length > 0 ? -(worst5.reduce((a, b) => a + b, 0) / worst5.length) : 0,
      probNegative: returns.filter(r => r < 0).length / returns.length * 100,
      worst5pct: sortedReturns[pctIdx(0.05)],
      medianReturn: sortedReturns[pctIdx(0.5)],
      best5pct: sortedReturns[pctIdx(0.95)],
      maxDrawdownMean: maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length * 100,
      meanFinalValue: finalValues.reduce((a, b) => a + b, 0) / finalValues.length,
    };

    return new Response(JSON.stringify({
      samplePaths,
      finalValues: sorted,
      metrics,
      percentilePaths: { p5, p50, p95 },
      percentileDays,
      actualSimCount: count,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monte-carlo error:", e);
    return new Response(JSON.stringify({ error: "Simulation failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
