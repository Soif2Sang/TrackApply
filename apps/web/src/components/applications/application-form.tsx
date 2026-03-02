import { useForm } from "@tanstack/react-form";
import type { FieldApi } from "@tanstack/react-form";
import { Loader2, Merge, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormValues {
  company: string;
  position: string;
  jobId: string;
}

interface ApplicationFormProps {
  initialValues: FormValues;
  onSave: (values: FormValues) => void;
  onMerge: () => void;
  onDelete: () => void;
  isSavePending: boolean;
  isMergePending: boolean;
  isDeletePending: boolean;
}

export function ApplicationForm({
  initialValues,
  onSave,
  onMerge,
  onDelete,
  isSavePending,
  isMergePending,
  isDeletePending,
}: ApplicationFormProps) {
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: ({ value }: { value: FormValues }) => {
      onSave(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="rounded-2xl border border-border/60 bg-card/60 p-6"
    >
      <h2 className="text-sm font-medium text-foreground mb-4">Edit Application</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <form.Field
          name="company"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? "Company is required" : undefined,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Company *
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(
                  "h-9 bg-secondary border-border text-foreground text-sm",
                  field.state.meta.errors.length > 0 && "border-red-500"
                )}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="position"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? "Position is required" : undefined,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Position *
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(
                  "h-9 bg-secondary border-border text-foreground text-sm",
                  field.state.meta.errors.length > 0 && "border-red-500"
                )}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="jobId">
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Job ID
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-9 bg-secondary border-border text-foreground text-sm"
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSavePending || isSubmitting}
              size="sm"
              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              {isSavePending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Application"
              )}
            </Button>
          )}
        </form.Subscribe>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={onMerge}
              disabled={isMergePending}
              size="sm"
              variant="outline"
              className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-400"
            >
              {isMergePending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="h-3.5 w-3.5" />
                  Merge
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64 text-center leading-relaxed">
            The email pipeline sometimes creates duplicate applications for the
            same job. Merge moves all emails from this application into another
            one and deletes this entry.
          </TooltipContent>
        </Tooltip>

        <Button
          type="button"
          onClick={onDelete}
          disabled={isDeletePending}
          size="sm"
          variant="outline"
          className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
        >
          {isDeletePending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
