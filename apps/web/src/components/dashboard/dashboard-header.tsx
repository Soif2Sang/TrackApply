import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onSignOut: () => void;
}

export function DashboardHeader({ onSignOut }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-foreground text-xl font-medium tracking-tight">
            TrackApply
          </h1>
          <span className="flex items-center gap-1.5 text-accent text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Connected
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Track job applications from your Gmail inbox
        </p>
      </div>

      <div className="flex items-center gap-2">
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
  );
}
