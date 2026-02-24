import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UXMode = 'beginner' | 'pro' | 'dark' | 'light';

interface ThemeContextType {
  mode: UXMode;
  setMode: (m: UXMode) => void;
  isBeginner: boolean;
  isPro: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  setMode: () => {},
  isBeginner: false,
  isPro: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UXMode>('dark');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load preference from DB
  useEffect(() => {
    if (!userId) return;
    supabase.from('dashboard_preferences').select('ux_mode').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (data?.ux_mode) setModeState(data.ux_mode as UXMode);
      });
  }, [userId]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-beginner', 'theme-pro', 'theme-dark', 'theme-light');
    root.classList.add(`theme-${mode}`);
  }, [mode]);

  const setMode = async (m: UXMode) => {
    setModeState(m);
    if (!userId) return;
    await supabase.from('dashboard_preferences').upsert(
      { user_id: userId, ux_mode: m },
      { onConflict: 'user_id' }
    );
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, isBeginner: mode === 'beginner', isPro: mode === 'pro' || mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
