import { useState } from "react"
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  MapPin, 
  Wallet, 
  Calculator,
  FileText,
  Settings,
  TrendingUp,
  ChevronDown,
  Menu
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import crediruta_logo from "@/assets/crediruta-logo.png"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Vista general"
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
    description: "Gestión de deudores"
  },
  {
    title: "Préstamos",
    url: "/prestamos",
    icon: CreditCard,
    description: "Créditos activos"
  },
  {
    title: "Rutas",
    url: "/rutas",
    icon: MapPin,
    description: "Zonas de cobro"
  },
  {
    title: "Cobros",
    url: "/cobros",
    icon: Wallet,
    description: "Pagos y cobranza"
  },
  {
    title: "Base Diaria",
    url: "/base-diaria",
    icon: Calculator,
    description: "Turnos y conciliación"
  }
]

const reportItems = [
  {
    title: "Reportes",
    url: "/reportes",
    icon: FileText,
    description: "Analytics y reportes"
  },
  {
    title: "Métricas",
    url: "/metricas",
    icon: TrendingUp,
    description: "KPIs y dashboards"
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/"
    }
    return currentPath.startsWith(path)
  }

  const getNavClass = (path: string) => {
    const active = isActive(path)
    return active 
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
  }

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img 
              src={crediruta_logo} 
              alt="CrediRuta Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h2 className="font-bold text-lg text-sidebar-foreground">CrediRuta</h2>
              <p className="text-xs text-sidebar-foreground/70">Gestión de Microcréditos</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img 
            src={crediruta_logo} 
            alt="CrediRuta Logo" 
            className="w-8 h-8 rounded-lg mx-auto"
          />
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Operaciones
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${getNavClass(item.url)}`}
                      title={item.description}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Análisis
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${getNavClass(item.url)}`}
                      title={item.description}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/configuracion" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${getNavClass("/configuracion")}`}
              >
                <Settings className="w-5 h-5" />
                {!collapsed && <span className="text-sm">Configuración</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}