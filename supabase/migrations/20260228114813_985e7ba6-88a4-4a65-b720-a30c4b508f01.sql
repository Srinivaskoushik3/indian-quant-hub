CREATE POLICY "Users can delete own snapshots"
  ON public.weekly_snapshots
  FOR DELETE
  USING (auth.uid() = user_id);