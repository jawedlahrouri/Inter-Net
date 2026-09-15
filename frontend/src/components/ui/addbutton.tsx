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
          'hover:border-foreground/30 hover:bg-muted/20 active:scale-[0.99]',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          'flex flex-col items-center justify-center gap-3 p-6',
          'text-muted-foreground transition-all duration-150 cursor-pointer group select-none',
          className
        )}
        {...props}
      >
        <div className="size-10 rounded-md bg-muted/60 border border-border/80 flex items-center justify-center group-hover:border-foreground/40 group-hover:bg-muted transition-colors">
          <Plus className="size-5 text-foreground/80 group-hover:text-foreground" />
        </div>
        <div className="space-y-1 text-center">
          <span className="text-sm font-medium text-foreground block">
            {label}
          </span>
          <span className="text-xs text-muted-foreground block">
            Météo, API REST JSON ou raccourci
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'size-10 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer transition-all',
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
