"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { JobTable } from "@/components/job-table";
import { SyncControls } from "@/components/sync-controls";
import { StatsBar } from "@/components/stats-bar";
import { EmptyState } from "@/components/empty-state";
import { SyncProgress } from "@/components/sync-progress";
import { Mail, LogOut, Zap, ArrowRight } from "lucide-react";
import { MOCK_APPLICATIONS } from "@/lib/mock-data";
import type { JobApplication } from "@/lib/gmail";

export function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const cancelRef = useRef(false);

  const handleConnect = useCallback(() => {
    setConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnected(false);
    setApplications([]);
    setLastSync(null);
    setSyncProgress({ current: 0, total: 0 });
  }, []);

  const handleStatusChange = useCallback(
    (applicationId: string, newStatus: JobApplication["status"]) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    },
    []
  );

  const handleSync = useCallback(async (afterDate?: string) => {
    setSyncing(true);
    cancelRef.current = false;

    let filtered = MOCK_APPLICATIONS;
    if (afterDate) {
      const cutoff = new Date(afterDate).getTime();
      filtered = MOCK_APPLICATIONS.filter(
        (app) => new Date(app.appliedDate).getTime() >= cutoff
      );
    }

    const total = filtered.length;
    setSyncProgress({ current: 0, total });
    setApplications([]);

    // Simulate processing jobs one by one
    for (let i = 0; i < total; i++) {
      if (cancelRef.current) break;
      await new Promise((resolve) => setTimeout(resolve, 180 + Math.random() * 220));
      setSyncProgress({ current: i + 1, total });
      setApplications((prev) => [...prev, filtered[i]]);
    }

    setLastSync(
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setSyncing(false);
    setSyncProgress({ current: 0, total: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col gap-8 mb-10">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-foreground text-xl font-medium tracking-tight">
                  JobPulse
                </h1>
                {connected && (
                  <span className="flex items-center gap-1.5 text-accent text-xs font-mono">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                    </span>
                    Connected
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Track job applications from your Gmail inbox
              </p>
            </div>

            <div className="flex items-center gap-2">
              {connected ? (
                <Button
                  onClick={handleDisconnect}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 gap-2 font-mono text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  size="sm"
                  className="h-9 gap-2 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Connect Gmail
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <StatsBar applications={applications} />
            <div className="flex items-center gap-4">
              {lastSync && (
                <span className="text-xs text-muted-foreground font-mono">
                  Last sync: {lastSync}
                </span>
              )}
              <SyncControls
                onSync={handleSync}
                isSyncing={syncing}
                connected={connected}
              />
            </div>
          </div>
        </header>

        {/* Sync Progress */}
        {syncing && syncProgress.total > 0 && (
          <SyncProgress
            current={syncProgress.current}
            total={syncProgress.total}
          />
        )}

        {/* Content */}
        {applications.length > 0 ? (
          <JobTable applications={applications} onStatusChange={handleStatusChange} />
        ) : !syncing ? (
          <EmptyState connected={connected} />
        ) : null}

        {/* Footer hint */}
        {!connected && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
              <Zap className="h-3 w-3" />
              <span>
                Uses Gmail API read-only access. No emails are stored on any
                server.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
