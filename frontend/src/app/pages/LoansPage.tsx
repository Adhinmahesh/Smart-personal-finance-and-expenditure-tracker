import React, { useState } from "react";
import { CreditCard, CheckCircle2, AlertCircle, Bell, Calendar, Plus } from "lucide-react";
import { Loan, ModalType } from "../types";
import { fmt, fmtDueDate } from "../utils/formatters";
import { WEEKDAY_NAMES } from "../utils/constants";
import { MetricCard, SectionHeader } from "../components/common/Shared";
import { StatusBadge } from "../components/common/StatusBadge";

export function LoansPage({ loans, onOpenModal, onPayLoan, onCompleteLoan, onChangeDueDate, onSwitchReminderType, onUpdateEndDate }: {
  loans: Loan[];
  onOpenModal: (t: ModalType, data?: any) => void;
  onPayLoan: (loanId: number, amount: number) => void;
  onCompleteLoan: (loanId: number) => void;
  onChangeDueDate: (loanId: number, newValue: number, changeType: "temporary" | "permanent") => void;
  onSwitchReminderType: (loanId: number, newType: "monthly" | "weekly") => void;
  onUpdateEndDate?: (loanId: number, endDate: string | null, status?: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const loan = loans.find(l => l.id === selected);
  const totalPaid = loans.reduce((a, b) => a + b.totalPaid, 0);
  const pending = loans.flatMap(l => l.status === "active" ? l.payments.filter(p => p.status === "pending") : []).length;

  const reminderLabel = (l: Loan) => l.reminderType === "monthly"
    ? `Monthly — ${l.reminderDay}th`
    : `Weekly — ${WEEKDAY_NAMES[l.reminderWeekday]}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Active Loans" value={String(loans.filter(l => l.status === "active").length)} sub="Total active" icon={CreditCard} color="#3b82f6" />
        <MetricCard label="Total Paid" value={fmt(totalPaid)} sub="All loans, all time" icon={CheckCircle2} color="#10b981" />
        <MetricCard label="Pending Payments" value={`${pending} payment${pending !== 1 ? "s" : ""}`} sub="Across all loans" icon={AlertCircle} color="#f59e0b" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {loans.map(l => (
            <button key={l.id} onClick={() => setSelected(selected === l.id ? null : l.id)}
              className={`w-full text-left bg-card border rounded-xl p-4 transition-all
                ${selected === l.id ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-foreground">{l.title}</span>
                <StatusBadge status={l.status} />
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Type</span><span>{l.type}</span></div>
                <div className="flex justify-between"><span>Started</span><span className="font-mono">{fmtDueDate(l.startDate)}</span></div>
                <div className="flex justify-between"><span>Next Due</span><span className="font-mono text-amber-400">{l.status === "completed" ? "Completed" : fmtDueDate(l.nextDue)}</span></div>
                <div className="flex justify-between"><span>Total Paid</span><span className="font-mono text-foreground font-medium">{fmt(l.totalPaid)}</span></div>
                <div className="flex justify-between"><span>Reminder</span><span>{l.status === "completed" ? "Disabled" : reminderLabel(l)}</span></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "On Time", count: l.payments.filter(p => p.status === "on-time").length, color: "text-emerald-400" },
                  { label: "Late", count: l.payments.filter(p => p.status === "late").length, color: "text-amber-400" },
                  { label: "Pending", count: l.status === "active" ? l.payments.filter(p => p.status === "pending").length : 0, color: "text-blue-400" },
                ].map(s => (
                  <div key={s.label} className="bg-muted rounded-lg py-2">
                    <p className={`text-base font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {l.status === "active" && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-2">
                    <button onClick={e => { e.stopPropagation(); onOpenModal("pay-loan", l); }}
                      className="flex-1 text-sm py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/20">
                      Pay Now
                    </button>
                    <button onClick={e => { e.stopPropagation(); onCompleteLoan(l.id); }}
                      className="flex-1 text-sm py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium border border-emerald-500/20">
                      Mark Done
                    </button>
                  </div>
                </div>
              )}
            </button>
          ))}
          <button onClick={() => onOpenModal("add-loan")}
            className="w-full border border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 text-base text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus size={14} /> Add New Loan
          </button>
        </div>

        <div className="lg:col-span-2 bg-neu shadow-neu-flat rounded-[2rem] p-4">
          {loan ? (
            <>
              <SectionHeader title={`${loan.title} — Details`} subtitle={`${loan.payments.length} payments · ₹${loan.totalPaid.toLocaleString("en-IN")} total paid`} action={
                <button onClick={() => onOpenModal("pay-loan", loan)}
                  className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  <Plus size={12} /> Record Payment
                </button>
              } />

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Loan Type", value: loan.type },
                  { label: "Start Date", value: fmtDueDate(loan.startDate) },
                  { label: "End Date", value: loan.endDate ? fmtDueDate(loan.endDate) : "—" },
                  { label: "Next Due", value: loan.status === "completed" ? "Completed" : fmtDueDate(loan.nextDue) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-base font-medium text-foreground mt-0.5">{value}</p>
                    </div>
                    {label === "End Date" && (
                      <button onClick={() => onOpenModal("change-end-date", loan)}
                        className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1.5 rounded-lg border border-primary/20 font-bold transition-colors">
                        Change
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {loan.status === "completed" && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={14} /> Loan Completed
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This loan has reached its end date or was marked completed. No payment reminders will be sent.
                    </p>
                  </div>
                  <button onClick={() => onOpenModal("change-end-date", loan)}
                    className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium shrink-0">
                    Extend / Reactivate
                  </button>
                </div>
              )}

              {loan.status === "active" && (
                <div className="mb-5 p-4 rounded-2xl bg-neu shadow-neu-pressed border-0">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Bell size={14} className="text-primary" /> Reminder Configuration
                  </h3>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Reminder Type</p>
                    <div className="flex gap-2">
                      {(["monthly", "weekly"] as const).map(rt => (
                        <button key={rt} onClick={e => { e.stopPropagation(); onSwitchReminderType(loan.id, rt); }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${loan.reminderType === rt
                            ? "bg-primary/15 text-primary border border-primary/30 shadow-neu-pressed"
                            : "bg-neu shadow-neu-flat text-muted-foreground hover:text-foreground border border-transparent"}`}>
                          {rt === "monthly" ? "○ Monthly" : "○ Weekly"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3 p-3 rounded-xl bg-neu shadow-neu-flat">
                    <p className="text-sm text-muted-foreground">
                      {loan.reminderType === "monthly" ? "Default Reminder Date" : "Default Reminder Day"}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {loan.reminderType === "monthly"
                        ? `${loan.reminderDay}th`
                        : WEEKDAY_NAMES[loan.reminderWeekday]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onOpenModal("change-due-date", loan)}
                      className="text-sm py-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors font-bold border border-amber-500/20 flex items-center justify-center gap-1.5">
                      <Calendar size={12} />
                      {loan.reminderType === "monthly" ? "Change This Month Only" : "Change This Week Only"}
                    </button>
                    <button onClick={() => onOpenModal("change-due-date", loan)}
                      className="text-sm py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold border border-primary/20 flex items-center justify-center gap-1.5">
                      <Calendar size={12} />
                      {loan.reminderType === "monthly" ? "Change Default Date" : "Change Default Day"}
                    </button>
                  </div>
                </div>
              )}

              <SectionHeader title="Payment History" />
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Due Date", "Payment Date", "Amount", "Status"].map(h => (
                      <th key={h} className="text-left text-sm text-muted-foreground font-medium pb-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loan.payments.filter(p => loan.status === "active" || p.status !== "pending").map((p, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-base font-mono text-foreground">{fmtDueDate(p.dueDate)}</td>
                      <td className="py-2.5 text-base font-mono text-muted-foreground">{p.paidDate ? fmtDueDate(p.paidDate) : "—"}</td>
                      <td className="py-2.5 text-base font-mono text-foreground">{p.amount ? fmt(p.amount) : "—"}</td>
                      <td className="py-2.5"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loan.status === "active" && loan.payments.some(p => p.status === "pending") && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base text-amber-400">
                    <AlertCircle size={14} />
                    <span>Pending payment due on {fmtDueDate(loan.nextDue)}</span>
                  </div>
                  <button onClick={() => onOpenModal("pay-loan", loan)}
                    className="text-sm bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors font-medium">
                    Pay Now
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
              <CreditCard size={32} className="mb-3 opacity-20" />
              <p className="text-base">Select a loan to view details & reminders</p>
              <p className="text-sm mt-1 opacity-60">Click any loan card on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
