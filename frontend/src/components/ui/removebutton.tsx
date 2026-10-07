import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface RemoveButtonProps extends React.ComponentProps<typeof Button> {
  label?: string
  showLabel?: boolean
}

/**
 * @brief Renders a trash-icon delete button with an optional text label or tooltip.
 * @param className Extra CSS classes merged into the button styling.
 * @param variant Button visual variant; defaults to outline.
 * @param size Button size; defaults to sm.
 * @param label Text used as visible label, aria-label and title; defaults to Supprimer.
 * @param showLabel Whether the text label is shown next to the trash icon; defaults to true.
 * @param props Remaining Button props forwarded to the underlying Button component.
 * @return A button with a trash icon and, when showLabel is true, a label span.
 */
export function RemoveButton({
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Supprimer',
  showLabel = true,
  ...props
}: RemoveButtonProps) {
  const btn = (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        showLabel
          ? 'h-8 px-2.5 text-xs gap-1.5 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/60 cursor-pointer transition-colors bg-card shadow-2xs'
          : 'size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Trash2 className="size-3.5" />
      {showLabel && <span>{label}</span>}
    </Button>
  )

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return btn
}

export default RemoveButton
