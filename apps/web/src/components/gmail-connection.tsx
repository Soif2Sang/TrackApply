import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Loader2, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";

function formatRelativeDate(dateString: string | null | undefined) {
  if (!dateString) return "Never";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function GmailConnection() {
  const { data: session } = authClient.useSession();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3002";

  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);

  const [googleProjectId, setGoogleProjectId] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");

  const [applicationSyncLastCompletedAt, setApplicationSyncLastCompletedAt] = useState<string | null>(null);
  const [applicationSyncHistoryEarliestDate, setApplicationSyncHistoryEarliestDate] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null);
  const [lastPollStatus, setLastPollStatus] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!session?.user?.id) {
      setIsConnected(false);
      setIsConfigured(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${serverUrl}/auth/gmail/status`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Gmail status");
      }

      const data = await response.json();
      setIsConnected(Boolean(data.connected));
      setIsConfigured(Boolean(data.configured));
      setApplicationSyncLastCompletedAt(data.applicationSyncLastCompletedAt);
      setApplicationSyncHistoryEarliestDate(data.applicationSyncHistoryEarliestDate);
      setLastPolledAt(data.lastPolledAt ?? null);
      setLastPollStatus(data.lastPollStatus ?? null);
    } catch {
      setIsConnected(false);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailConnected = params.get("gmail_connected");
    const error = params.get("error");

    if (gmailConnected === "true") {
      toast.success("Gmail connected successfully!");
      setIsConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
      window.location.reload();
    } else if (error) {
      let errorMessage = "Failed to connect Gmail";
      switch (error) {
        case "missing_project_config":
          errorMessage = "Configure your Google project credentials first";
          break;
        case "gmail_auth_failed":
          errorMessage = "Gmail authorization was declined";
          break;
        case "no_refresh_token":
          errorMessage = "Failed to get refresh token";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange authorization code";
          break;
        case "unauthorized":
          errorMessage = "Session expired. Please sign in again";
          break;
        case "invalid_state":
          errorMessage = "Security check failed. Please retry Gmail connection";
          break;
      }
      toast.error(errorMessage);
      setIsConnecting(false);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSaveConfig = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in first");
      return;
    }

    if (!googleProjectId.trim() || !googleClientId.trim() || !googleClientSecret.trim()) {
      toast.error("All project credential fields are required");
      return;
    }

    setIsSavingConfig(true);
    try {
      const response = await fetch(`${serverUrl}/auth/gmail/configure`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleProjectId: googleProjectId.trim(),
          googleClientId: googleClientId.trim(),
          googleClientSecret: googleClientSecret.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save credentials");
      }

      toast.success("Google project credentials saved");
      setGoogleClientSecret("");
      setEditingConfig(false);
      await fetchStatus();
    } catch {
      toast.error("Failed to save Google project credentials");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleConnect = () => {
    if (!session?.user?.id) {
      toast.error("Please sign in first");
      return;
    }

    setIsConnecting(true);
    const connectUrl = `${serverUrl}/auth/gmail/connect`;
    window.location.href = connectUrl;
  };

  const handleDisconnect = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${serverUrl}/auth/gmail/disconnect`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setIsConnected(false);
        setApplicationSyncLastCompletedAt(null);
        setApplicationSyncHistoryEarliestDate(null);
        setLastPolledAt(null);
        setLastPollStatus(null);
        toast.success("Gmail disconnected");
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      toast.error("Failed to disconnect Gmail");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isConnecting) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Mail className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Gmail {isConnected ? "Connected" : isConfigured ? "Ready to Connect" : "Setup Required"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isConnected 
                ? "Inbox is polled every 5 minutes"
                : "Step 1: Save Google project credentials • Step 2: Connect Gmail"}
            </p>

            {(!isConfigured || editingConfig) && (
              <div className="mt-2 grid gap-2 max-w-sm">
                <Input
                  value={googleProjectId}
                  onChange={(e) => setGoogleProjectId(e.target.value)}
                  placeholder="Google Project ID"
                  className="h-8 text-xs"
                />
                <Input
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="OAuth Client ID"
                  className="h-8 text-xs"
                />
                <Input
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  type="password"
                  placeholder="OAuth Client Secret"
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleSaveConfig} disabled={isSavingConfig}>
                    {isSavingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Credentials"}
                  </Button>
                  {editingConfig && isConfigured && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingConfig(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isConnected && (
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  <span>Last: {formatRelativeDate(applicationSyncLastCompletedAt)}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <span>From: {formatRelativeDate(applicationSyncHistoryEarliestDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <span>Poll: {formatRelativeDate(lastPolledAt)}</span>
                </div>
                {lastPollStatus && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <span>Status: {lastPollStatus}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingConfig((value) => !value)}
              className="gap-1.5"
            >
              Update Credentials
            </Button>
            <Button 
              variant="chip" 
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isConfigured && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingConfig((value) => !value)}
              >
                Update Credentials
              </Button>
            )}
            <Button 
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting || !isConfigured}
              className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  Connect
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
