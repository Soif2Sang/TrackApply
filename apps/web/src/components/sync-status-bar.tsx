import { Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { trpc } from "@/utils/trpc"

export function SyncStatusBar() {
  const { data: queueStats } = useQuery(
    trpc.jobTracking.getAnalyzeQueueStats.queryOptions(undefined, {
      refetchInterval: 3000,
    })
  )

  const pending = queueStats?.pending ?? 0
  const active = queueStats?.active ?? 0
  const queueLabel = active ? `${pending} pending · ${active} active` : `${pending} pending`

  return (
    <div className="flex items-center gap-4 rounded-md bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          Last sync: <span className="font-medium text-foreground">Today</span>
        </span>
        <span className="hidden text-border sm:inline">|</span>
        <span>
          History since:{" "}
          <span className="font-medium text-foreground">1 months ago</span>
        </span>
        <span className="hidden text-border sm:inline">|</span>
        <span>
          Last check:{" "}
          <span className="font-medium text-foreground">Today</span>
        </span>
        <span className="hidden text-border sm:inline">|</span>
        <span>
          Analyze queue:{" "}
          <span className="font-medium text-foreground">{queueLabel}</span>
        </span>
      </div>
    </div>
  )
}
