import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UsageIndicatorProps {
  current: number
  max: number
  label: string
  className?: string
  showProgress?: boolean
  size?: "sm" | "md" | "lg"
}

export function UsageIndicator({
  current,
  max,
  label,
  className,
  showProgress = true,
  size = "md"
}: UsageIndicatorProps) {
  const percentage = Math.min((current / max) * 100, 100)
  
  // Determine status color based on usage percentage
  const getStatusColor = () => {
    if (percentage >= 100) return "destructive"
    if (percentage >= 80) return "secondary" 
    if (percentage >= 60) return "outline"
    return "outline"
  }

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-destructive"
    if (percentage >= 80) return "bg-orange-500"
    if (percentage >= 60) return "bg-yellow-500" 
    return "bg-primary"
  }

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-medium", sizeClasses[size])}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn("text-muted-foreground", sizeClasses[size])}>
            {current} / {max}
          </span>
          <Badge 
            variant={getStatusColor()}
            className={cn(
              "text-xs px-2 py-0.5",
              percentage >= 100 && "animate-pulse"
            )}
          >
            {percentage.toFixed(0)}%
          </Badge>
        </div>
      </div>
      
      {showProgress && (
        <div className="relative">
          <Progress 
            value={percentage} 
            className="h-2"
          />
          <div 
            className={cn(
              "absolute top-0 left-0 h-2 rounded-full transition-all duration-300",
              getProgressColor()
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      
      {/* Warning message when at/near limit */}
      {percentage >= 90 && (
        <p className={cn(
          "text-xs",
          percentage >= 100 ? "text-destructive" : "text-orange-600"
        )}>
          {percentage >= 100 
            ? `Limit reached! Cannot create new ${label.toLowerCase()}.`
            : `Approaching limit. Only ${max - current} ${label.toLowerCase()} remaining.`
          }
        </p>
      )}
    </div>
  )
}

// Compact version for inline usage
export function UsageBadge({
  current,
  max,
  label,
  className
}: Omit<UsageIndicatorProps, "showProgress" | "size">) {
  const percentage = Math.min((current / max) * 100, 100)
  
  const getVariant = () => {
    if (percentage >= 100) return "destructive"
    if (percentage >= 80) return "secondary"
    return "outline"
  }

  return (
    <Badge 
      variant={getVariant()}
      className={cn(
        "gap-1",
        percentage >= 100 && "animate-pulse",
        className
      )}
    >
      <span>{current}/{max}</span>
      <span className="text-xs opacity-70">({percentage.toFixed(0)}%)</span>
    </Badge>
  )
}