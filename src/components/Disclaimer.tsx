import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="glass-card mx-4 mb-6 flex items-center gap-3 px-5 py-3 text-xs text-muted-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      <p>
        This application is for <strong>educational purposes only</strong>. Not financial advice. 
        Always consult a qualified financial advisor before making investment decisions.
      </p>
    </div>
  );
}
