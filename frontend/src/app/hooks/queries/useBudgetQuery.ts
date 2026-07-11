import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/api";
import { BudgetItem } from "../../types";

export function useBudgetQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const res = await apiFetch("/budget");
      return (res.data || []) as BudgetItem[];
    },
    enabled,
  });
}

export function useAddBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (b: Omit<BudgetItem, "id">) => {
      return apiFetch("/budget", { method: "POST", body: JSON.stringify(b) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/budget/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
