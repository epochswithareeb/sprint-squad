import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        "code-red": "border-transparent bg-code-red text-destructive-foreground shadow-code-red animate-pulse",
        "priority-low": "border-transparent bg-priority-low/20 text-priority-low border-priority-low/30",
        "priority-medium": "border-transparent bg-priority-medium/20 text-priority-medium border-priority-medium/30",
        "priority-high": "border-transparent bg-priority-high/20 text-priority-high border-priority-high/30",
        "status-wip": "border-transparent bg-primary/20 text-primary border-primary/30",
        "status-pending": "border-transparent bg-warning/20 text-warning border-warning/30",
        "status-resolved": "border-transparent bg-success/20 text-success border-success/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
