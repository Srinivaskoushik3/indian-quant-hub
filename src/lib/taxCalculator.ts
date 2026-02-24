// Indian Equity Capital Gains Tax Calculator (FY 2025-26 rules)

export interface TaxInput {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  buyDate: string; // ISO date
  sellDate: string; // ISO date
}

export interface TaxResult {
  totalBuyValue: number;
  totalSellValue: number;
  grossProfit: number;
  holdingDays: number;
  isLongTerm: boolean;
  stcg: number;
  ltcg: number;
  taxableGain: number;
  taxRate: number;
  taxLiability: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  netProfit: number;
  effectiveTaxRate: number;
  postTaxROI: number;
  taxImpactPercent: number; // % of gains consumed by tax
}

export function calculateCapitalGainsTax(input: TaxInput): TaxResult {
  const totalBuyValue = input.buyPrice * input.quantity;
  const totalSellValue = input.sellPrice * input.quantity;
  const grossProfit = totalSellValue - totalBuyValue;

  const buyDate = new Date(input.buyDate);
  const sellDate = new Date(input.sellDate);
  const holdingDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
  const isLongTerm = holdingDays >= 365;

  let stcg = 0;
  let ltcg = 0;
  let taxRate = 0;
  let taxableGain = 0;

  if (grossProfit <= 0) {
    // Loss — no tax
    return {
      totalBuyValue, totalSellValue, grossProfit, holdingDays, isLongTerm,
      stcg: 0, ltcg: 0, taxableGain: 0, taxRate: 0,
      taxLiability: 0, surcharge: 0, cess: 0, totalTax: 0,
      netProfit: grossProfit, effectiveTaxRate: 0,
      postTaxROI: totalBuyValue > 0 ? (grossProfit / totalBuyValue) * 100 : 0,
      taxImpactPercent: 0,
    };
  }

  if (isLongTerm) {
    // LTCG: 12.5% on gains above ₹1,25,000 (Budget 2024 rules)
    taxRate = 12.5;
    const exemption = 125000;
    ltcg = grossProfit;
    taxableGain = Math.max(0, grossProfit - exemption);
  } else {
    // STCG: 20% (Budget 2024 rules)
    taxRate = 20;
    stcg = grossProfit;
    taxableGain = grossProfit;
  }

  const taxLiability = (taxableGain * taxRate) / 100;

  // Surcharge (simplified — 10% if income > 50L, ignored for simplicity here)
  const surcharge = 0;

  // Health & Education Cess: 4%
  const cess = (taxLiability + surcharge) * 0.04;
  const totalTax = taxLiability + surcharge + cess;

  const netProfit = grossProfit - totalTax;
  const effectiveTaxRate = grossProfit > 0 ? (totalTax / grossProfit) * 100 : 0;
  const postTaxROI = totalBuyValue > 0 ? (netProfit / totalBuyValue) * 100 : 0;
  const taxImpactPercent = grossProfit > 0 ? (totalTax / grossProfit) * 100 : 0;

  return {
    totalBuyValue, totalSellValue, grossProfit, holdingDays, isLongTerm,
    stcg, ltcg, taxableGain, taxRate, taxLiability,
    surcharge, cess, totalTax, netProfit, effectiveTaxRate,
    postTaxROI, taxImpactPercent,
  };
}
