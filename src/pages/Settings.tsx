import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, Bell, Palette, Info, Monitor, Zap, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useTheme, type UXMode } from '@/contexts/ThemeContext';

const modeOptions: { mode: UXMode; label: string; description: string; icon: typeof Monitor }[] = [
  { mode: 'beginner', label: 'Beginner', description: 'Simplified charts, helpful tooltips', icon: Info },
  { mode: 'pro', label: 'Pro', description: 'Compact layout, advanced metrics', icon: Zap },
  { mode: 'dark', label: 'Dark', description: 'Premium dark gradient theme', icon: Moon },
  { mode: 'light', label: 'Light', description: 'Clean white theme', icon: Sun },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
    navigate('/');
  };

  if (!user) {
    return (
      <div className="gradient-bg min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card max-w-md p-10 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-xl font-bold text-foreground">Sign in to access Settings</h2>
            <p className="mb-6 text-sm text-muted-foreground">Manage your account and preferences.</p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/auth">Sign In</a>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const sections = [
    {
      icon: User,
      title: 'Account',
      description: 'Your account information',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="font-mono text-sm text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Member since</span>
            <span className="text-sm text-foreground">{new Date(user.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{user.id.slice(0, 12)}...</span>
          </div>
        </div>
      ),
    },
    {
      icon: Palette,
      title: 'Dashboard Mode',
      description: 'Switch between UX modes',
      content: (
        <div className="grid gap-2 sm:grid-cols-2">
          {modeOptions.map(opt => {
            const isActive = mode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => setMode(opt.mode)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30 text-primary'
                    : 'bg-secondary/30 border border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <opt.icon className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-[11px] opacity-70">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure alert preferences',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Trade Signals</p>
              <p className="text-xs text-muted-foreground">Get notified when new signals are generated</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Price Alerts</p>
              <p className="text-xs text-muted-foreground">Notify on significant price movements</p>
            </div>
            <Switch checked={true} />
          </div>
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Manage account security',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Email Verified</p>
              <p className="text-xs text-muted-foreground">Your email has been confirmed</p>
            </div>
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Verified</span>
          </div>
        </div>
      ),
    },
    {
      icon: Info,
      title: 'About',
      description: 'Application information',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="font-mono text-sm text-foreground">2.0.0</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Strategy</span>
            <span className="text-sm text-foreground">SMA Crossover + RSI</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account & preferences</p>
        </motion.div>

        <div className="neon-line" />

        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <section.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </div>
            {section.content}
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button onClick={handleSignOut} variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </motion.div>
      </main>
      <Disclaimer />
    </div>
  );
}
