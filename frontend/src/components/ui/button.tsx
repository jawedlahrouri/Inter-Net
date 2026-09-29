import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-xs",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground active:bg-muted/80 text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        ghost:
          "hover:bg-muted hover:text-foreground active:bg-muted/80 text-muted-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 border border-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm min-h-[40px]",
        xs: "h-7 gap-1 px-2 text-xs",
        sm: "h-9 gap-1.5 px-3 text-xs min-h-[36px]",
        lg: "h-11 gap-2 px-5 text-sm min-h-[44px]",
        icon: "size-10 min-h-[40px] min-w-[40px]",
        "icon-sm": "size-9 min-h-[36px] min-w-[36px]",
        "icon-xs": "size-8",
        "icon-lg": "size-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * @brief Renders a styled button element with variant and size options, optionally rendering as its child.
 * @param className Extra CSS classes merged into the button variant classes.
 * @param variant Visual style variant of the button; defaults to default.
 * @param size Size variant of the button; defaults to default.
 * @param asChild When true, renders the child element instead of a button via Slot.
 * @param props Remaining button props forwarded to the underlying element.
 * @return A button element (or Slot when asChild) carrying data attributes and variant classes.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
