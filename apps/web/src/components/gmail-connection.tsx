import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export function GmailConnection() {
  const { data: session } = authClient.useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!session?.user?.id) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3002";
        const response = await fetch(`${serverUrl}/auth/gmail/status?userId=${session.user.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch Gmail status");
        }

        const data = await response.json();
        setIsConnected(Boolean(data.connected));
      } catch {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

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
        case "gmail_auth_failed":
          errorMessage = "Gmail authorization was declined";
          break;
        case "no_refresh_token":
          errorMessage = "Failed to get refresh token";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange authorization code";
          break;
      }
      toast.error(errorMessage);
      setIsConnecting(false);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    if (!session?.user?.id) {
      toast.error("Please sign in first");
      return;
    }

    setIsConnecting(true);
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3002";
    const connectUrl = `${serverUrl}/auth/gmail/connect?userId=${session.user.id}`;
    window.location.href = connectUrl;
  };

  const handleDisconnect = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3002";
      const response = await fetch(`${serverUrl}/auth/gmail/disconnect?userId=${session.user.id}`, {
        method: "POST",
      });

      if (response.ok) {
        setIsConnected(false);
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
              Gmail {isConnected ? "Connected" : "Not Connected"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isConnected 
                ? "Emails will be automatically synced" 
                : "Connect to sync job application emails"}
            </p>
          </div>
        </div>

        {isConnected ? (
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
        ) : (
          <Button 
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
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
        )}
      </div>
    </div>
  );
}
