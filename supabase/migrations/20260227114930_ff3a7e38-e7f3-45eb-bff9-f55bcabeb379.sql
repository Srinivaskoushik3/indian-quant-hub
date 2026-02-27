CREATE TABLE public.monte_carlo_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  symbols TEXT[] NOT NULL,
  simulation_count INTEGER NOT NULL DEFAULT 1000,
  time_horizon INTEGER NOT NULL DEFAULT 252,
  confidence_level NUMERIC NOT NULL DEFAULT 0.95,
  var_95 NUMERIC,
  var_99 NUMERIC,
  cvar_95 NUMERIC,
  prob_negative NUMERIC,
  worst_5pct NUMERIC,
  median_return NUMERIC,
  best_5pct NUMERIC,
  max_drawdown_mean NUMERIC,
  initial_value NUMERIC,
  simulation_params JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.monte_carlo_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own mc snapshots" ON public.monte_carlo_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own mc snapshots" ON public.monte_carlo_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mc snapshots" ON public.monte_carlo_snapshots FOR DELETE USING (auth.uid() = user_id);