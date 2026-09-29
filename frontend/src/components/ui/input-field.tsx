import * as React from 'react'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface InputFieldProps extends React.ComponentProps<typeof Input> {
  label?: string
  description?: string
  error?: string
}

/**
 * @brief Renders a labeled text input with an optional description or error message.
 * @param id Input element id; a generated unique id is used when omitted.
 * @param label Optional label text displayed above the input.
 * @param description Optional helper text shown below the input when there is no error.
 * @param error Error message that marks the input invalid and replaces the description.
 * @param className CSS classes applied to the wrapping Field container.
 * @param props Remaining input props forwarded to the underlying Input component.
 * @return A Field containing the label, an Input with a generated id when none is given, and the description or error text.
 */
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

