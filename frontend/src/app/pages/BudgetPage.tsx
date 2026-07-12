import React, { useState, useMemo } from "react";
import { Target, TrendingDown, PiggyBank, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { BudgetItem, Transaction, Category, ModalType } from "../types";
import { fmt } from "../utils/formatters";
import { MetricCard, SectionHeader } from "../components/common/Shared";

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetPage({ budget, transactions, categories, selectedMonth, onMonthChange, onOpenModal, onDeleteBudget }: {
  budget: BudgetItem[];
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  onOpenModal: (t: ModalType) => void;
  onDeleteBudget: (id: number) => void;
}) {
  const monthLabel = getMonthLabel(selectedMonth);

  // Filter budget items for the selected month
  const monthBudget = useMemo(() =>
    budget.filter(b => b.month === selectedMonth),
    [budget, selectedMonth]
  );

  // Calculate actual spending from real transactions for this month
  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === "expense" && t.date.startsWith(selectedMonth))
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [transactions, selectedMonth]);

  const total = monthBudget.reduce((a, b) => a + b.monthly, 0);
  const totalActual = Object.values(actualByCategory).reduce((a, b) => a + b, 0);
  const remaining = total - totalActual;
  const pctRemaining = total > 0 ? Math.round((remaining / total) * 100) : 0;

  const catIcon = Object.fromEntries(categories.map(c => [c.name, c.icon]));

  return (
    <div className="space-y-5">
      {/* ── Month Selector ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onMonthChange(shiftMonth(selectedMonth, -1))}
          className="p-2 rounded-xl bg-neu shadow-neu-flat hover:shadow-neu-pressed transition-shadow text-muted-foreground hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center min-w-[180px]">
          <h2 className="text-lg font-semibold text-foreground">{monthLabel}</h2>
          <p className="text-xs text-muted-foreground">Budget Period</p>
        </div>
        <button
          onClick={() => onMonthChange(shiftMonth(selectedMonth, 1))}
          className="p-2 rounded-xl bg-neu shadow-neu-flat hover:shadow-neu-pressed transition-shadow text-muted-foreground hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Top 3 Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Planned" value={fmt(total)} sub={monthLabel} icon={Target} color="#3b82f6" />
        <MetricCard label="Total Actual" value={fmt(totalActual)} sub={monthLabel} icon={TrendingDown} color="#f43f5e" />
        <MetricCard
          label="Remaining"
          value={fmt(remaining)}
          sub="Budget left"
          icon={PiggyBank}
          color={remaining >= 0 ? "#10b981" : "#f43f5e"}
          trend={remaining >= 0 ? "up" : "down"}
          trendLabel={total > 0 ? `${Math.abs(pctRemaining)}% ${remaining >= 0 ? "remaining" : "over"}` : "No budget"}
        />
      </div>

      {/* ── Budget Table & Utilization ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-neu shadow-neu-flat rounded-[2rem] p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Monthly Budget — {monthLabel}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Daily budget × 30 days auto-calculated</p>
            </div>
            <button onClick={() => onOpenModal("add-budget")}
              className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
              <Plus size={12} /> Add Category
            </button>
          </div>
          {monthBudget.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No budget set for {monthLabel}. Add a category to get started.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Category", "Daily Budget", "Weekly (est.)", "Monthly Budget", "Actual", ""].map((h, i) => (
                    <th key={i} className="text-left text-sm text-muted-foreground font-medium pb-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthBudget.map(b => {
                  const actual = actualByCategory[b.category] ?? 0;
                  const over = actual > b.monthly;
                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3">
                        <span className="flex items-center gap-2 text-base text-foreground">
                          <span>{catIcon[b.category] ?? "📁"}</span>{b.category}
                        </span>
                      </td>
                      <td className="py-3 text-base font-mono text-muted-foreground">{fmt(b.daily)}/day</td>
                      <td className="py-3 text-base font-mono text-muted-foreground">{fmt(b.daily * 7)}</td>
                      <td className="py-3 text-base font-mono font-medium text-foreground">{fmt(b.monthly)}</td>
                      <td className={`py-3 text-base font-mono font-medium ${over ? "text-red-400" : "text-emerald-400"}`}>{fmt(actual)}</td>
                      <td className="py-3">
                        <button onClick={() => onDeleteBudget(b.id)} className="hidden group-hover:block p-1 hover:text-red-400 text-muted-foreground transition-colors"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30">
                  <td colSpan={3} className="py-3 text-base font-semibold text-foreground">Total Budget</td>
                  <td className="py-3 text-base font-mono font-bold text-primary">{fmt(total)}</td>
                  <td className="py-3 text-base font-mono font-bold text-muted-foreground">{fmt(totalActual)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
          <SectionHeader title="Budget Utilization" />
          {monthBudget.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Add budget items to see utilization.</p>
          ) : (
            monthBudget.map(b => {
              const actual = actualByCategory[b.category] ?? 0;
              const pct = b.monthly > 0 ? Math.round((actual / b.monthly) * 100) : 0;
              const over = pct > 100;
              return (
                <div key={b.id} className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{b.category}</span>
                    <span className={`font-medium ${over ? "text-red-400" : "text-emerald-400"}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: over ? "#f43f5e" : "#3b82f6" }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
