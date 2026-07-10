import React from "react";

export function SkeletonCard() {
  return (
    <div className="bg-neu shadow-neu-flat rounded-[2rem] p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-4" />
      <div className="h-8 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-neu shadow-neu-flat rounded-[2rem] p-6 animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-3 bg-muted rounded flex-1" />
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}
