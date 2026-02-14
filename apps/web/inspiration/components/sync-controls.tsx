"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Calendar, Loader2 } from "lucide-react";

interface SyncControlsProps {
  onSync: (afterDate?: string) => Promise<void>;
  isSyncing: boolean;
  connected: boolean;
}

export function SyncControls({
  onSync,
  isSyncing,
  connected,
}: SyncControlsProps) {
  const [syncDate, setSyncDate] = useState("");

  const handleSync = useCallback(async () => {
    const formatted = syncDate
      ? syncDate.replace(/-/g, "/")
      : undefined;
    await onSync(formatted);
  }, [syncDate, onSync]);

  if (!connected) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="date"
          value={syncDate}
          onChange={(e) => setSyncDate(e.target.value)}
          className="pl-9 h-9 w-[170px] bg-secondary border-border text-foreground text-sm font-mono [color-scheme:dark]"
          aria-label="Sync from date"
        />
      </div>

      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        size="sm"
        className="h-9 gap-2 border-border bg-secondary text-foreground hover:bg-muted hover:text-foreground font-mono text-xs"
      >
        {isSyncing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {isSyncing ? "Syncing..." : "Sync Emails"}
      </Button>
    </div>
  );
}
