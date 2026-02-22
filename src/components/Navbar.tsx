import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Briefcase, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/', icon: BarChart3 },
  { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card sticky top-0 z-50 mx-4 mt-4 flex items-center justify-between px-6 py-3"
    >
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          Quant<span className="text-gradient">Edge</span>
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
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
      </div>
    </motion.nav>
  );
}
