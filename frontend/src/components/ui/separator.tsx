"use client"

import * as React from "react"
import { cn } from "cn"
import { Separator as SeparatorPrimitive } from "radix-ui"

/**
 * @brief Renders a thin horizontal or vertical divider line.
 * @param className Extra CSS classes merged into the separator styling.
 * @param orientation Direction of the divider, horizontal or vertical; defaults to horizontal.
 * @param decorative Whether the separator is purely visual and hidden from assistive tech; defaults to true.
 * @param props Remaining props forwarded to the Radix Separator root element.
 * @return A Radix Separator root element styled as a divider.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
