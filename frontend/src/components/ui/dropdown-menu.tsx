"use client"

import * as React from "react"
import { cn } from "cn"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

/**
 * @brief Renders the Radix dropdown menu root that manages the open state of a dropdown menu.
 * @param props All Radix DropdownMenu.Root props (open, onOpenChange, children...) forwarded to the root.
 * @return A Radix DropdownMenu root element tagged with the dropdown-menu data slot.
 */
function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

/**
 * @brief Renders the Radix portal that mounts dropdown menu content outside the current DOM hierarchy.
 * @param props All Radix DropdownMenu.Portal props forwarded to the portal.
 * @return A Radix DropdownMenu portal element tagged with the dropdown-menu-portal data slot.
 */
function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

/**
 * @brief Renders the element that toggles the dropdown menu when clicked.
 * @param props All Radix DropdownMenu.Trigger props (asChild, children, handlers) forwarded to the trigger.
 * @return A Radix DropdownMenu trigger element tagged with the dropdown-menu-trigger data slot.
 */
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

/**
 * @brief Renders the styled floating panel of a dropdown menu inside a portal.
 * @param className Extra CSS classes merged with the default floating panel styles.
 * @param align Alignment of the menu relative to its trigger; defaults to start.
 * @param sideOffset Distance in pixels between the trigger and the menu; defaults to 4.
 * @param props Remaining Radix DropdownMenu.Content props forwarded to the content element.
 * @return A portal containing the styled Radix dropdown menu content element.
 */
function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

/**
 * @brief Renders a Radix group that wraps related dropdown menu items.
 * @param props All Radix DropdownMenu.Group props forwarded to the group element.
 * @return A Radix DropdownMenu group element tagged with the dropdown-menu-group data slot.
 */
function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

/**
 * @brief Renders a styled selectable dropdown menu item with optional inset and destructive variant.
 * @param className Extra CSS classes merged with the default menu item styles.
 * @param inset When true, adds left padding to align the item with items that have icons or indicators.
 * @param variant Visual style of the item, either default or destructive; defaults to default.
 * @param props Remaining Radix DropdownMenu.Item props forwarded to the item element.
 * @return A styled Radix dropdown menu item element carrying inset and variant data attributes.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a dropdown menu item that toggles a checked state and shows a check icon when checked.
 * @param className Extra CSS classes merged with the default checkbox item styles.
 * @param children Label content rendered after the check indicator.
 * @param checked Whether the item is checked; shows the check icon when true.
 * @param inset When true, adds left padding to align the item with other inset items.
 * @param props Remaining Radix DropdownMenu.CheckboxItem props forwarded to the item element.
 * @return A checkbox menu item containing an item indicator with a check icon followed by its children.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

/**
 * @brief Renders a Radix radio group that holds mutually exclusive dropdown menu radio items.
 * @param props All Radix RadioGroup props (value, onValueChange, children) forwarded to the group.
 * @return A Radix dropdown radio group element tagged with the dropdown-menu-radio-group data slot.
 */
function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * @brief Renders a selectable radio item in a dropdown menu with a check indicator on the selected one.
 * @param className Extra CSS classes merged with the default radio item styles.
 * @param children Label content rendered after the selected indicator.
 * @param inset When true, adds left padding to align the item with other inset items.
 * @param props Remaining Radix DropdownMenu.RadioItem props forwarded to the item element.
 * @return A radio menu item containing an item indicator with a check icon followed by its children.
 */
function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/**
 * @brief Renders a small muted label used as a heading inside a dropdown menu.
 * @param className Extra CSS classes merged with the default label styles.
 * @param inset When true, adds left padding to align the label with inset items.
 * @param props Remaining Radix DropdownMenu.Label props forwarded to the label element.
 * @return A styled Radix dropdown menu label element.
 */
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders a thin horizontal divider between dropdown menu items.
 * @param className Extra CSS classes merged with the default divider styles.
 * @param props Remaining Radix DropdownMenu.Separator props forwarded to the separator element.
 * @return A styled Radix dropdown menu separator element.
 */
function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

/**
 * @brief Renders a right-aligned muted span showing a keyboard shortcut hint in a menu item.
 * @param className Extra CSS classes merged with the default muted right-aligned shortcut styles.
 * @param props Remaining span props forwarded to the shortcut span.
 * @return A styled span element tagged with the dropdown-menu-shortcut data slot.
 */
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * @brief Renders the Radix root that manages the open state of a nested dropdown submenu.
 * @param props All Radix DropdownMenu.Sub props forwarded to the submenu root.
 * @return A Radix DropdownMenu sub element tagged with the dropdown-menu-sub data slot.
 */
function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

/**
 * @brief Renders a menu item that opens a submenu and displays a right chevron.
 * @param className Extra CSS classes merged with the default sub-trigger styles.
 * @param inset When true, adds left padding to align the trigger with other inset items.
 * @param children Content rendered before the right chevron icon.
 * @param props Remaining Radix DropdownMenu.SubTrigger props forwarded to the trigger element.
 * @return A styled sub-trigger element containing its children and a right chevron icon.
 */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

/**
 * @brief Renders the styled floating panel of a nested dropdown submenu.
 * @param className Extra CSS classes merged with the default submenu panel styles.
 * @param props Remaining Radix DropdownMenu.SubContent props forwarded to the submenu content element.
 * @return A styled Radix dropdown submenu content element.
 */
function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn("z-50 min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
