import React, { useState } from "react";
import { Tag, TrendingDown, TrendingUp, Plus, Edit2, Trash2 } from "lucide-react";
import { Category, ModalType } from "../types";
import { MetricCard } from "../components/common/Shared";

export function CategoriesPage({ categories, onOpenModal, onEditCategory, onDeleteCategory }: {
  categories: Category[];
  onOpenModal: (t: ModalType, data?: any) => void;
  onEditCategory: (id: number, data: Omit<Category, "id">) => void;
  onDeleteCategory: (id: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const filtered = filter === "all" ? categories : categories.filter(c => c.type === filter || c.type === "both");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Categories" value={String(categories.length)} sub="All types" icon={Tag} color="#3b82f6" />
        <MetricCard label="Expense Categories" value={String(categories.filter(c => c.type === "expense" || c.type === "both").length)} sub="Tracked" icon={TrendingDown} color="#f43f5e" />
        <MetricCard label="Income Categories" value={String(categories.filter(c => c.type === "income" || c.type === "both").length)} sub="Tracked" icon={TrendingUp} color="#10b981" />
      </div>

      <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {(["all", "expense", "income"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize
                  ${filter === f ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => onOpenModal("add-category")}
            className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium">
            <Plus size={12} /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:border-primary/30 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${cat.color}20` }}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-foreground truncate">{cat.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{cat.type}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onOpenModal("edit-category", cat)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                  <Edit2 size={12} />
                </button>
                <button onClick={() => onDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No categories found.</p>
        )}
      </div>
    </div>
  );
}
