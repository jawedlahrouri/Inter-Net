import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface RemoveButtonProps extends React.ComponentProps<typeof Button> {
  label?: string
}

export function RemoveButton({
  className,
  variant = 'ghost',
  size = 'icon',
  label = 'Supprimer',
  ...props
}: RemoveButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Trash2 className="size-3.5" />
    </Button>
  )
}

export default RemoveButton

