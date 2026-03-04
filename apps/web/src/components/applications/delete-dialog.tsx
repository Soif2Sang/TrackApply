import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  company: string | null;
  isPending: boolean;
  ignoreEmails: boolean;
  onIgnoreEmailsChange: (checked: boolean) => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  company,
  isPending,
  ignoreEmails,
  onIgnoreEmailsChange,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Delete Application</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete this application for{" "}
            <span className="text-foreground font-medium">{company ?? "Unknown company"}</span>? This
            action cannot be undone and will remove all associated emails and
            events.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="ignoreEmails"
            checked={ignoreEmails}
            onCheckedChange={(checked) => onIgnoreEmailsChange(checked === true)}
          />
          <label
            htmlFor="ignoreEmails"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Never track these emails again
          </label>
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
            onClick={onConfirm}
            disabled={isPending}
            size="sm"
            className="gap-2 bg-red-500 text-white hover:bg-red-600"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
