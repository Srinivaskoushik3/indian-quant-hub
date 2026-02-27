import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Briefcase, Settings, User, Menu, X, Activity, Brain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { label: 'Dashboard', path: '/', icon: BarChart3 },
  { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
  { label: 'Risk Lab', path: '/monte-carlo', icon: Activity },
  { label: 'AI Predict', path: '/ml-predictions', icon: Brain },
  { label: 'Tax', path: '/tax', icon: TrendingUp },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card sticky top-0 z-50 mx-4 mt-4 px-6 py-3"
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Quant<span className="text-gradient">Edge</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Auth indicator */}
          {user ? (
            <Link to="/settings" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/auth" className="ml-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-muted-foreground sm:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 flex flex-col gap-1 border-t border-border pt-3 sm:hidden">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {!user && (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="mt-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
              Sign In
            </Link>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
}
