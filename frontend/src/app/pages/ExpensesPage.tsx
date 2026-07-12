import React, { useState } from "react";
import { TrendingDown, Plus, Trash2, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Transaction, Category, ModalType } from "../types";
import { fmt } from "../utils/formatters";
import { MetricCard, SectionHeader, DatePeriodFilter, applyPeriodFilter, periodLabel, CustomTooltip, DateSel } from "../components/common/Shared";
import { downloadCsv } from "../utils/api";

export function ExpensesPage({ transactions, categories, onOpenModal, onDelete }: {
  transactions: Transaction[];
  categories: Category[];
  onOpenModal: (t: ModalType) => void;
  onDelete: (id: number) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const [dateSel, setDateSel] = useState<DateSel>({ period: "monthly", value: thisMonth });
  const [catFilter, setCatFilter] = useState("All");

  const allExpenses = transactions.filter(t => t.type === "expense");
  const periodExpenses = applyPeriodFilter(allExpenses, dateSel);
  const displayed = catFilter === "All" ? periodExpenses : periodExpenses.filter(t => t.category === catFilter);

  const todayTotal = applyPeriodFilter(allExpenses, { period: "daily", value: today }).reduce((a, b) => a + b.amount, 0);
  const monthTotal = applyPeriodFilter(allExpenses, { period: "monthly", value: thisMonth }).reduce((a, b) => a + b.amount, 0);
  const yearTotal = applyPeriodFilter(allExpenses, { period: "yearly", value: "2026" }).reduce((a, b) => a + b.amount, 0);
  const periodTotal = periodExpenses.reduce((a, b) => a + b.amount, 0);

  const catColors: Record<string, string> = {};
  categories.forEach(c => { catColors[c.name] = c.color; });

  const catMap: Record<string, number> = {};
  periodExpenses.forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount; });
  const barData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Today" value={fmt(todayTotal)} sub={today} icon={TrendingDown} color="#f43f5e" />
        <MetricCard label="This Month" value={fmt(monthTotal)} sub={periodLabel({ period: "monthly", value: thisMonth })} icon={TrendingDown} color="#f43f5e" />
        <MetricCard label="This Year" value={fmt(yearTotal)} sub="Jan – Dec 2026" icon={TrendingDown} color="#f43f5e" />
      </div>

      <div className="bg-neu shadow-neu-flat rounded-[2rem] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">View:</span>
          <DatePeriodFilter sel={dateSel} onChange={setDateSel} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-base font-semibold font-mono text-red-400">{fmt(periodTotal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-neu shadow-neu-flat rounded-[2rem] p-4">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">
              Expense Records
              <span className="ml-2 text-sm font-normal text-muted-foreground">— {periodLabel(dateSel)}</span>
            </h2>
            <div className="flex items-center gap-2">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="text-sm bg-muted text-foreground border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="All">All Categories</option>
                {categories.filter(c => c.type !== "income").map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button onClick={() => downloadCsv("/export/transactions/csv?type=expense", "expenses.csv")}
                className="flex items-center gap-1.5 text-sm bg-muted text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors font-medium border border-border">
                <Download size={12} /> Export
              </button>
              <button onClick={() => onOpenModal("add-expense")}
                className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                <Plus size={12} /> Add Expense
              </button>
            </div>
          </div>
          {displayed.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown size={28} className="mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No expenses for {periodLabel(dateSel)}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Category", "Date", "Amount", "Notes", ""].map((h, i) => (
                    <th key={i} className="text-left text-sm text-muted-foreground font-medium pb-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayed.map(t => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColors[t.category] ?? "#6b8aad" }} />
                        <span className="text-base text-foreground">{t.category}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-muted-foreground font-mono">{t.date}</td>
                    <td className="py-2.5 text-base font-medium font-mono text-red-400">-{fmt(t.amount)}</td>
                    <td className="py-2.5 text-sm text-muted-foreground max-w-[120px] truncate">{t.notes}</td>
                    <td className="py-2.5">
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={() => onDelete(t.id)} className="p-1 hover:text-red-400 text-muted-foreground transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-primary/20">
                  <td colSpan={2} className="py-2 text-sm text-muted-foreground font-medium">{displayed.length} record{displayed.length !== 1 ? "s" : ""}</td>
                  <td className="py-2 text-base font-bold font-mono text-red-400">{fmt(displayed.reduce((a, b) => a + b.amount, 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
          <SectionHeader title="By Category" subtitle={periodLabel(dateSel)} />
          {barData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => <Cell key={`exp-bar-${i}`} fill={catColors[entry.name] ?? "#3b82f6"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
