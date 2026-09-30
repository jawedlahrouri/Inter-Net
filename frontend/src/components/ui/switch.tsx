import * as React from "react"
import { cn } from "cn"

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}

/**
 * @brief Renders an accessible toggle switch button that reports its new checked state on click.
 * @param className Extra CSS classes merged into the switch button styling.
 * @param checked Whether the switch is currently on.
 * @param onCheckedChange Callback invoked with the new checked state when the switch is clicked.
 * @param disabled Disables the switch and blocks toggling when true.
 * @param props Remaining button attributes forwarded to the underlying button element.
 * @param ref Forwarded ref attached to the underlying button element.
 * @return A button with role switch containing a sliding thumb that reflects the checked state.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        ref={ref}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted border-border/60",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-4 bg-primary-foreground" : "translate-x-0"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"
