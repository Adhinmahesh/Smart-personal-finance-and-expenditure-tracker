import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/api";
import { Transaction } from "../../types";

export function useTransactionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await apiFetch("/transactions?limit=100");
      return (res.data || []) as Transaction[];
    },
    enabled,
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<Transaction, "id">) => {
      return apiFetch("/transactions", { method: "POST", body: JSON.stringify(t) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/transactions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
