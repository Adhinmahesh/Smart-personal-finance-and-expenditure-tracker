import React, { useState } from "react";
import { TrendingUp, Plus, Trash2, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Transaction, Category, ModalType } from "../types";
import { fmt } from "../utils/formatters";
import { MetricCard, SectionHeader, DatePeriodFilter, applyPeriodFilter, periodLabel, CustomTooltip, DateSel } from "../components/common/Shared";
import { downloadCsv } from "../utils/api";

export function IncomePage({ transactions, categories, onOpenModal, onDelete }: {
  transactions: Transaction[];
  categories: Category[];
  onOpenModal: (t: ModalType) => void;
  onDelete: (id: number) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const [dateSel, setDateSel] = useState<DateSel>({ period: "monthly", value: thisMonth });

  const allIncomes = transactions.filter(t => t.type === "income");
  const periodIncomes = applyPeriodFilter(allIncomes, dateSel);
  const periodTotal = periodIncomes.reduce((a, b) => a + b.amount, 0);

  const todayTotal = applyPeriodFilter(allIncomes, { period: "daily", value: today }).reduce((a, b) => a + b.amount, 0);
  const monthTotal = applyPeriodFilter(allIncomes, { period: "monthly", value: thisMonth }).reduce((a, b) => a + b.amount, 0);
  const yearTotal = applyPeriodFilter(allIncomes, { period: "yearly", value: "2026" }).reduce((a, b) => a + b.amount, 0);

  const srcMap: Record<string, number> = {};
  periodIncomes.forEach(t => { srcMap[t.category] = (srcMap[t.category] ?? 0) + t.amount; });
  const srcEntries = Object.entries(srcMap);
  const srcColors = ["#3b82f6", "#a78bfa", "#f59e0b", "#10b981", "#f43f5e"];

  const incomeBarData = [
    { month: "Jan", salary: 38000, other: 0 },
    { month: "Feb", salary: 38000, other: 4000 },
    { month: "Mar", salary: 38000, other: 7000 },
    { month: "Apr", salary: 38000, other: 4000 },
    { month: "May", salary: 38000, other: 12000 },
    { month: "Jun", salary: 42000, other: 8500 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Today" value={fmt(todayTotal)} sub={today} icon={TrendingUp} color="#10b981" />
        <MetricCard label="This Month" value={fmt(monthTotal)} sub={periodLabel({ period: "monthly", value: thisMonth })} icon={TrendingUp} color="#10b981" trend="up" trendLabel="+20% from May" />
        <MetricCard label="This Year" value={fmt(yearTotal || 274500)} sub="Jan – Dec 2026" icon={TrendingUp} color="#10b981" />
      </div>

      <div className="bg-neu shadow-neu-flat rounded-[2rem] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">View:</span>
          <DatePeriodFilter sel={dateSel} onChange={setDateSel} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-base font-semibold font-mono text-emerald-400">{fmt(periodTotal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-neu shadow-neu-flat rounded-[2rem] p-4">
          <SectionHeader title="Income Trend" subtitle="Yearly overview" action={
            <div className="flex items-center gap-2">
              <button onClick={() => downloadCsv("/export/transactions/csv?type=income", "income.csv")}
                className="flex items-center gap-1.5 text-sm bg-muted text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors font-medium border border-border">
                <Download size={12} /> Export
              </button>
              <button onClick={() => onOpenModal("add-income")} className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                <Plus size={12} /> Add Income
              </button>
            </div>
          } />
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={incomeBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b8aad" }} />
              <Bar dataKey="salary" name="Salary" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="other" name="Other" fill="#a78bfa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">
            Records — {periodLabel(dateSel)}
          </h3>
          {periodIncomes.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp size={28} className="mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No income for {periodLabel(dateSel)}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Source", "Date", "Amount", "Notes", ""].map((h, i) => (
                    <th key={i} className="text-left text-sm text-muted-foreground font-medium pb-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {periodIncomes.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-2.5 text-base text-foreground">{s.category}</td>
                    <td className="py-2.5 text-sm text-muted-foreground font-mono">{s.date}</td>
                    <td className="py-2.5 text-base font-medium font-mono text-emerald-400">+{fmt(s.amount)}</td>
                    <td className="py-2.5 text-sm text-muted-foreground max-w-[100px] truncate">{s.notes}</td>
                    <td className="py-2.5">
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={() => onDelete(s.id)} className="p-1 hover:text-red-400 text-muted-foreground transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-primary/20">
                  <td colSpan={2} className="py-2 text-sm text-muted-foreground">{periodIncomes.length} record{periodIncomes.length !== 1 ? "s" : ""}</td>
                  <td className="py-2 text-base font-bold font-mono text-emerald-400">{fmt(periodTotal)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
          <SectionHeader title="Income Sources" subtitle={periodLabel(dateSel)} />
          {srcEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No income for this period</p>
          ) : (
            srcEntries.map(([label, value], i) => (
              <div key={label} className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium font-mono">{fmt(value)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((value / periodTotal) * 100)}%`, background: srcColors[i % srcColors.length] }} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{Math.round((value / periodTotal) * 100)}% of total</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
