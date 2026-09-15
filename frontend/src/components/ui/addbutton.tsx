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
          'min-h-[320px] w-full rounded-xl border-2 border-dashed border-border',
          'hover:border-foreground/40 hover:bg-muted/30',
          'flex flex-col items-center justify-center gap-3',
          'text-muted-foreground transition-all cursor-pointer group',
          className
        )}
        {...props}
      >
        <div className="p-3 rounded-full bg-muted border border-border group-hover:scale-110 group-hover:border-foreground/40 transition-all">
          <Plus className="size-5 text-foreground" />
        </div>
        <span className="text-sm font-medium group-hover:text-foreground transition-colors">
          {label}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'size-8 inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted cursor-pointer transition-all hover:scale-105 active:scale-95',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Plus className="size-4 text-foreground" />
    </button>
  )
}

export default AddButton
