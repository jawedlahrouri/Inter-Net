import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/**
 * @brief Renders the root of a Radix dialog with a data-slot attribute.
 * @param props Remaining Radix Dialog root props (open, onOpenChange, children) forwarded to the root.
 * @return A Radix Dialog.Root element.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * @brief Renders the element that opens the dialog when activated.
 * @param props Remaining Radix Dialog trigger props forwarded to the trigger element.
 * @return A Radix Dialog.Trigger element.
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * @brief Renders the dialog content into a portal outside the current DOM hierarchy.
 * @param props Remaining Radix Dialog portal props forwarded to the portal element.
 * @return A Radix Dialog.Portal element.
 */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * @brief Renders a control that closes the dialog when activated.
 * @param props Remaining Radix Dialog.Close props forwarded unchanged to the close element.
 * @return A Radix Dialog.Close element.
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * @brief Renders the semi-transparent blurred backdrop displayed behind the dialog.
 * @param className Extra CSS classes merged with the default overlay backdrop styles.
 * @param props Remaining Radix Dialog.Overlay props forwarded to the overlay element.
 * @return A styled Radix Dialog.Overlay element covering the viewport.
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the centered dialog panel inside a portal with its overlay and an optional close button.
 * @param className Extra CSS classes merged with the default dialog panel styles.
 * @param children Content rendered inside the dialog panel, before the optional close button.
 * @param showCloseButton Whether to render the top-right X close button; defaults to true.
 * @param props Remaining Radix Dialog.Content props forwarded to the content element.
 * @return A portal containing the overlay and a styled Dialog.Content with the children and the optional close button.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * @brief Renders the flex column container that holds the dialog title and description.
 * @param className Extra CSS classes merged with the default flex column header layout.
 * @param props Remaining div props forwarded to the header element.
 * @return A styled div element with the dialog-header slot.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * @brief Renders the dialog footer that holds action buttons and an optional close button.
 * @param className Extra CSS classes merged with the default footer styles.
 * @param showCloseButton Whether to append an outline Close button after the children; defaults to false.
 * @param children Action buttons or content rendered inside the footer.
 * @param props Remaining div props forwarded to the footer element.
 * @return A styled div with the children and an optional outline Close button.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

/**
 * @brief Renders the accessible title of the dialog with heading styles.
 * @param className Extra CSS classes merged with the default title heading styles.
 * @param props Remaining Radix Dialog.Title props forwarded to the title element.
 * @return A styled Radix Dialog.Title element.
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the muted descriptive text of the dialog.
 * @param className Extra CSS classes merged with the default muted description styles.
 * @param props Remaining Radix Dialog.Description props forwarded to the description element.
 * @return A styled Radix Dialog.Description element.
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
