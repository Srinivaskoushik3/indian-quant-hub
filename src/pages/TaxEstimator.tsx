import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';
import { calculateCapitalGainsTax, type TaxInput } from '@/lib/taxCalculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Calculator, AlertTriangle, IndianRupee, TrendingUp, Calendar } from 'lucide-react';

export default function TaxEstimator() {
  const [form, setForm] = useState<TaxInput>({
    buyPrice: 0,
    sellPrice: 0,
    quantity: 1,
    buyDate: '2025-01-01',
    sellDate: '2026-02-24',
  });
  const [result, setResult] = useState<ReturnType<typeof calculateCapitalGainsTax> | null>(null);

  const handleCalculate = () => {
    if (form.buyPrice <= 0 || form.sellPrice <= 0 || form.quantity <= 0) return;
    if (new Date(form.sellDate) <= new Date(form.buyDate)) return;
    setResult(calculateCapitalGainsTax(form));
  };

  const updateField = (field: keyof TaxInput, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: field === 'buyDate' || field === 'sellDate' ? value : Math.max(0, parseFloat(value) || 0),
    }));
  };

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Capital Gains Tax Estimator</h1>
          <p className="text-sm text-muted-foreground">Indian Equity · STCG & LTCG Calculator</p>
        </motion.div>

        <div className="neon-line" />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Trade Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Buy Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.buyPrice || ''} onChange={e => updateField('buyPrice', e.target.value)} className="mt-1 border-border bg-secondary/50 font-mono" placeholder="0.00" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sell Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.sellPrice || ''} onChange={e => updateField('sellPrice', e.target.value)} className="mt-1 border-border bg-secondary/50 font-mono" placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <Input type="number" min="1" step="1" value={form.quantity || ''} onChange={e => updateField('quantity', e.target.value)} className="mt-1 border-border bg-secondary/50 font-mono" placeholder="1" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Buy Date</Label>
                  <Input type="date" value={form.buyDate} onChange={e => updateField('buyDate', e.target.value)} className="mt-1 border-border bg-secondary/50 font-mono" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sell Date</Label>
                  <Input type="date" value={form.sellDate} onChange={e => updateField('sellDate', e.target.value)} className="mt-1 border-border bg-secondary/50 font-mono" />
                </div>
              </div>
              <Button onClick={handleCalculate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Calculator className="mr-2 h-4 w-4" /> Calculate Tax
              </Button>
            </div>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* Tax warning */}
              {result.taxImpactPercent > 20 && (
                <div className="glass-card flex items-center gap-3 border-warning/30 bg-warning/5 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                  <p className="text-xs text-warning">
                    Tax consumes <strong>{result.taxImpactPercent.toFixed(1)}%</strong> of your gains. Consider holding for 12+ months to benefit from LTCG rates.
                  </p>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    <span className="text-xs">Gross Profit</span>
                  </div>
                  <p className={`mt-1 font-mono text-xl font-bold ${result.grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ₹{result.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calculator className="h-4 w-4" />
                    <span className="text-xs">Total Tax</span>
                  </div>
                  <p className="mt-1 font-mono text-xl font-bold text-warning">
                    ₹{result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Net Profit</span>
                  </div>
                  <p className={`mt-1 font-mono text-xl font-bold ${result.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ₹{result.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Holding Period</span>
                  </div>
                  <p className="mt-1 font-mono text-xl font-bold text-foreground">{result.holdingDays} days</p>
                  <span className={`text-xs font-semibold ${result.isLongTerm ? 'text-success' : 'text-warning'}`}>
                    {result.isLongTerm ? 'LTCG @ 12.5%' : 'STCG @ 20%'}
                  </span>
                </div>
              </div>

              {/* Tax breakdown */}
              <div className="glass-card p-6">
                <h4 className="mb-4 text-sm font-semibold text-foreground">Tax Breakdown</h4>
                <div className="space-y-2 text-sm">
                  {[
                    ['Buy Value', `₹${result.totalBuyValue.toLocaleString('en-IN')}`],
                    ['Sell Value', `₹${result.totalSellValue.toLocaleString('en-IN')}`],
                    ['Gross Gain', `₹${result.grossProfit.toLocaleString('en-IN')}`],
                    [result.isLongTerm ? 'LTCG Exemption' : '', result.isLongTerm ? '₹1,25,000' : ''],
                    ['Taxable Gain', `₹${result.taxableGain.toLocaleString('en-IN')}`],
                    ['Tax Rate', `${result.taxRate}%`],
                    ['Tax Liability', `₹${result.taxLiability.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
                    ['Cess (4%)', `₹${result.cess.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
                    ['Total Tax', `₹${result.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
                    ['Post-Tax ROI', `${result.postTaxROI.toFixed(2)}%`],
                    ['Effective Tax Rate', `${result.effectiveTaxRate.toFixed(2)}%`],
                  ].filter(([k]) => k).map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-lg bg-secondary/30 px-3 py-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual breakdown */}
              {result.grossProfit > 0 && (
                <div className="glass-card p-6">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Tax Impact Visual</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Net Profit', value: Math.max(0, result.netProfit) },
                            { name: 'Tax', value: result.totalTax },
                          ]}
                          cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value"
                        >
                          <Cell fill="hsl(142 71% 45%)" />
                          <Cell fill="hsl(0 72% 51%)" />
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'hsl(222 40% 10% / 0.95)', border: '1px solid hsl(220 20% 25%)', borderRadius: '12px', color: 'hsl(210 40% 93%)' }}
                          formatter={(val: number) => [`₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" /> Net Profit</div>
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" /> Tax</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Disclaimer />
    </div>
  );
}
