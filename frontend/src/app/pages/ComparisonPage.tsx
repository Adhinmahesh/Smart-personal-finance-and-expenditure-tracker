import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, GitCompare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmt } from "../utils/formatters";
import { MetricCard, SectionHeader, CustomTooltip } from "../components/common/Shared";
import { SkeletonCard, SkeletonTable } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { apiFetch } from "../utils/api";

interface CompCategory {
  category: string;
  planned: number;
  actual: number;
  diff: number;
}

interface CompSummary {
  over_budget_count: number;
  under_budget_count: number;
  net_variance: number;
}

export function ComparisonPage() {
  const [compData, setCompData] = useState<CompCategory[]>([]);
  const [summary, setSummary] = useState<CompSummary>({ over_budget_count: 0, under_budget_count: 0, net_variance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const res = await apiFetch("/comparison");
        if (res.data) {
          setCompData(res.data.categories || []);
          setSummary(res.data.summary || { over_budget_count: 0, under_budget_count: 0, net_variance: 0 });
        }
      } catch (e) {
        console.error("Failed to fetch comparison data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (compData.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No Budget Comparison Available"
        description="Set up monthly budget limits and record expenses to see planned vs actual comparison."
      />
    );
  }

  const overCategories = compData.filter(c => c.diff > 0).map(c => c.category).join(", ") || "None";
  const underCategories = compData.filter(c => c.diff < 0).map(c => c.category).join(", ") || "None";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Over Budget" value={`${summary.over_budget_count} categories`} sub={overCategories} icon={AlertCircle} color="#f43f5e" />
        <MetricCard label="Under Budget" value={`${summary.under_budget_count} categories`} sub={underCategories} icon={CheckCircle2} color="#10b981" />
        <MetricCard label="Net Variance" value={fmt(Math.abs(summary.net_variance))} sub={summary.net_variance <= 0 ? "Under budget overall" : "Over budget overall"} icon={GitCompare} color="#3b82f6" />
      </div>
      <div className="bg-neu shadow-neu-flat rounded-[2rem] p-4">
        <SectionHeader title="Planned vs Actual" subtitle="Monthly comparison by category" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b8aad", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b8aad" }} />
              <Bar dataKey="planned" name="Planned" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto">
            <table className="w-full self-start">
              <thead>
                <tr className="border-b border-border">
                  {["Category", "Planned", "Actual", "Variance"].map(h => (
                    <th key={h} className="text-left text-sm text-muted-foreground font-medium pb-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compData.map(r => (
                  <tr key={r.category} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 text-base text-foreground">{r.category}</td>
                    <td className="py-2.5 text-sm font-mono text-muted-foreground">{fmt(r.planned)}</td>
                    <td className="py-2.5 text-sm font-mono text-foreground">{fmt(r.actual)}</td>
                    <td className={`py-2.5 text-sm font-mono font-medium ${r.diff > 0 ? "text-red-400" : r.diff < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {r.diff > 0 ? "+" : ""}{fmt(r.diff)} {r.diff > 0 ? "↑" : r.diff < 0 ? "↓" : "✓"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
