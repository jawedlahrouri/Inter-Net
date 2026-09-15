import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'card' | 'icon'
  label?: string
}

export function AddButton({
  className,
  variant = 'card',
  label = 'Ajouter un widget',
  ...props
}: AddButtonProps) {
  if (variant === 'card') {
    return (
      <button
        type="button"
        className={cn(
          'min-h-[320px] w-full rounded-lg border border-dashed border-border/80',
          'hover:border-foreground/30 hover:bg-muted/20',
          'flex flex-col items-center justify-center gap-2.5',
          'text-muted-foreground transition-colors cursor-pointer group',
          className
        )}
        {...props}
      >
        <div className="size-8 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center group-hover:border-foreground/30 transition-colors">
          <Plus className="size-4 text-foreground/80" />
        </div>
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'size-8 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted cursor-pointer transition-colors',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Plus className="size-3.5 text-foreground" />
    </button>
  )
}

export default AddButton
