import React from "react";
import { TrendingUp, TrendingDown, PiggyBank, Target, Wallet, BarChart3, Plus, Clock } from "lucide-react";
import { Transaction, Loan, ModalType, Page } from "../types";
import { fmt } from "../utils/formatters";
import { MetricCard, SectionHeader, CircularProgress, PillGraph } from "../components/common/Shared";

export function DashboardPage({ transactions, loans, onOpenModal, onPayLoan, onChangePage }: {
  transactions: Transaction[];
  loans: Loan[];
  onOpenModal: (t: ModalType, data?: any) => void;
  onPayLoan: (loanId: number, amount: number) => void;
  onChangePage: (page: Page) => void;
}) {
  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const savings = totalIncome - totalExpenses;
  const pendingLoans = loans.filter(l => l.payments.some(p => p.status === "pending"));

  const catMap: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount; });
  const catColors = ["#3b82f6", "#10b981", "#f59e0b", "#a78bfa", "#f43f5e", "#06b6d4", "#6b8aad"];

  const gradients = [
    { from: "#38bdf8", to: "#0ea5e9" },
    { from: "#a78bfa", to: "#8b5cf6" },
    { from: "#fbbf24", to: "#f59e0b" },
    { from: "#f472b6", to: "#ec4899" }
  ];
  
  const topExpenses = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value], i) => ({
      label: label.substring(0, 4),
      value,
      percent: totalExpenses > 0 ? Math.min(100, Math.round((value / totalExpenses) * 100)) : 0,
      colorFrom: gradients[i % gradients.length].from,
      colorTo: gradients[i % gradients.length].to
    }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Income" value={fmt(totalIncome)} sub="June 2026" icon={TrendingUp} color="#10b981" trend="up" trendLabel="+12% from May" />
        <MetricCard label="Total Expenses" value={fmt(totalExpenses)} sub="June 2026" icon={TrendingDown} color="#f43f5e" trend="down" trendLabel="-8% from May" />
        <MetricCard label="Net Savings" value={fmt(savings)} sub="June 2026" icon={PiggyBank} color="#3b82f6" trend="up" trendLabel="+20% from May" />
        <MetricCard label="Budget Used" value="68%" sub="₹26,450 of ₹38,800" icon={Target} color="#f59e0b" trend="neutral" trendLabel="On track" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-neu shadow-neu-flat rounded-[2.5rem] p-8 flex flex-col items-center justify-between">
          <SectionHeader title="Statistics" />
          <CircularProgress percentage={68} />
          <PillGraph data={topExpenses} />
          <div className="flex justify-between w-full mt-10 px-2 gap-4">
            <button onClick={() => onChangePage("expenses")} className="flex-1 h-12 rounded-2xl bg-neu shadow-neu-flat flex items-center justify-center text-[#1e293b] hover:text-[#3b82f6] transition-all hover:shadow-neu-pressed"><Wallet size={20}/></button>
            <button onClick={() => onChangePage("budget")} className="flex-1 h-12 rounded-2xl bg-neu shadow-neu-flat flex items-center justify-center text-[#1e293b] hover:text-[#3b82f6] transition-all hover:shadow-neu-pressed"><Target size={20}/></button>
            <button onClick={() => onChangePage("reports")} className="flex-1 h-12 rounded-2xl bg-neu shadow-neu-flat flex items-center justify-center text-[#1e293b] hover:text-[#3b82f6] transition-all hover:shadow-neu-pressed"><BarChart3 size={20}/></button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neu shadow-neu-flat rounded-[2.5rem] p-8">
            <SectionHeader title="Recent Transactions" action={
              <button onClick={() => onOpenModal("add-expense")} className="flex items-center gap-1.5 text-sm bg-neu shadow-neu-flat text-[#3b82f6] px-5 py-2.5 rounded-xl hover:shadow-neu-pressed transition-all font-bold">
                <Plus size={14} /> Add
              </button>
            } />
            <div className="space-y-5 mt-4">
              {transactions.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-neu shadow-neu-flat hover:shadow-neu-pressed transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neu shadow-neu-flat flex items-center justify-center text-[#1e293b] group-hover:shadow-neu-pressed transition-all">
                      {t.type === "income" ? <TrendingUp size={20} className="text-emerald-500"/> : <TrendingDown size={20} className="text-red-500"/>}
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#000000]">{t.category}</p>
                      <p className="text-sm font-semibold text-[#1e293b]">{t.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neu shadow-neu-flat rounded-[2.5rem] p-8">
            <SectionHeader title="Pending Loan Dues" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              {loans.map(loan => (
                <div key={loan.id} className="rounded-3xl shadow-neu-flat hover:shadow-neu-pressed transition-all p-6 flex flex-col gap-4 bg-neu">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#000000]">{loan.title}</span>
                    <span className="text-sm font-bold text-amber-500 px-3 py-1.5 rounded-xl shadow-neu-pressed">Pending</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1e293b]">
                    <Clock size={14} />
                    <span>Due: {loan.nextDue}</span>
                  </div>
                  <button onClick={() => onOpenModal("pay-loan", loan)} className="w-full mt-3 py-3 rounded-xl bg-neu shadow-neu-flat text-[#3b82f6] font-bold hover:shadow-neu-pressed transition-all text-sm">
                    Pay Now
                  </button>
                </div>
              ))}
            </div>
            {pendingLoans.length === 0 && (
              <p className="text-sm font-bold text-[#1e293b] text-center py-6">No pending payments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
