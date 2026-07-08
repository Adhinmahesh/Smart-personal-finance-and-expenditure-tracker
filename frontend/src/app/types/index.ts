export type Page = "dashboard" | "expenses" | "income" | "budget" | "comparison" | "reports" | "loans" | "categories" | "settings";
export type ModalType = "add-expense" | "add-income" | "add-category" | "edit-category" | "add-loan" | "pay-loan" | "add-budget" | "change-due-date" | null;

export interface Transaction { id: number; category: string; date: string; amount: number; notes: string; type: "expense" | "income"; }
export interface Category { id: number; name: string; icon: string; color: string; type: "expense" | "income" | "both"; }
export interface Loan { id: number; title: string; type: string; startDate: string; endDate: string; reminderType: "monthly" | "weekly"; reminderDay: number; reminderWeekday: number; nextDue: string; totalPaid: number; notes: string; payments: LoanPayment[]; status: "active" | "completed"; }
export interface LoanPayment { dueDate: string; paidDate: string | null; amount: number | null; status: "on-time" | "late" | "pending"; }
export interface BudgetItem { id: number; category: string; daily: number; monthly: number; month: string; }
