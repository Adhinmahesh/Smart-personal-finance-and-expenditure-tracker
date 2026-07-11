import { useFinance } from "../context/FinanceContext";

export function useCategories() {
  const { categories, loading, fetchCategories, addCategory, editCategory, deleteCategory } = useFinance();
  return { categories, loading, fetchCategories, addCategory, editCategory, deleteCategory };
}
