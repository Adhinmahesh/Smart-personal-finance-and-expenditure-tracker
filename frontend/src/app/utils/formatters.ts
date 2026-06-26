// ── Helpers ────────────────────────────────────────────────────────────────────
export const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface Transaction {
    id: number;
    category: string;
    date: string;
    amount: number;
    notes: string;
    type: "expense" | "income";
}

export function computeMonthlyTrend(transactions: Transaction[]) {
  const grouped = transactions.reduce((acc, t) => {
    const d = new Date(t.date);
    const m = d.toLocaleString('default', { month: 'short' });
    if (!acc[m]) acc[m] = { month: m, income: 0, expenses: 0, savings: 0 };
    if (t.type === 'income') acc[m].income += t.amount;
    if (t.type === 'expense') acc[m].expenses += t.amount;
    acc[m].savings = acc[m].income - acc[m].expenses;
    return acc;
  }, {} as Record<string, any>);
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dynamicTrend = Object.values(grouped).sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  
  return dynamicTrend.length > 0 ? dynamicTrend : [{ month: "Current", income: 0, expenses: 0, savings: 0 }];
}
