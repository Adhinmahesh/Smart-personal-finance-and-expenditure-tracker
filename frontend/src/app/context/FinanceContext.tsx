import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { Transaction, Loan, Category, BudgetItem } from "../types";
import { INIT_CATEGORIES } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/common/Toast";
import { toLocalDateStr, computeLoanNextDue, hasLoanPayments, getLatestPaidDueDate } from "../utils/formatters";

// ── TanStack Query Hooks ─────────────────────────────────────────────────────
import { useTransactionsQuery, useAddTransaction, useDeleteTransaction } from "../hooks/queries/useTransactionsQuery";
import { useLoansQuery, useAddLoan, usePayLoan, useCompleteLoan, useChangeDueDate, useSwitchReminderType, useUpdateEndDate } from "../hooks/queries/useLoansQuery";
import { useCategoriesQuery, useAddCategory, useEditCategory, useDeleteCategory } from "../hooks/queries/useCategoriesQuery";
import { useBudgetQuery, useAddBudget, useDeleteBudget } from "../hooks/queries/useBudgetQuery";
import { useQueryClient } from "@tanstack/react-query";

export interface FinanceContextType {
  transactions: Transaction[];
  loans: Loan[];
  categories: Category[];
  budget: BudgetItem[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchLoans: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchBudget: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  addCategory: (c: Omit<Category, "id">) => Promise<void>;
  editCategory: (id: number, c: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  addLoan: (l: Omit<Loan, "id" | "payments" | "totalPaid">) => Promise<void>;
  payLoan: (loanId: number, amount: number) => Promise<void>;
  completeLoan: (loanId: number) => Promise<void>;
  changeDueDate: (loanId: number, newValue: number, changeType: "temporary" | "permanent") => Promise<void>;
  switchReminderType: (loanId: number, newType: "monthly" | "weekly") => Promise<void>;
  updateEndDate: (loanId: number, endDate: string | null, status?: string) => Promise<void>;
  addBudget: (b: Omit<BudgetItem, "id">) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    queryClient.clear();
  }, [currentUser?.id, queryClient]);

  // ── Queries (automatic fetching, caching, background refetch) ──────────────
  const txQuery = useTransactionsQuery(isAuthenticated);
  const loansQuery = useLoansQuery(isAuthenticated);
  const catQuery = useCategoriesQuery(isAuthenticated);
  const budgetQuery = useBudgetQuery(isAuthenticated);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addTxMutation = useAddTransaction();
  const deleteTxMutation = useDeleteTransaction();
  const addLoanMutation = useAddLoan();
  const payLoanMutation = usePayLoan();
  const completeLoanMutation = useCompleteLoan();
  const changeDueDateMutation = useChangeDueDate();
  const switchReminderMutation = useSwitchReminderType();
  const updateEndDateMutation = useUpdateEndDate();
  const addCatMutation = useAddCategory();
  const editCatMutation = useEditCategory();
  const deleteCatMutation = useDeleteCategory();
  const addBudgetMutation = useAddBudget();
  const deleteBudgetMutation = useDeleteBudget();

  // ── Data (with safe defaults) ──────────────────────────────────────────────
  const transactions = txQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const categories = catQuery.data ?? INIT_CATEGORIES;
  const budget = budgetQuery.data ?? [];
  const loading = txQuery.isLoading || loansQuery.isLoading || catQuery.isLoading || budgetQuery.isLoading;

  // ── Handlers (same interface as before — zero breaking changes) ────────────
  const refreshAll = async () => {
    await queryClient.invalidateQueries();
  };

  const fetchTransactions = async () => { await queryClient.invalidateQueries({ queryKey: ["transactions"] }); };
  const fetchLoans = async () => { await queryClient.invalidateQueries({ queryKey: ["loans"] }); };
  const fetchCategories = async () => { await queryClient.invalidateQueries({ queryKey: ["categories"] }); };
  const fetchBudget = async () => { await queryClient.invalidateQueries({ queryKey: ["budget"] }); };

  const addTransaction = async (t: Omit<Transaction, "id">) => {
    try { await addTxMutation.mutateAsync(t); }
    catch (e) { showToast("Error adding transaction", "error"); throw e; }
  };

  const deleteTransaction = async (id: number) => {
    try { await deleteTxMutation.mutateAsync(id); }
    catch (e) { showToast("Error deleting transaction", "error"); throw e; }
  };

  const addCategory = async (c: Omit<Category, "id">) => {
    try { await addCatMutation.mutateAsync(c); }
    catch (e) { showToast("Error adding category", "error"); throw e; }
  };

  const editCategory = async (id: number, c: Omit<Category, "id">) => {
    try {
      await editCatMutation.mutateAsync({ id, data: c });
      showToast("Category updated successfully", "success");
    } catch (e) { showToast("Error updating category", "error"); throw e; }
  };

  const deleteCategory = async (id: number) => {
    try { await deleteCatMutation.mutateAsync(id); }
    catch (e) { showToast("Error deleting category", "error"); throw e; }
  };

  const addLoan = async (l: Omit<Loan, "id" | "payments" | "totalPaid">) => {
    try { await addLoanMutation.mutateAsync(l); }
    catch (e) { showToast("Error adding loan", "error"); throw e; }
  };

  const payLoan = async (loanId: number, amount: number) => {
    try { await payLoanMutation.mutateAsync({ loanId, amount }); }
    catch (e) { showToast("Error paying loan", "error"); throw e; }
  };

  const completeLoan = async (loanId: number) => {
    try { await completeLoanMutation.mutateAsync(loanId); }
    catch (e) { showToast("Error completing loan", "error"); throw e; }
  };

  const changeDueDate = async (loanId: number, newValue: number, changeType: "temporary" | "permanent") => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const nextDue = computeLoanNextDue(
      loan.startDate,
      loan.nextDue,
      loan.reminderType,
      loan.reminderType === "monthly" ? newValue : loan.reminderDay,
      loan.reminderType === "monthly" ? loan.reminderWeekday : newValue,
      hasLoanPayments(loan)
    );

    try {
      await changeDueDateMutation.mutateAsync({ loanId, newValue, changeType, nextDue, reminderType: loan.reminderType });
    } catch (e) { showToast("Error changing due date", "error"); throw e; }
  };

  const switchReminderType = async (loanId: number, newType: "monthly" | "weekly") => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(loan.startDate + "T00:00:00");

    // Find the LAST PAID due date from payment history.
    // This is the stable reference — it doesn't change when toggling types.
    let lastPaidDate: Date | null = null;
    if (loan.payments && loan.payments.length > 0) {
      const paidPayments = loan.payments.filter(p => p.status === "on-time" || p.status === "late");
      if (paidPayments.length > 0) {
        lastPaidDate = paidPayments.reduce((max, p) => {
          const d = new Date(p.dueDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() > max.getTime() ? d : max;
        }, new Date(0));
      }
    }

    // Reference: last paid date (if exists), otherwise start date
    const reference = lastPaidDate || start;

    let nextDue: string;

    if (newType === "monthly") {
      const day = loan.reminderDay || 16;
      let dt = new Date(reference.getFullYear(), reference.getMonth(), day);
      // Must be AFTER the reference (don't overlap with already-paid period)
      if (dt.getTime() <= reference.getTime()) {
        dt = new Date(dt.getFullYear(), dt.getMonth() + 1, day);
      }
      // Must not be in the past
      while (dt.getTime() < today.getTime()) {
        dt = new Date(dt.getFullYear(), dt.getMonth() + 1, day);
      }
      nextDue = toLocalDateStr(dt);
    } else {
      const wd = loan.reminderWeekday ?? 1;
      let diff = (wd - reference.getDay() + 7) % 7;
      if (diff === 0) diff = 7; // Same weekday → next week
      const dt = new Date(reference);
      dt.setDate(reference.getDate() + diff);
      // Must not be in the past
      while (dt.getTime() < today.getTime()) {
        dt.setDate(dt.getDate() + 7);
      }
      nextDue = toLocalDateStr(dt);
    }

    try {
      await switchReminderMutation.mutateAsync({ loanId, newType, nextDue });
    } catch (e) { showToast("Error switching reminder type", "error"); throw e; }
  };

  const updateEndDate = async (loanId: number, endDate: string | null, status?: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    
    const targetStatus = status || loan.status;
    let nextDue: string | null = null;
    if (targetStatus === "active") {
      const day = loan.reminderType === "monthly" ? loan.reminderDay ?? 16 : 0;
      const wd = loan.reminderType === "weekly" ? loan.reminderWeekday ?? 1 : 0;
      nextDue = computeLoanNextDue(
        loan.startDate,
        loan.nextDue,
        loan.reminderType,
        day,
        wd,
        hasLoanPayments(loan),
        getLatestPaidDueDate(loan)
      );
      if (endDate && nextDue > endDate) {
        nextDue = null;
      }
    }
    
    try {
      await updateEndDateMutation.mutateAsync({ loanId, endDate, nextDue, status: targetStatus });
    } catch (e) {
      showToast("Error updating end date", "error");
      throw e;
    }
  };

  const addBudget = async (b: Omit<BudgetItem, "id">) => {
    try { await addBudgetMutation.mutateAsync(b); }
    catch (e) { showToast("Error adding budget", "error"); throw e; }
  };

  const deleteBudget = async (id: number) => {
    try { await deleteBudgetMutation.mutateAsync(id); }
    catch (e) { showToast("Error deleting budget", "error"); throw e; }
  };

  return (
    <FinanceContext.Provider value={{
      transactions, loans, categories, budget, loading,
      refreshAll, fetchTransactions, fetchLoans, fetchCategories, fetchBudget,
      addTransaction, deleteTransaction,
      addCategory, editCategory, deleteCategory,
      addLoan, payLoan, completeLoan, changeDueDate, switchReminderType, updateEndDate,
      addBudget, deleteBudget
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
}
