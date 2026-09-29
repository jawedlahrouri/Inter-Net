import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

/**
 * @brief Renders a styled fieldset element that groups related form fields in a vertical stack.
 * @param className Extra CSS classes merged with the default flex column fieldset styles.
 * @param props Remaining fieldset props forwarded to the fieldset element.
 * @return A fieldset element with the field-set data slot and flex column styling.
 */
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a legend for a field set, styled either as a legend or as a smaller label.
 * @param className Extra CSS classes merged with the default legend styles.
 * @param variant Legend style, either legend or label (smaller); defaults to legend.
 * @param props Remaining legend props forwarded to the legend element.
 * @return A legend element carrying the field-legend data slot and the chosen variant styling.
 */
function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a container that stacks multiple fields vertically and acts as a container query scope.
 * @param className Extra CSS classes merged with the default vertical stack and container query styles.
 * @param props Remaining div props forwarded to the wrapper div.
 * @return A div element with the field-group data slot and flex column layout.
 */
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

/**
 * @brief Renders a single form field wrapper whose layout depends on the chosen orientation.
 * @param className Extra CSS classes merged with the orientation-based field styles.
 * @param orientation Layout of the field: vertical, horizontal or responsive; defaults to vertical.
 * @param props Remaining div props forwarded to the field wrapper div.
 * @return A div with role group, the field data slot, and classes generated from the orientation variant.
 */
function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

/**
 * @brief Renders the column that holds a field's label, description and other text content.
 * @param className Extra CSS classes merged with the default content column styles.
 * @param props Remaining div props forwarded to the content div.
 * @return A div element with the field-content data slot and flex column styling.
 */
function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a field label built on the shared Label component with extra styling for nested fields and checked states.
 * @param className Extra CSS classes merged with the default field label styles.
 * @param props Remaining Label component props forwarded to the underlying Label.
 * @return A Label element with the field-label data slot and field-specific styling.
 */
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a non-label title line for a field using the same styling slot as the field label.
 * @param className Extra CSS classes merged into the title div's styling.
 * @param props Remaining div props forwarded to the underlying div element.
 * @return A div element with the field-label data slot and medium-weight small text styling.
 */
function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders muted helper text describing a field.
 * @param className Extra CSS classes merged into the description paragraph's muted styling.
 * @param props Remaining paragraph props forwarded to the underlying p element.
 * @return A p element with the field-description data slot and muted text styling.
 */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a horizontal separator between fields, optionally with centered text in the middle.
 * @param children Optional content shown as centered text over the separator line.
 * @param className Extra CSS classes merged into the separator wrapper div.
 * @param props Remaining div props forwarded to the underlying wrapper div.
 * @return A div containing a Separator and, when children are given, a centered span with those children.
 */
function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

/**
 * @brief Renders the validation error message for a field, deduplicating multiple errors into a single message or a list.
 * @param className Extra CSS classes merged into the error alert div.
 * @param children Custom error content that overrides the message derived from errors.
 * @param errors Array of error objects with optional message; duplicates are merged into one message or a list.
 * @param props Remaining div props forwarded to the underlying alert div.
 * @return An alert div showing the error content, or null when there is nothing to display.
 */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
