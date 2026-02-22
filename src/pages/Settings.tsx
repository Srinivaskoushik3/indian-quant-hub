import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, Bell, Palette, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      icon: Palette,
      title: 'Display',
      description: 'Customize your experience',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Compact View</p>
              <p className="text-xs text-muted-foreground">Reduce spacing for denser data display</p>
            </div>
            <Switch checked={compactView} onCheckedChange={setCompactView} />
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
            <span className="font-mono text-sm text-foreground">1.0.0</span>
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

        {/* Sign Out */}
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
