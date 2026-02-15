import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export function EmailSyncButton() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [syncProgress, setSyncProgress] = useState(0);
  const queryClient = useQueryClient();

  const { data: queueStats } = useQuery(
    trpc.jobTracking.getAnalyzeQueueStats.queryOptions(undefined, {
      refetchInterval: 3000,
    })
  );
  
  const syncMutation = useMutation({
    ...trpc.jobTracking.triggerSyncFromDate.mutationOptions(),
    onSuccess: (data) => {
      setSyncProgress(100);
      toast.success(data.message, {
        description: `We’re processing your data. You’ll see the results in your dashboard shortly.`,
      });
      // Invalidate and refetch applications
      queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getAnalyzeQueueStats.queryKey(),
      });
      setTimeout(() => {
        setOpen(false);
        setSelectedDate("");
        setSyncProgress(0);
      }, 450);
    },
    onError: (error) => {
      setSyncProgress(0);
      toast.error("Failed to sync emails", {
        description: error.message,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getAnalyzeQueueStats.queryKey(),
      });
    },
  });

  useEffect(() => {
    if (!syncMutation.isPending) return;

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 90) return 90;
        const increment = Math.max(2, Math.round((90 - prev) * 0.2));
        return Math.min(90, prev + increment);
      });
    }, 350);

    return () => clearInterval(interval);
  }, [syncMutation.isPending]);

  const handleSync = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    // Convert date to ISO datetime string
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);

    setSyncProgress(8);
    
    syncMutation.mutate({
      fromDate: date.toISOString(),
    });
  };

  // Get date 30 days ago as default suggestion
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const defaultDate = thirtyDaysAgo.toISOString().split('T')[0];

  // Max date is today
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="whitespace-nowrap">
        Analyze queue: {queueStats?.pending ?? 0} pending
        {queueStats?.active ? ` • ${queueStats.active} active` : ""}
      </Badge>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Emails from Date
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sync Emails from Date</h4>
            <p className="text-xs text-muted-foreground">
              Select a date to sync all emails from that date onwards. This will process and classify your job application emails.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync-date" className="text-sm">
              <Calendar className="inline h-3 w-3 mr-1" />
              Start Date
            </Label>
            <Input
              id="sync-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={maxDate}
              placeholder={defaultDate}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Default: {new Date(defaultDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })} (30 days ago)
            </p>
          </div>

          {syncMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Sync in progress</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
              <p className="text-xs text-muted-foreground">Queuing emails from the selected date…</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending || !selectedDate}
              className="flex-1"
              size="sm"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Sync
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={syncMutation.isPending}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
      </Popover>
    </div>
  );
}
