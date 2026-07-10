import React from "react";
import { Search, Bell, Settings } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onSettingsClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ title, subtitle, onSettingsClick, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/40 backdrop-blur-sm flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-neu shadow-neu-pressed border-0 text-foreground text-sm rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-40 placeholder:text-muted-foreground"
          />
        </div>
        <button className="relative p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <button onClick={onSettingsClick} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
