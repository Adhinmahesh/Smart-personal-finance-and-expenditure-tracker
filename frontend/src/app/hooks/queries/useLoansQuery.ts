import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/api";
import { Loan } from "../../types";

export function useLoansQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const res = await apiFetch("/loans");
      return (res.data || []) as Loan[];
    },
    enabled,
  });
}

export function useAddLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (l: Omit<Loan, "id" | "payments" | "totalPaid">) => {
      return apiFetch("/loans", { method: "POST", body: JSON.stringify(l) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function usePayLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ loanId, amount }: { loanId: number; amount: number }) => {
      return apiFetch(`/loans/${loanId}/pay`, { method: "POST", body: JSON.stringify({ amount }) });
    },
    onSuccess: () => {
      // Payment creates a transaction, so invalidate both caches
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCompleteLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: number) => {
      return apiFetch(`/loans/${loanId}/complete`, { method: "PUT" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function useChangeDueDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { loanId: number; newValue: number; changeType: "temporary" | "permanent"; nextDue: string; reminderType: string }) => {
      const { loanId, ...body } = params;
      return apiFetch(`/loans/${loanId}/due-date`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function useSwitchReminderType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { loanId: number; newType: string; nextDue: string }) => {
      const { loanId, ...body } = params;
      return apiFetch(`/loans/${loanId}/reminder-type`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function useUpdateEndDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { loanId: number; endDate: string | null; nextDue?: string | null; status?: string }) => {
      const { loanId, ...body } = params;
      return apiFetch(`/loans/${loanId}/end-date`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}
