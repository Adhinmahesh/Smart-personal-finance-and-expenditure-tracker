import React, { useState, useMemo, useEffect } from "react";
import { Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer } from "recharts";
import { Transaction } from "../types";
import { fmt, computeMonthlyTrend } from "../utils/formatters";
import { SectionHeader, DatePeriodFilter, applyPeriodFilter, periodLabel, CustomTooltip, DateSel } from "../components/common/Shared";
import { apiFetch, downloadCsv } from "../utils/api";

export function ReportsPage({ transactions }: { transactions: Transaction[] }) {
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "savings">("expense");
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const [dateSel, setDateSel] = useState<DateSel>({ period: "monthly", value: thisMonth });
  const [apiTrends, setApiTrends] = useState<any[] | null>(null);

  useEffect(() => {
    apiFetch("/reports/trends?months=6")
      .then(res => { if (res.data) setApiTrends(res.data); })
      .catch(e => console.error("Failed to load trends", e));
  }, []);

  const allExpenses = transactions.filter(t => t.type === "expense");
  const allIncomes = transactions.filter(t => t.type === "income");
  const periodExpenses = applyPeriodFilter(allExpenses, dateSel);
  const periodIncomes = applyPeriodFilter(allIncomes, dateSel);
  const expTotal = periodExpenses.reduce((a, b) => a + b.amount, 0);
  const incTotal = periodIncomes.reduce((a, b) => a + b.amount, 0);

  const fallbackTrend = useMemo(() => computeMonthlyTrend(transactions), [transactions]);
  const monthlyTrend = apiTrends || fallbackTrend;
  const savingsData = useMemo(() => monthlyTrend.map(m => ({ month: m.month, savings: m.savings })), [monthlyTrend]);
  const catColors = ["#3b82f6", "#10b981", "#f59e0b", "#a78bfa", "#f43f5e", "#06b6d4", "#6b8aad"];
  const pieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    periodExpenses.forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount; });
    return Object.entries(catMap).map(([name, value], i) => ({ name, value, color: catColors[i % catColors.length] }));
  }, [periodExpenses]);

  return (
    <div className="space-y-5">
      <div className="bg-neu shadow-neu-flat rounded-[2rem] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">Period:</span>
          <DatePeriodFilter sel={dateSel} onChange={setDateSel} />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Income: <span className="text-emerald-400 font-mono font-semibold">{fmt(incTotal)}</span></span>
          <span className="text-muted-foreground">Expenses: <span className="text-red-400 font-mono font-semibold">{fmt(expTotal)}</span></span>
          <span className="text-muted-foreground">Savings: <span className="text-blue-400 font-mono font-semibold">{fmt(incTotal - expTotal)}</span></span>
          <button onClick={() => downloadCsv("/export/transactions/csv", "all_transactions.csv")}
            className="flex items-center gap-1.5 text-sm bg-muted text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors font-medium border border-border ml-2">
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
          {(["expense", "income", "savings"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize
                ${activeTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "expense" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Expense Trend — {periodLabel(dateSel)}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} dot={{ fill: "#f43f5e", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Category Distribution — {periodLabel(dateSel)}</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={`rep-pie-${i}`} fill={catColors[i % catColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: "#0d1829", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
        {activeTab === "income" && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.15} dot={{ fill: "#10b981", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {activeTab === "savings" && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="savings" name="Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
        <SectionHeader title="Monthly Summary Report" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Month", "Income", "Expenses", "Savings", "Savings %"].map(h => (
                <th key={h} className="text-left text-sm text-muted-foreground font-medium pb-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {monthlyTrend.map(m => (
              <tr key={m.month} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 text-base text-foreground font-medium">{m.month} 2026</td>
                <td className="py-2.5 text-base font-mono text-emerald-400">+{fmt(m.income)}</td>
                <td className="py-2.5 text-base font-mono text-red-400">-{fmt(m.expenses)}</td>
                <td className="py-2.5 text-base font-mono text-blue-400">{fmt(m.savings)}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((m.savings / m.income) * 100)}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground font-mono w-8">{Math.round((m.savings / m.income) * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
