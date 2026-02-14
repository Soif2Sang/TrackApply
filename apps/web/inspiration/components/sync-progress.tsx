"use client";

import { Loader2 } from "lucide-react";

interface SyncProgressProps {
  current: number;
  total: number;
}

export function SyncProgress({ current, total }: SyncProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const remaining = total - current;

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm text-foreground font-medium">
            Processing emails
          </span>
        </div>
        <div className="flex items-center gap-4">
          {remaining > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {remaining} remaining
            </span>
          )}
          <span className="text-sm font-mono text-foreground tabular-nums">
            {current}
            <span className="text-muted-foreground">/{total}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Job labels ticking through */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[70%]">
          {current > 0
            ? `Parsed job ${current} of ${total}`
            : "Starting scan..."}
        </span>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
