import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_10px_24px_hsl(var(--primary)/0.18)] hover:bg-primary/90 hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.24),0_12px_26px_hsl(var(--primary)/0.24)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18),0_10px_24px_hsl(var(--destructive)/0.18)] hover:bg-destructive/90",
        outline:
          "border border-white/45 bg-white/35 text-foreground backdrop-blur-xl shadow-[inset_0_1px_0_hsl(0_0%_100%/0.65),0_10px_24px_hsl(var(--foreground)/0.07)] hover:border-primary/35 hover:bg-white/45 dark:border-white/[0.12] dark:bg-white/10 dark:hover:bg-white/15",
        secondary:
          "bg-secondary/75 text-secondary-foreground backdrop-blur-xl shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_8px_20px_hsl(var(--secondary)/0.12)] hover:bg-secondary/88",
        tertiary:
          "bg-accent/92 text-accent-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.16),0_8px_22px_hsl(var(--accent)/0.16)] hover:bg-accent/88",
        ghost:
          "hover:bg-muted/65 hover:text-foreground hover:backdrop-blur-xl",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
