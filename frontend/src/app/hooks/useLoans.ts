import { useFinance } from "../context/FinanceContext";

export function useLoans() {
  const { loans, loading, fetchLoans, addLoan, payLoan, completeLoan, changeDueDate, switchReminderType } = useFinance();
  return { loans, loading, fetchLoans, addLoan, payLoan, completeLoan, changeDueDate, switchReminderType };
}
