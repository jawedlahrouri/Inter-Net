import * as React from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EditButtonProps extends React.ComponentProps<typeof Button> {
  label?: string
  showLabel?: boolean
}

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
