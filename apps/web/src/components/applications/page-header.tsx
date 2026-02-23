import { ChevronLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  onBack: () => void;
  onSignOut: () => void;
}

export function PageHeader({ onBack, onSignOut }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground h-9 gap-2 font-mono text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Button>
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
