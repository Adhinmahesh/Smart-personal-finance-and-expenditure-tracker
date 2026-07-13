import React from "react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <span className="text-7xl">🔍</span>
      <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
      <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist.</p>
    </div>
  );
}
