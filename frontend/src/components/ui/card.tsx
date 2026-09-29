import * as React from "react"
import { cn } from "cn"

/**
 * @brief Renders the styled card container div that groups related content.
 * @param className Extra CSS classes merged onto the card.
 * @param size Card spacing size, default or sm; defaults to default.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled div tagged with the card data slot and size attribute.
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the header area of a card that lays out the title, description and optional action.
 * @param className Extra CSS classes merged onto the card header.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled grid div tagged with the card-header data slot.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the title text of a card.
 * @param className Extra CSS classes merged onto the card title.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled div tagged with the card-title data slot.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the muted description text under a card title.
 * @param className Extra CSS classes merged onto the card description.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled div tagged with the card-description data slot.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * @brief Renders an action slot positioned at the top right of a card header.
 * @param className Extra CSS classes merged onto the card action slot.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled div tagged with the card-action data slot.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the main body area of a card with horizontal padding.
 * @param className Extra CSS classes merged onto the card content.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled div tagged with the card-content data slot.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

/**
 * @brief Renders the footer area of a card with a top border and muted background.
 * @param className Extra CSS classes merged onto the card footer.
 * @param props Remaining div props forwarded to the underlying element.
 * @return A styled flex div tagged with the card-footer data slot.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
