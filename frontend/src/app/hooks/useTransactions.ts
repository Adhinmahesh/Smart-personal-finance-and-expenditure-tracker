import { useFinance } from "../context/FinanceContext";

export function useTransactions() {
  const { transactions, loading, fetchTransactions, addTransaction, deleteTransaction } = useFinance();
  return { transactions, loading, fetchTransactions, addTransaction, deleteTransaction };
}
