-- Fix 1: Add missing UPDATE policy on watchlist
CREATE POLICY "Users can update own watchlist" 
ON public.watchlist 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add CHECK constraints for stock symbol validation
ALTER TABLE public.watchlist 
ADD CONSTRAINT valid_stock_symbol 
CHECK (stock_symbol ~ '^[A-Z]+\.NS$' AND length(stock_symbol) <= 20);

ALTER TABLE public.trade_logs 
ADD CONSTRAINT valid_trade_stock_symbol 
CHECK (stock_symbol ~ '^[A-Z]+\.NS$' AND length(stock_symbol) <= 20);
