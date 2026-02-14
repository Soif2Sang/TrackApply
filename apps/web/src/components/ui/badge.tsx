import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium font-mono transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        applied: "bg-emerald-500/20 text-emerald-400",
        interview: "bg-blue-500/20 text-blue-400",
        offer: "bg-purple-500/20 text-purple-400",
        rejected: "bg-red-500/20 text-red-400",
        ghosted: "bg-muted text-muted-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
