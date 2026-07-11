import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/api";
import { Category } from "../../types";
import { INIT_CATEGORIES } from "../../utils/constants";

export function useCategoriesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiFetch("/categories");
      return (res.data?.length ? res.data : INIT_CATEGORIES) as Category[];
    },
    enabled,
    placeholderData: INIT_CATEGORIES,
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<Category, "id">) => {
      return apiFetch("/categories", { method: "POST", body: JSON.stringify(c) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useEditCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<Category, "id"> }) => {
      return apiFetch(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/categories/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
