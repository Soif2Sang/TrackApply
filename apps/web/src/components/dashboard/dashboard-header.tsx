import { Briefcase, Github, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onSignOut: () => void;
}

export function DashboardHeader({ onSignOut }: DashboardHeaderProps) {
  return (
    <nav className="border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">TrackApply</span>
          <span className="flex items-center gap-1.5 text-accent text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Connected
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Soif2Sang/TrackApply"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-2 text-sm font-medium"
          >
            <Github className="h-4 w-4" />
            Star on GitHub
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </Button>
        </div>
      </div>
    </nav>
  );
}
