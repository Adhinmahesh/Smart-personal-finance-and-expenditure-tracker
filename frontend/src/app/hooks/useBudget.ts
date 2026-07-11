import { useFinance } from "../context/FinanceContext";

export function useBudget() {
  const { budget, loading, fetchBudget, addBudget, deleteBudget } = useFinance();
  return { budget, loading, fetchBudget, addBudget, deleteBudget };
}
