import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmailSyncButton } from "@/components/email-sync-button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  hasFilters: boolean;
  onAddClick: () => void;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  hasFilters,
  onAddClick,
}: SearchBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search company or role..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 h-9 bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground/60 w-[280px]"
            aria-label="Search applications"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <EmailSyncButton />
        <Button
          variant="default"
          size="sm"
          onClick={onAddClick}
          className="gap-2 h-9 text-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Application
        </Button>
      </div>
    </div>
  );
}
