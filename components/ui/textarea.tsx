import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-white/45 bg-white/35 px-3.5 py-2.5 text-base shadow-[inset_0_1px_0_hsl(0_0%_100%/0.65),0_8px_20px_hsl(var(--foreground)/0.05)] ring-offset-background backdrop-blur-xl transition-shadow placeholder:text-muted-foreground/90 focus-visible:border-primary/60 focus-visible:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.12] dark:bg-white/10 dark:focus-visible:bg-white/15 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
