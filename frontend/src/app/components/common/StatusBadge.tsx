import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "on-time": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    late: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    pending: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    active: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    expense: "bg-red-500/15 text-red-400 border border-red-500/20",
    income: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${styles[status] ?? "bg-muted text-muted-foreground border border-border"}`}>
      {status.replace("-", " ")}
    </span>
  );
}
