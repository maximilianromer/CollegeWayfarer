import * as React from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
 
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultCollapsed?: boolean
  collapsed?: boolean
  toggled?: boolean
  toggledContainerOffset?: string
  collapsedWidth?: string
  width?: string
  onCollapsedChange?: (collapsed: boolean) => void
  onToggledChange?: (toggled: boolean) => void
}
 
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      defaultCollapsed = false,
      collapsed,
      toggled,
      toggledContainerOffset = "0px",
      collapsedWidth = "0px",
      width = "300px",
      onCollapsedChange,
      onToggledChange,
      children,
      ...props
    },
    ref
  ) => {
    const [_toggled, setToggled] = React.useState(!toggled)
    const [_collapsed, setCollapsed] = React.useState(defaultCollapsed)
    const isMobile = useMobile()
 
    const __toggled = toggled !== undefined ? toggled : _toggled
    const __collapsed = isMobile ? false : collapsed !== undefined ? collapsed : _collapsed
 
    useMobile({
      onMobileChange: (mobile) => {
        if (mobile) {
          setToggled(toggled ?? false)
        } else {
          setToggled(toggled ?? true)
        }
      },
    })
 
    React.useEffect(() => {
      if (collapsed !== undefined) {
        setCollapsed(collapsed)
      }
    }, [collapsed])
 
    React.useEffect(() => {
      if (toggled !== undefined) {
        setToggled(toggled)
      }
    }, [toggled])
 
    return (
      <div
        data-toggled={__toggled ? "" : undefined}
        className={cn(
          "fixed top-0 left-0 bottom-0 z-20 flex flex-col bg-sidebar border-r border-sidebar-border transition-[margin-left,width] duration-300 ease-in-out",
          __toggled
            ? "ml-0"
            : `ml-[calc(-${width}+${toggledContainerOffset})]`,
          __collapsed ? `w-[${collapsedWidth}]` : `w-[${width}]`,
          className
        )}
        ref={ref}
        {...props}
      >
        {!isMobile && (
          <div className="absolute right-2 top-2">
            <button
              type="button"
              className="h-5 w-5 rounded-full bg-sidebar-accent/80 flex items-center justify-center opacity-70 text-sidebar-accent-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                if (!__collapsed) {
                  onCollapsedChange?.(true)
                  setCollapsed(true)
                } else {
                  onCollapsedChange?.(false)
                  setCollapsed(false)
                }
              }}
            >
              {__collapsed ? (
                <ChevronsRight className="h-3 w-3" />
              ) : (
                <ChevronsLeft className="h-3 w-3" />
              )}
              <span className="sr-only">
                {__collapsed ? "Expand" : "Collapse"}
              </span>
            </button>
          </div>
        )}
        {children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"
 
export const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    type="button"
    className={cn(
      "sticky top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm bg-background/20 text-muted-foreground shadow hover:text-accent-foreground",
      className
    )}
    ref={ref}
    {...props}
  />
))
SidebarToggle.displayName = "SidebarToggle"
 
export interface SidebarHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}
 
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  SidebarHeaderProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 py-4 border-b border-sidebar-border", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"
 
export interface SidebarMainProps extends React.HTMLAttributes<HTMLDivElement> {}
 
export const SidebarMain = React.forwardRef<HTMLDivElement, SidebarMainProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 overflow-auto py-2", className)}
      {...props}
    />
  )
)
SidebarMain.displayName = "SidebarMain"
 
export interface SidebarFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}
 
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  SidebarFooterProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 py-4 border-t border-sidebar-border", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"
 
export interface SidebarNavProps
  extends React.HTMLAttributes<HTMLDivElement> {}
 
export const SidebarNav = React.forwardRef<HTMLDivElement, SidebarNavProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid gap-1 px-2", className)} {...props} />
  )
)
SidebarNav.displayName = "SidebarNav"
 
export interface SidebarNavItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean
  Icon?: React.ReactNode | null
}
 
export const SidebarNavItem = React.forwardRef<
  HTMLAnchorElement,
  SidebarNavItemProps
>(({ active, className, children, Icon = null, ...props }, ref) => (
  <a
    ref={ref}
    aria-current={active ? "page" : undefined}
    className={cn(
      "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-sidebar-primary/10 text-sidebar-primary-foreground"
        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
      className
    )}
    {...props}
  >
    {Icon}
    {children}
  </a>
))
SidebarNavItem.displayName = "SidebarNavItem"
