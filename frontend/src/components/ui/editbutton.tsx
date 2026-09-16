import * as React from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EditButtonProps extends React.ComponentProps<typeof Button> {
  label?: string
}

export function EditButton({
  className,
  variant = 'ghost',
  size = 'icon',
  label = 'Modifier',
  ...props
}: EditButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'size-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Pencil className="size-3.5" />
    </Button>
  )
}

export default EditButton
