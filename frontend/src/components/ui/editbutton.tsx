import * as React from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EditButtonProps extends React.ComponentProps<typeof Button> {
  label?: string
  showLabel?: boolean
}

/**
 * @brief Renders a button with a pencil icon and optional label used to trigger editing.
 * @param className Extra CSS classes merged with the default styles for the labelled or icon-only layout.
 * @param variant Button visual variant; defaults to outline.
 * @param size Button size; defaults to sm.
 * @param label Text used for the visible label, aria-label and tooltip; defaults to Modifier.
 * @param showLabel Whether to display the label next to the pencil icon; false gives an icon-only button.
 * @param props Remaining Button props forwarded to the underlying Button component.
 * @return A styled button with a pencil icon and, when showLabel is true, the label text.
 */
export function EditButton({
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Modifier',
  showLabel = true,
  ...props
}: EditButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        showLabel
          ? 'h-8 px-2.5 text-xs gap-1.5 font-medium cursor-pointer transition-colors hover:bg-muted bg-card shadow-2xs border-border/80'
          : 'size-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Pencil className="size-3.5 text-muted-foreground" />
      {showLabel && <span>{label}</span>}
    </Button>
  )
}

export default EditButton
