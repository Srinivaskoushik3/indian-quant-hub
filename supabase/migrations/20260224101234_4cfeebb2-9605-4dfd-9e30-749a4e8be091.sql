-- Explicitly deny UPDATE and DELETE on trade_logs to protect audit trail
CREATE POLICY "Deny trade_logs update"
ON public.trade_logs
FOR UPDATE
USING (false);

CREATE POLICY "Deny trade_logs delete"
ON public.trade_logs
FOR DELETE
USING (false);