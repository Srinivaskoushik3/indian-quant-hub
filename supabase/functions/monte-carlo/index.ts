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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
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

    // Validate numeric inputs
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
    
    const finalValues: number[] = [];
    const maxDrawdowns: number[] = [];
    const samplePaths: number[][] = [];
    const allDaily: number[][] = Array.from({ length: horizon + 1 }, () => []);
    
    const count = Math.min(simCount, 10000);
    
    for (let sim = 0; sim < count; sim++) {
      let value = initialValue;
      let peak = initialValue;
      let maxDD = 0;
      const path = sim < 100 ? [initialValue] : null;
      
      for (let day = 1; day <= horizon; day++) {
        value = value * Math.exp(drift + diffusion * randn());
        if (value > peak) peak = value;
        const dd = (peak - value) / peak;
        if (dd > maxDD) maxDD = dd;
        if (path) path.push(value);
        allDaily[day].push(value);
      }
      allDaily[0].push(initialValue);
      
      if (path) samplePaths.push(path);
      finalValues.push(value);
      maxDrawdowns.push(maxDD);
    }
    
    const sorted = [...finalValues].sort((a, b) => a - b);
    const returns = finalValues.map(v => (v - initialValue) / initialValue * 100);
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const pIdx = (p: number) => Math.floor(p * sorted.length);
    
    const worst5 = sortedReturns.slice(0, pIdx(0.05));
    
    const p5: number[] = [], p50: number[] = [], p95: number[] = [];
    for (let d = 0; d <= horizon; d++) {
      const dv = [...allDaily[d]].sort((a, b) => a - b);
      p5.push(dv[pIdx(0.05)] ?? initialValue);
      p50.push(dv[pIdx(0.5)] ?? initialValue);
      p95.push(dv[pIdx(0.95)] ?? initialValue);
    }
    
    const metrics = {
      var95: -sortedReturns[pIdx(0.05)],
      var99: -sortedReturns[pIdx(0.01)],
      cvar95: worst5.length > 0 ? -(worst5.reduce((a, b) => a + b, 0) / worst5.length) : 0,
      probNegative: returns.filter(r => r < 0).length / returns.length * 100,
      worst5pct: sortedReturns[pIdx(0.05)],
      medianReturn: sortedReturns[pIdx(0.5)],
      best5pct: sortedReturns[pIdx(0.95)],
      maxDrawdownMean: maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length * 100,
      meanFinalValue: finalValues.reduce((a, b) => a + b, 0) / finalValues.length,
    };
    
    return new Response(JSON.stringify({
      samplePaths,
      finalValues: sorted,
      metrics,
      percentilePaths: { p5, p50, p95 },
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
