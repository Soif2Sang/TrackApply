import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
import { SyncStatusBar } from "./sync-status-bar";

export function GmailConnection() {
  const { data: session } = authClient.useSession();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3002";

  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [setupAccordionValue, setSetupAccordionValue] =
    useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [showSecret, setShowSecret] = useState(false);
  const hasSetInitialStep = useRef(false);

  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");

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
      // Only set initial step on first load, not on subsequent re-fetches
      if (!hasSetInitialStep.current) {
        if (!data.configured) {
          setCurrentStep(0);
        } else {
          setCurrentStep(4);
        }
        hasSetInitialStep.current = true;
      }
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
    if (!isConfigured || !isConnected) {
      setSetupAccordionValue("google-setup");
    } else {
      setSetupAccordionValue("");
    }
  }, [isConfigured, isConnected]);

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
          errorMessage = "Configure your OAuth credentials first";
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

    if (!googleClientId.trim() || !googleClientSecret.trim()) {
      toast.error("OAuth Client ID and Client Secret are required");
      return;
    }

    setIsSavingConfig(true);
    try {
      const response = await fetch(`${serverUrl}/auth/gmail/configure`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleClientId: googleClientId.trim(),
          googleClientSecret: googleClientSecret.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save credentials");
      }

      toast.success("OAuth credentials saved");
      setGoogleClientSecret("");
      setCurrentStep(4);
      await fetchStatus();
    } catch {
      toast.error("Failed to save OAuth credentials");
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
      <div className="p-4">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const steps = [
    { label: "Create Project", description: "Create a Google Cloud project" },
    { label: "OAuth Client", description: "Configure OAuth credentials" },
    { label: "Test User", description: "Add test user" },
    { label: "Enter Credentials", description: "Input Client ID & Secret" },
    { label: "Connect Gmail", description: "Link your Gmail account" },
  ];

  const canSave =
    googleClientId.trim().length > 0 && googleClientSecret.trim().length > 0;

  return (
    <div className="flex flex-col">
      <Accordion
        type="single"
        collapsible
        value={setupAccordionValue}
        onValueChange={setSetupAccordionValue}
        className="w-full"
      >
        <AccordionItem
          value="google-setup"
          className="border-b-0"
        >
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <GoogleIcon />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Google Setup</p>
                <p className="text-xs text-muted-foreground">
                  Configure OAuth and connect your Gmail account
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pt-5">
            <div className="flex gap-6">
              {/* Left Column - Vertical Stepper */}
              <div className="shrink-0 w-48">
                <div className="flex flex-col gap-1">
                  {steps.map((step, index) => (
                    <div key={step.label} className="flex">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors cursor-pointer hover:opacity-80 ${
                            index < currentStep || (index === 4 && isConnected)
                              ? "bg-foreground text-background"
                              : index === currentStep
                                ? "bg-foreground text-background"
                                : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => {
                            if (index <= currentStep || (index === 4 && isConfigured)) {
                              setCurrentStep(index);
                            }
                          }}
                        >
                          {index < currentStep || (index === 4 && isConnected) ? (
                            <CheckIcon />
                          ) : (
                            index + 1
                          )}
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`w-px flex-1 min-h-[24px] transition-colors ${
                              index < currentStep || (index < 4 && isConfigured)
                                ? "bg-foreground"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                      <div className="ml-3 pb-5">
                        <p
                          className={`text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${
                            index <= currentStep || (index === 4 && isConnected)
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => {
                            if (index <= currentStep || (index === 4 && isConfigured)) {
                              setCurrentStep(index);
                            }
                          }}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Content */}
              <div className="flex-1 min-w-0">
                <div className="rounded-lg border border-border bg-muted/30 p-5">
                  {currentStep === 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <span className="text-xs font-semibold">1</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Create a Google Cloud Project
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    First, you need to create a project in the Google Cloud Console. This project will host your OAuth application.
                  </p>
                  <div className="rounded-md bg-muted/50 p-3 border border-border">
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Click the link below to create a new project:
                    </p>
                    <a
                      href="https://developers.google.com/workspace/guides/create-project?hl=fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Open Google Cloud Console
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      size="sm"
                      className="min-w-[100px]"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <span className="text-xs font-semibold">2</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Create OAuth Client ID
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Go to <strong>API & Services → Credentials</strong> and create an OAuth client ID. Select <strong>Web application</strong> as the application type.
                  </p>
                  <div className="rounded-md bg-muted/50 p-3 border border-border space-y-2">
                    <p className="text-[11px] font-medium text-foreground">
                      Add these Authorized Redirect URIs:
                    </p>
                    <ul className="text-[11px] text-muted-foreground space-y-1 font-mono">
                      <li>{serverUrl}</li>
                      <li>{serverUrl}/api/auth/callback/google</li>
                      <li>{serverUrl}/auth/gmail/callback</li>
                    </ul>
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-[11px] text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> It may take several minutes for Google to update your project settings.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(0)}
                      className="text-muted-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                      Back
                    </Button>
                    <a
                      href="https://console.cloud.google.com/auth/clients/create"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mr-4"
                    >
                      Open Credentials
                    </a>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      size="sm"
                      className="min-w-[100px]"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <span className="text-xs font-semibold">3</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Add Test User
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    While your app is in testing mode, you must add test users. Go to <strong>Audience</strong> and add your email address as a test user.
                  </p>
                  <div className="rounded-md bg-muted/50 p-3 border border-border">
                    <p className="text-[11px] text-muted-foreground">
                      This allows you to test the OAuth flow before publishing your app.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="text-muted-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                      Back
                    </Button>
                    <a
                      href="https://console.cloud.google.com/auth/audience"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mr-4"
                    >
                      Open Audience
                    </a>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      size="sm"
                      className="min-w-[100px]"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <span className="text-xs font-semibold">4</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Enter OAuth Credentials
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> from the Google Cloud Console and paste them below.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-id" className="text-xs text-foreground">
                        Client ID
                      </Label>
                      <Input
                        id="client-id"
                        type="text"
                        placeholder="123456789-abc.apps.googleusercontent.com"
                        value={googleClientId}
                        onChange={(e) => setGoogleClientId(e.target.value)}
                        className="h-9 text-xs font-mono bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-secret" className="text-xs text-foreground">
                        Client Secret
                      </Label>
                      <div className="relative">
                        <Input
                          id="client-secret"
                          type={showSecret ? "text" : "password"}
                          placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                          value={googleClientSecret}
                          onChange={(e) => setGoogleClientSecret(e.target.value)}
                          className="h-9 text-xs font-mono pr-10 bg-background"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret((value) => !value)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showSecret ? "Hide secret" : "Show secret"}
                        >
                          {showSecret ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                      className="text-muted-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSaveConfig}
                      disabled={!canSave || isSavingConfig}
                      size="sm"
                      className="min-w-[100px]"
                    >
                      {isSavingConfig ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving
                        </span>
                      ) : (
                        <>
                          Save & Continue
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <span className="text-xs font-semibold">5</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Connect Gmail
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isConnected
                      ? "Your Gmail account is successfully connected."
                      : "Use your saved OAuth credentials to connect your Gmail account."}
                  </p>

                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <Button
                        variant="chip"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={isLoading}
                        className="min-w-[140px]"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Disconnecting
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogOut className="h-3.5 w-3.5" />
                            Disconnect
                          </span>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(3)}
                          className="text-muted-foreground"
                        >
                          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                          Back
                        </Button>

                        <Button
                          onClick={handleConnect}
                          disabled={!isConfigured || isConnecting}
                          size="sm"
                          className="min-w-[140px]"
                        >
                          {isConnecting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Connecting
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              Connect Gmail
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {isConnected && <SyncStatusBar />}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
