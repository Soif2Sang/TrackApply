import { useState } from "react";
import { Loader2, Merge, Check, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MergeTarget {
  id: string;
  company: string | null;
  position: string | null;
}

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (absorbedApplicationIds: string[]) => void;
  absorbedApplicationCandidates: MergeTarget[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentCompany: string | null;
  currentPosition: string | null;
  isPending: boolean;
  hasTargets: boolean;
}

export function MergeDialog({
  open,
  onOpenChange,
  onConfirm,
  absorbedApplicationCandidates,
  searchQuery,
  onSearchChange,
  currentCompany,
  currentPosition,
  isPending,
  hasTargets,
}: MergeDialogProps) {
  const [selectedAbsorbedApplicationIds, setSelectedAbsorbedApplicationIds] = useState<string[]>([]);

  const handleClose = () => {
    onOpenChange(false);
    setSelectedAbsorbedApplicationIds([]);
    onSearchChange("");
  };

  const handleConfirm = () => {
    if (selectedAbsorbedApplicationIds.length > 0) {
      onConfirm(selectedAbsorbedApplicationIds);
      setSelectedAbsorbedApplicationIds([]);
      onSearchChange("");
    }
  };

  const toggleAbsorbedApplicationSelection = (applicationId: string) => {
    setSelectedAbsorbedApplicationIds((prev) =>
      prev.includes(applicationId)
        ? prev.filter((id) => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Merge Application</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Merge other applications into{" "}
            <span className="text-foreground font-medium">
              {currentCompany ?? "Unknown company"} - {currentPosition ?? "Unknown position"}
            </span>
            . All emails and events from selected applications will be moved to
            this one.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 block">
            Select applications to merge
          </Label>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or position..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-secondary border-border text-foreground text-sm"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {absorbedApplicationCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {!hasTargets
                  ? "No other applications available to merge into"
                  : "No applications match your search"}
              </p>
            ) : (
              absorbedApplicationCandidates.map((absorbedApplicationCandidate) => (
                <div
                  key={absorbedApplicationCandidate.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-md border transition-all group",
                    selectedAbsorbedApplicationIds.includes(absorbedApplicationCandidate.id)
                      ? "border-blue-500/60 bg-blue-500/10"
                      : "border-border hover:border-blue-500/30 hover:bg-blue-500/5"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleAbsorbedApplicationSelection(absorbedApplicationCandidate.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                            {absorbedApplicationCandidate.company ?? <span className="italic text-muted-foreground">Unknown company</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {absorbedApplicationCandidate.position ?? <span className="italic">Unknown position</span>}
                          </p>
                      </div>
                      {selectedAbsorbedApplicationIds.includes(absorbedApplicationCandidate.id) && (
                        <Check className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                  </button>
                  <a
                    href={`/applications/${absorbedApplicationCandidate.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            size="sm"
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedAbsorbedApplicationIds.length === 0 || isPending}
            size="sm"
            className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <Merge className="h-3.5 w-3.5" />
                Merge {selectedAbsorbedApplicationIds.length || ""} Applications
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
