import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { symbol, features, statisticalPrediction, accuracy } = await req.json();

    if (!symbol || typeof symbol !== 'string' || !features || !statisticalPrediction || !accuracy) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'AI service unavailable. Please try again later.' }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an expert quantitative analyst. Analyze these technical indicators for ${symbol} and provide a structured trading prediction.

CURRENT TECHNICAL INDICATORS:
- Price: ₹${features.currentPrice?.toFixed(2)}
- SMA 5/10/20/50: ${features.sma5?.toFixed(2)} / ${features.sma10?.toFixed(2)} / ${features.sma20?.toFixed(2)} / ${features.sma50?.toFixed(2)}
- EMA 12/26: ${features.ema12?.toFixed(2)} / ${features.ema26?.toFixed(2)}
- RSI(14): ${features.rsi14?.toFixed(2)}
- MACD: ${features.macd?.toFixed(4)} | Signal: ${features.macdSignal?.toFixed(4)} | Histogram: ${features.macdHistogram?.toFixed(4)}
- Bollinger Width: ${features.bollingerWidth?.toFixed(2)}%
- Volatility (10d/20d): ${features.volatility10?.toFixed(2)}% / ${features.volatility20?.toFixed(2)}%
- Momentum (5d/10d/20d): ${features.momentum5?.toFixed(2)}% / ${features.momentum10?.toFixed(2)}% / ${features.momentum20?.toFixed(2)}%
- Price vs SMA50: ${features.priceToSma50?.toFixed(2)}%
- Price vs SMA200: ${features.priceToSma200?.toFixed(2)}%
- Volume Change: ${features.volumeChange?.toFixed(2)}%
- Daily/Weekly/Monthly Return: ${features.dailyReturn?.toFixed(2)}% / ${features.weeklyReturn?.toFixed(2)}% / ${features.monthlyReturn?.toFixed(2)}%

STATISTICAL MODEL OUTPUT:
- Predicted Return: ${statisticalPrediction.predictedReturn?.toFixed(3)}%
- Statistical Confidence: ${statisticalPrediction.confidence?.toFixed(1)}%
- Direction: ${statisticalPrediction.direction}
- Directional Accuracy (30d backtest): ${accuracy.directionalAccuracy?.toFixed(1)}%

Provide your analysis considering trend, momentum, mean-reversion, and volatility factors. Be specific about what the indicators suggest.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a quantitative analyst AI. Return structured predictions." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "stock_prediction",
              description: "Return a structured stock prediction with confidence.",
              parameters: {
                type: "object",
                properties: {
                  direction: { type: "string", enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
                  nextDayReturn: { type: "number", description: "Predicted next-day return in percent" },
                  fiveDayReturn: { type: "number", description: "Predicted 5-day return in percent" },
                  confidence: { type: "number", description: "Confidence score 0-100" },
                  probPositive: { type: "number", description: "Probability of positive return 0-100" },
                  keyFactors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        impact: { type: "string", enum: ["POSITIVE", "NEGATIVE", "NEUTRAL"] },
                        weight: { type: "number", description: "Importance 0-100" },
                      },
                      required: ["factor", "impact", "weight"],
                    },
                  },
                  reasoning: { type: "string", description: "Brief analysis reasoning" },
                  riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                },
                required: ["direction", "nextDayReturn", "fiveDayReturn", "confidence", "probPositive", "keyFactors", "reasoning", "riskLevel"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "stock_prediction" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI prediction failed. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const prediction = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ prediction, source: "ai" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("No structured output from AI");
    return new Response(JSON.stringify({ error: "AI prediction failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ml-predict error:", e);
    return new Response(JSON.stringify({ error: "Prediction failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
