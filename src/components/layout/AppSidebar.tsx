import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  FileText,
  Settings,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import creditflow_logo from "@/assets/creditflow-logo-large.svg"
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigationItems = [
  { title: "Dashboard",    url: "/dashboard",    icon: LayoutDashboard, description: "Vista general" },
  { title: "Clientes",     url: "/clientes",     icon: Users,           description: "Gestión de deudores" },
  { title: "Préstamos",    url: "/prestamos",    icon: CreditCard,      description: "Créditos activos" },
  { title: "Presupuesto",  url: "/presupuesto",  icon: CalendarDays,    description: "Cobro diario por ruta" },
  { title: "Cobros",       url: "/cobros",       icon: Wallet,          description: "Pagos y cobranza" },
]

const reportItems = [
  { title: "Reportes", url: "/reportes", icon: FileText,   description: "Analytics y reportes" },
  { title: "Métricas", url: "/metricas", icon: TrendingUp, description: "KPIs y dashboards" },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath === path || currentPath.startsWith(path + "/")
  }

  /* Active class applied to NavLink wrapper */
  const linkClass = (path: string) =>
    cn(
      "flex items-center w-full rounded-lg transition-all duration-200",
      collapsed ? "justify-center p-0" : "gap-3 px-3 py-2",
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary"
        : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
    )

  /* ── Reusable nav item ──────────────────────────────────────────────────── */
  const NavItem = ({ item }: { item: typeof navigationItems[0] }) => {
    const active = isActive(item.url)

    if (collapsed) {
      return (
        <SidebarMenuItem className="flex justify-center">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={active}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center justify-center rounded-lg transition-all duration-200",
                    active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </NavLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs opacity-70">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      )
    }

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild className="h-12" isActive={active}>
          <NavLink
            to={item.url}
            className={linkClass(item.url)}
            title={item.description}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs opacity-70">{item.description}</span>
            </div>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border p-2">
        {collapsed ? (
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg hover:bg-sidebar-accent/50 transition-colors"
            title="Expandir sidebar"
          >
            <PanelLeftOpen className="w-5 h-5 text-sidebar-foreground" />
          </button>
        ) : (
          <div className="flex items-center justify-between px-1">
            <img
              src={creditflow_logo}
              alt="CREDITFLOW Logo"
              className="w-36 h-10 object-contain"
            />
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors flex-shrink-0"
              title="Contraer sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-sidebar-foreground/60" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <SidebarContent className={cn("py-4", collapsed ? "px-1" : "px-2")}>

        {/* Operaciones */}
        <SidebarGroup className={collapsed ? "px-0" : undefined}>
          <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(collapsed && "items-center")}>
              {navigationItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Análisis */}
        <SidebarGroup className={collapsed ? "px-0" : undefined}>
          <SidebarGroupLabel>Análisis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(collapsed && "items-center")}>
              {reportItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className={cn(collapsed && "items-center")}>
          <SidebarMenuItem className={cn(collapsed && "flex justify-center")}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild isActive={isActive("/configuracion")}>
                    <NavLink
                      to="/configuracion"
                      className={cn(
                        "flex items-center justify-center rounded-lg transition-all duration-200",
                        isActive("/configuracion")
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Settings className="w-5 h-5" />
                    </NavLink>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p className="font-medium text-sm">Configuración</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <SidebarMenuButton asChild>
                <NavLink
                  to="/configuracion"
                  className={linkClass("/configuracion")}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Configuración</span>
                </NavLink>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}