import * as React from 'react'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface InputFieldProps extends React.ComponentProps<typeof Input> {
  label?: string
  description?: string
  error?: string
}

export function InputField({
  id,
  label,
  description,
  error,
  className,
  ...props
}: InputFieldProps) {
  const generatedId = React.useId()
  const inputId = id || generatedId

  return (
    <Field className={className}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <Input
        id={inputId}
        aria-invalid={!!error}
        {...props}
      />
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

export default InputField

