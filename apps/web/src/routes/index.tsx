import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { JobApplicationsTable } from "@/components/job-applications-table";
import { ApiKeyManager } from "@/components/api-key-manager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Key, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StatCardsWithData } from "@/components/stat-cards";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const handleGoogleSignIn = async () => {
    try {
      console.log("Starting Google sign-in...");
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/",
      });
      console.log("Sign-in result:", result);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // Show loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-border">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Job Application Tracker</h1>
            <p className="text-muted-foreground">
              Automatically track your job applications from email responses
            </p>
          </div>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-primary">
                1
              </div>
              <p>Connect your Gmail account via n8n workflow</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-primary">
                2
              </div>
              <p>AI automatically classifies emails (RECRUITMENT_ACK, NEXT_STEP, DISAPPROVAL)</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-primary">
                3
              </div>
              <p>Track all your applications in one dashboard</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleGoogleSignIn();
            }}
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  // Show job tracker for authenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                <Briefcase className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Job Tracker</h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage your job applications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {/* Stat Cards */}
            <section aria-label="Application statistics">
              <StatCardsWithData />
            </section>

            {/* Applications List */}
            <section aria-label="Applications list">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  All Applications
                </h2>
              </div>
              <JobApplicationsTable />
            </section>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">API Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Manage API keys to connect your n8n workflow with this tracker
                </p>
              </div>
              <ApiKeyManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
