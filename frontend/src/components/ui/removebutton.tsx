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
  label = 'Supprimer le widget',
  ...props
}: RemoveButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'size-9 min-w-[36px] min-h-[36px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Trash2 className="size-4" />
    </Button>
  )
}

export default RemoveButton
