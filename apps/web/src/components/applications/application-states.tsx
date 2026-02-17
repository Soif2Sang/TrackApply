import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  onBack: () => void;
}

export function LoadingState({ onBack }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotFoundStateProps {
  onBack: () => void;
}

export function NotFoundState({ onBack }: NotFoundStateProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Application not found</p>
          <Button className="mt-4" onClick={onBack}>
            Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}
