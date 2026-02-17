import { Loader2, Plus, Calendar } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_STATUSES, SOURCE_OPTIONS } from "@/constants/applications";
import type { ApplicationStatus } from "@/constants/applications";

interface AddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    company: string;
    position: string;
    jobId: string;
    source: string;
    status: ApplicationStatus;
    appliedDate: string;
  };
  setters: {
    setCompany: (value: string) => void;
    setPosition: (value: string) => void;
    setJobId: (value: string) => void;
    setSource: (value: string) => void;
    setStatus: (value: ApplicationStatus) => void;
    setAppliedDate: (value: string) => void;
  };
  isSubmitting: boolean;
  isValid: boolean;
  onSubmit: () => void;
}

export function AddApplicationDialog({
  open,
  onOpenChange,
  formData,
  setters,
  isSubmitting,
  isValid,
  onSubmit,
}: AddApplicationDialogProps) {
  const {
    company,
    position,
    jobId,
    source,
    status,
    appliedDate,
  } = formData;

  const {
    setCompany,
    setPosition,
    setJobId,
    setSource,
    setStatus,
    setAppliedDate,
  } = setters;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Add New Application
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manually add a job application you submitted outside of email (e.g.,
            LinkedIn Easy Apply, company website).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="company"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                Company *
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google"
                className="h-9 bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="position"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                Position *
              </Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Software Engineer"
                className="h-9 bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="jobId"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
            >
              Job ID
            </Label>
            <Input
              id="jobId"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Optional reference number"
              className="h-9 bg-secondary border-border text-foreground text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="source"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                Source
              </Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-9 bg-secondary border-border text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-foreground"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ApplicationStatus)}
              >
                <SelectTrigger className="h-9 bg-secondary border-border text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ALL_STATUSES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="text-foreground"
                    >
                      <span className="capitalize">
                        {status.replace("-", " ")}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="date"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground"
            >
              Applied Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="pl-9 h-9 bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !isValid}
            size="sm"
            className="gap-2 bg-foreground text-background hover:bg-foreground/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Create Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
