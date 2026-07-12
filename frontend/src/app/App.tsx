import React, { useState, Suspense, lazy } from "react";
import { Page, ModalType } from "./types";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { LoginPage } from "./pages/LoginPage";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ToastProvider } from "./components/common/Toast";
import {
  AddExpenseModal, AddIncomeModal, CategoryModal,
  AddLoanModal, PayLoanModal, AddBudgetModal, ChangeDueDateModal, ChangeEndDateModal
} from "./components/Modals";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { FinanceProvider, useFinance } from "./context/FinanceContext";

// Lazy-loaded page components for code splitting
const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage").then(m => ({ default: m.ExpensesPage })));
const IncomePage = lazy(() => import("./pages/IncomePage").then(m => ({ default: m.IncomePage })));
const BudgetPage = lazy(() => import("./pages/BudgetPage").then(m => ({ default: m.BudgetPage })));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage").then(m => ({ default: m.ComparisonPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then(m => ({ default: m.ReportsPage })));
const LoansPage = lazy(() => import("./pages/LoansPage").then(m => ({ default: m.LoansPage })));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then(m => ({ default: m.CategoriesPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard Overview", subtitle: "Welcome back! Here's your financial summary" },
  expenses: { title: "Expense Tracking", subtitle: "Monitor and analyze your spending habits" },
  income: { title: "Income Management", subtitle: "Track your revenue streams and cash flow" },
  budget: { title: "Monthly Budget Planner", subtitle: "Set spending limits and track category utilization" },
  comparison: { title: "Budget Comparison", subtitle: "Analyze planned vs actual financial performance" },
  reports: { title: "Financial Reports", subtitle: "Visual insights into your financial trends" },
  loans: { title: "Loan Management", subtitle: "Track active loans, payment schedules, and reminders" },
  categories: { title: "Category Management", subtitle: "Customize your transaction classification system" },
  settings: { title: "Account Settings", subtitle: "Manage your profile, preferences, and data" },
};

function AppContent() {
  const { currentUser, login, logout, isCheckingAuth } = useAuth();
  const {
    transactions, loans, categories, budget, loading,
    refreshAll,
    addTransaction, deleteTransaction,
    addCategory, editCategory, deleteCategory,
    addLoan, payLoan, completeLoan, changeDueDate, switchReminderType, updateEndDate,
    addBudget, deleteBudget
  } = useFinance();

  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [modal, setModal] = useState<{ type: ModalType; data?: any }>({ type: null });
  const [searchQuery, setSearchQuery] = useState("");
  const now = new Date();
  const [budgetMonth, setBudgetMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const openModal = (type: ModalType, data?: any) => setModal({ type, data });
  const closeModal = () => setModal({ type: null });

  const meta = PAGE_META[page];

  if (isCheckingAuth) {
    return <div className="flex h-screen items-center justify-center bg-neu"><LoadingSpinner size="lg" message="Checking authentication..." /></div>;
  }

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isDirectVerify = params ? Boolean((params.get("email") || params.get("verify_email")) && (params.get("code") || params.get("token"))) : false;
  const isResetRoute = typeof window !== "undefined" && window.location.pathname.includes("reset-password");

  if (!currentUser || isDirectVerify || isResetRoute) {
    return <LoginPage onLogin={login} />;
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-neu"><LoadingSpinner size="lg" message="Loading financial data..." /></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neu text-foreground">
      <Sidebar current={page} onChange={setPage} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} userProfile={currentUser} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={meta.title} subtitle={meta.subtitle} onSettingsClick={() => setPage("settings")} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            {page === "dashboard" && <DashboardPage transactions={transactions} loans={loans} onOpenModal={openModal} onPayLoan={payLoan} onChangePage={setPage} />}
            {page === "expenses" && <ExpensesPage transactions={transactions} categories={categories} onOpenModal={openModal} onDelete={deleteTransaction} />}
            {page === "income" && <IncomePage transactions={transactions} categories={categories} onOpenModal={openModal} onDelete={deleteTransaction} />}
            {page === "budget" && <BudgetPage budget={budget} transactions={transactions} categories={categories} selectedMonth={budgetMonth} onMonthChange={setBudgetMonth} onOpenModal={openModal} onDeleteBudget={deleteBudget} />}
            {page === "comparison" && <ComparisonPage />}
            {page === "reports" && <ReportsPage transactions={transactions} />}
            {page === "loans" && <LoansPage loans={loans} onOpenModal={openModal} onPayLoan={payLoan} onCompleteLoan={completeLoan} onChangeDueDate={changeDueDate} onSwitchReminderType={switchReminderType} onUpdateEndDate={updateEndDate} />}
            {page === "categories" && <CategoriesPage categories={categories} onOpenModal={openModal} onEditCategory={editCategory} onDeleteCategory={deleteCategory} />}
            {page === "settings" && <SettingsPage userProfile={currentUser} setUserProfile={() => {}} onLogout={logout} />}
          </Suspense>
        </main>
      </div>

      {modal.type === "add-expense" && <AddExpenseModal categories={categories} onSave={addTransaction} onClose={closeModal} />}
      {modal.type === "add-income" && <AddIncomeModal categories={categories} onSave={addTransaction} onClose={closeModal} />}
      {modal.type === "add-category" && <CategoryModal onSave={addCategory} onClose={closeModal} />}
      {modal.type === "edit-category" && modal.data && <CategoryModal existing={modal.data} onSave={c => editCategory(modal.data.id, c)} onClose={closeModal} />}
      {modal.type === "add-loan" && <AddLoanModal onSave={addLoan} onClose={closeModal} />}
      {modal.type === "pay-loan" && modal.data && <PayLoanModal loan={modal.data} onPay={payLoan} onClose={closeModal} />}
      {modal.type === "add-budget" && <AddBudgetModal categories={categories} onSave={addBudget} onClose={closeModal} />}
      {modal.type === "change-due-date" && modal.data && <ChangeDueDateModal loan={modal.data} onSave={changeDueDate} onClose={closeModal} />}
      {modal.type === "change-end-date" && modal.data && <ChangeEndDateModal loan={modal.data} onSave={updateEndDate} onClose={closeModal} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
