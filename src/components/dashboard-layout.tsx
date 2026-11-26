"use client"

import type React from "react"

import { useState, memo, useMemo, useCallback, useEffect } from "react"
import { OnControlLogo } from "./oncontrol-logo"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Badge } from "./ui/badge"
import {
  Users,
  Calendar,
  Heart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  MessageCircle,
  X,
  Home,
  Stethoscope,
  Activity,
  FileText,
  Wifi,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/auth-context"
import { Loading } from "./loading"
import { NotificationsBell } from "./notifications-bell"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading, isAuthenticated } = useAuthContext()

  // Determine user type based on the new architecture
  const userType = user?.type === 'ORGANIZATION' ? 'organizacion' : 
                   user?.type === 'DOCTOR' ? 'medico' : 'paciente'

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  const organizacionNavItems = useMemo(() => [
    { href: "/dashboard/organizacion", icon: Home, label: "Dashboard", badge: null },
    { href: "/dashboard/organizacion/doctores", icon: Stethoscope, label: "Doctores", badge: null },
  ], [])

  const medicoNavItems = useMemo(() => [
    { href: "/dashboard/medico", icon: Home, label: "Dashboard", badge: null },
    { href: "/dashboard/medico/pacientes", icon: Users, label: "Pacientes", badge: null },
    { href: "/dashboard/medico/citas", icon: Calendar, label: "Citas", badge: null },
    { href: "/dashboard/medico/calendario", icon: Calendar, label: "Calendario", badge: null },
    { href: "/dashboard/medico/tratamientos", icon: Heart, label: "Tratamientos", badge: null },
    { href: "/dashboard/medico/chat", icon: MessageCircle, label: "Chat", badge: null },
    { href: "/dashboard/medico/reportes", icon: BarChart3, label: "Reportes", badge: null },
  ], [])

  const pacienteNavItems = useMemo(() => [
    { href: "/dashboard/paciente", icon: Home, label: "Dashboard", badge: null },
    { href: "/dashboard/paciente/tratamiento", icon: Heart, label: "Mi Tratamiento", badge: null },
    { href: "/dashboard/paciente/citas", icon: Calendar, label: "Mis Citas", badge: null },
    { href: "/dashboard/paciente/chat", icon: MessageCircle, label: "Chat", badge: null },
    { href: "/dashboard/paciente/sintomas", icon: Activity, label: "Síntomas", badge: null },
    { href: "/dashboard/paciente/medicamentos", icon: Stethoscope, label: "Medicamentos", badge: null },
    { href: "/dashboard/paciente/historial", icon: FileText, label: "Historial", badge: null },
    { href: "/dashboard/paciente/iot", icon: Wifi, label: "Monitor IoT", badge: null },
    ...(process.env.NEXT_PUBLIC_STRIPE_SANDBOX_ENABLED === "true"
      ? [{ href: "/dashboard/paciente/pagos", icon: CreditCard, label: "Métodos de pago", badge: null }]
      : []),
  ], [])

  const navItems = useMemo(() => {
    if (userType === "organizacion") return organizacionNavItems
    if (userType === "medico") return medicoNavItems
    return pacienteNavItems
  }, [userType, organizacionNavItems, medicoNavItems, pacienteNavItems])

  // Redirect to login if not authenticated (after all hooks)
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, user, router])

  // Show loading while checking authentication
  if (isLoading) {
    return <Loading message="Verificando autenticación..." />
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  const NavItem = memo(function NavItem({ href, icon: Icon, label, badge, collapsed }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; badge: string | null; collapsed?: boolean }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-semibold relative overflow-hidden ${
          isActive 
            ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-105" 
            : "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-105"
        } ${collapsed ? 'justify-center px-3' : ''}`}
        onClick={() => setSidebarOpen(false)}
        title={collapsed ? label : undefined}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/30 rounded-r-full" />
        )}
        <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'group-hover:scale-110'}`} />
        {!collapsed && (
          <>
            <span className={`font-semibold transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              {label}
            </span>
            {badge && (
              <Badge variant="secondary" className="ml-auto">
                {badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-4 top-4 bottom-4 w-72 dynamic-island-sidebar rounded-3xl shadow-2xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-border/30 min-h-[80px]">
                <OnControlLogo size="md" />
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="hover:bg-primary/10 rounded-full h-9 w-9 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar - Dynamic Island Vertical */}
      <div className={`hidden lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:z-50 lg:block dynamic-island-sidebar rounded-3xl transition-all duration-500 ease-out ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/30 min-h-[80px]">
            {!sidebarCollapsed ? (
              <>
                <OnControlLogo size="md" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hover:bg-primary/10 transition-all rounded-full h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/30">
                  <span className="text-lg font-bold text-primary">O</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hover:bg-primary/10 transition-all rounded-full h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} collapsed={sidebarCollapsed} />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-500 ease-out ${sidebarCollapsed ? 'lg:pl-28' : 'lg:pl-80'}`}>
        {/* Top bar - Dynamic Island Horizontal */}
        <header className="sticky top-4 z-40 mx-4 mt-4 mb-6 dynamic-island-navbar rounded-2xl shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden hover:bg-primary/10 rounded-full h-9 w-9 p-0 shadow-sm" 
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {userType === "organizacion" ? "Panel de Organización" : 
                   userType === "medico" ? "Panel Médico" : "Panel Paciente"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user.type !== "ORGANIZATION" && (
                <NotificationsBell
                  key={user.profile.profileId}
                  appointmentsHref={user.type === "DOCTOR" ? "/dashboard/medico/citas" : "/dashboard/paciente/citas"}
                  treatmentProposalsHref={user.type === "DOCTOR" ? "/dashboard/medico/tratamientos/propuestas" : "/dashboard/paciente/tratamiento/propuestas"}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                    <Avatar className="h-10 w-10 ring-2 ring-border/50">
                      <AvatarImage src="/hombre-62-a-os-profesional.jpg" alt="Usuario" />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                        {user?.type === 'ORGANIZATION' && 'organizationName' in user
                          ? user.organizationName?.[0] || 'O'
                          : user?.type === 'DOCTOR' && 'profile' in user
                          ? `${user.profile.firstName?.[0] || ''}${user.profile.lastName?.[0] || ''}`
                          : user?.type === 'PATIENT' && 'profile' in user
                          ? `${user.profile.firstName?.[0] || ''}${user.profile.lastName?.[0] || ''}`
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dynamic-island rounded-xl border-border/50" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.type === 'ORGANIZATION' && 'organizationName' in user
                          ? user.organizationName
                          : user?.type === 'DOCTOR' && 'profile' in user
                          ? `Dr. ${user.profile.firstName} ${user.profile.lastName}`
                          : user?.type === 'PATIENT' && 'profile' in user
                          ? `${user.profile.firstName} ${user.profile.lastName}`
                          : 'Usuario'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.type === 'ORGANIZATION' && 'email' in user
                          ? user.email
                          : user?.type === 'DOCTOR' && 'profile' in user
                          ? user.profile.email
                          : user?.type === 'PATIENT' && 'profile' in user
                          ? user.profile.email
                          : ''}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userType !== 'organizacion' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/${userType}/perfil`}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Configuración</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 lg:px-8 pb-8 max-w-7xl mx-auto min-h-[calc(100vh-120px)]">{children}</main>
      </div>
    </div>
  )
})
