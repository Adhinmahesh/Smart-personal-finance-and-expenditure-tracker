import React from "react";
import { LayoutDashboard, TrendingDown, TrendingUp, BookOpen, GitCompare, BarChart3, CreditCard, Tag, Wallet, Menu, User } from "lucide-react";

type Page = "dashboard" | "expenses" | "income" | "budget" | "comparison" | "reports" | "loans" | "categories" | "settings";

const NAV_ITEMS: { id: Page; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "budget", label: "Budget Planner", icon: BookOpen },
  { id: "comparison", label: "Budget Comparison", icon: GitCompare },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "loans", label: "Loan Tracking", icon: CreditCard },
  { id: "categories", label: "Manage Categories", icon: Tag },
];

export function Sidebar({ current, onChange, collapsed, onToggle, userProfile }: {
  current: Page; onChange: (p: Page) => void; collapsed: boolean; onToggle: () => void; userProfile: { name: string, email: string };
}) {
  return (
    <aside className="flex flex-col h-full transition-all duration-300 flex-shrink-0 bg-neu z-20 relative shadow-[9px_0_16px_rgba(163,177,198,0.4)]"
      style={{ width: collapsed ? 60 : 220 }}>
      <div className="flex items-center gap-2.5 px-4 py-6">
        <div className="w-8 h-8 rounded-xl bg-neu shadow-neu-flat flex items-center justify-center flex-shrink-0">
          <Wallet size={16} className="text-[#3b82f6]" />
        </div>
        {!collapsed && (
          <span className="text-[#000000] font-bold text-base leading-tight tracking-wide">
            FinTrack<br />
            <span className="text-[#1e293b] font-medium text-sm">Personal Finance</span>
          </span>
        )}
        <button onClick={onToggle} className="ml-auto w-8 h-8 rounded-xl bg-neu shadow-neu-flat flex items-center justify-center text-[#1e293b] hover:text-[#3b82f6] transition-all hover:shadow-neu-pressed">
          <Menu size={14} />
        </button>
      </div>
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button key={id} onClick={() => onChange(id)} title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 relative
                ${active ? "text-[#3b82f6] shadow-neu-pressed bg-neu" : "text-[#1e293b] hover:shadow-neu-flat bg-neu"}`}>
              <Icon size={18} className={active ? "text-[#3b82f6]" : ""} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-4">
        <div className="p-3 rounded-2xl bg-neu shadow-neu-flat flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl shadow-neu-pressed flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-[#3b82f6]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-[#000000] truncate">{userProfile.name}</p>
              <p className="text-sm font-medium text-[#1e293b] truncate">{userProfile.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
