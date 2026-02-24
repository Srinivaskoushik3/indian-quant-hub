
-- Dashboard preferences for UX mode & widget config
CREATE TABLE public.dashboard_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ux_mode TEXT NOT NULL DEFAULT 'pro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_ux_mode CHECK (ux_mode IN ('beginner', 'pro', 'dark', 'light'))
);

ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.dashboard_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.dashboard_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.dashboard_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Weekly snapshots
CREATE TABLE public.weekly_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_return NUMERIC,
  best_stock TEXT,
  worst_stock TEXT,
  portfolio_volatility NUMERIC,
  sharpe_ratio NUMERIC,
  snapshot_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots" ON public.weekly_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON public.weekly_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dividend records
CREATE TABLE public.dividend_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL,
  dividend_amount NUMERIC NOT NULL DEFAULT 0,
  ex_date DATE,
  payment_date DATE,
  dividend_yield NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dividend_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dividends" ON public.dividend_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dividends" ON public.dividend_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dividends" ON public.dividend_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dividends" ON public.dividend_records FOR DELETE USING (auth.uid() = user_id);

-- Tax simulations
CREATE TABLE public.tax_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL,
  buy_price NUMERIC NOT NULL,
  sell_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  buy_date DATE NOT NULL,
  sell_date DATE NOT NULL,
  stcg NUMERIC,
  ltcg NUMERIC,
  tax_liability NUMERIC,
  net_profit NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax sims" ON public.tax_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax sims" ON public.tax_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax sims" ON public.tax_simulations FOR DELETE USING (auth.uid() = user_id);

-- Unique constraint for dashboard_preferences per user
CREATE UNIQUE INDEX idx_dashboard_preferences_user ON public.dashboard_preferences(user_id);

-- Updated_at trigger for dashboard_preferences
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dashboard_preferences_updated_at
BEFORE UPDATE ON public.dashboard_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
