import * as React from 'react'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface RefreshFieldProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  description?: string
  error?: string
  className?: string
  presets?: number[]
}

const DEFAULT_PRESETS = [10, 30, 60, 300]

export function RefreshField({
  label = 'Intervalle de rafraîchissement (s)',
  value,
  onChange,
  min = 5,
  max = 3600,
  description,
  error,
  className,
  presets = DEFAULT_PRESETS,
}: RefreshFieldProps) {
  const generatedId = React.useId()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = Number(e.target.value)
    if (!Number.isNaN(rawVal)) {
      onChange(Math.max(1, rawVal))
    }
  }

  return (
    <Field className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-1">
        {label && <FieldLabel htmlFor={generatedId}>{label}</FieldLabel>}
        {presets.length > 0 && (
          <div className="flex items-center gap-1">
            {presets.map((sec) => (
              <Badge
                key={sec}
                variant={value === sec ? 'default' : 'outline'}
                className="cursor-pointer text-[9px] px-1.5 py-0 h-4"
                onClick={() => onChange(sec)}
              >
                {sec < 60 ? `${sec}s` : `${sec / 60}m`}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Input
        id={generatedId}
        type="number"
        min={min}
        max={max}
        value={value || ''}
        onChange={handleInputChange}
        placeholder="30"
        aria-invalid={!!error}
      />

      {description && !error && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

export default RefreshField
