"use client"

import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { useDoctorDashboard } from "@/hooks/use-doctors"
import { isDoctorUser } from "@/types/organization"
import { 
  Plus, 
  Calendar, 
  Users, 
  Activity, 
  Heart, 
  Clock
} from "lucide-react"

export default function MedicoDashboard() {
  const { user } = useAuthContext()
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null

  const { dashboard, isLoading, error, refetch } = useDoctorDashboard(doctorProfileId)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando dashboard..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!dashboard) {
    return null
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Dashboard Médico
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-lg font-semibold text-foreground">Dr. {dashboard.doctorName}</p>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>{dashboard.specialization}</span>
                <span>•</span>
                <span>{dashboard.organizationName}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl">
                <Link href="/dashboard/medico/pacientes/nuevo">
                  <Plus className="mr-2 h-5 w-5" />
                  Nuevo Paciente
                </Link>
              </Button>
              <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2 h-11 px-6">
                <Link href="/dashboard/medico/citas/nueva">
                  <Calendar className="mr-2 h-5 w-5" />
                  Nueva Cita
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pacientes</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {dashboard.totalPatients}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {dashboard.activePatients} activos
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Citas Totales</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {dashboard.totalAppointments}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {dashboard.completedAppointments} completadas
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Próximas Citas</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {dashboard.upcomingAppointments}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Por confirmar
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Síntomas</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Activity className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {dashboard.totalSymptomsReported}
                </div>
                <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span>
                  {dashboard.criticalSymptoms} críticos
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Organización</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-sm font-bold truncate text-foreground mb-1">
                  {dashboard.organizationName || 'Sin organización'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ID: {dashboard.organizationId}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Appointments */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  Próximas Citas
                </CardTitle>
                <CardDescription className="mt-1">
                  {dashboard.upcomingAppointmentsList.length} citas próximas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.upcomingAppointmentsList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium mb-4">
                        No hay citas próximas
                      </p>
                      <Button asChild variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground">
                        <Link href="/dashboard/medico/citas/nueva">
                          <Calendar className="mr-2 h-4 w-4" />
                          Crear Nueva Cita
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.upcomingAppointmentsList.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/30">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{appointment.patientName}</p>
                            <p className="text-sm text-muted-foreground font-medium">
                              {appointment.type} • {appointment.durationMinutes} min
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {new Date(appointment.appointmentDate).toLocaleDateString('es-ES', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(appointment.appointmentDate).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {dashboard.upcomingAppointmentsList.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/medico/citas">
                        Ver Todas las Citas
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  Mis Pacientes
                </CardTitle>
                <CardDescription className="mt-1">
                  {dashboard.patients.length} pacientes registrados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.patients.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No hay pacientes registrados</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Comienza agregando pacientes para gestionar sus tratamientos y citas
                      </p>
                      <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg">
                        <Link href="/dashboard/medico/pacientes/nuevo">
                          <Plus className="mr-2 h-5 w-5" />
                          Agregar Primer Paciente
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center space-x-4 p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-lg">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {patient.cancerType || 'Sin diagnóstico'}
                          </p>
                        </div>
                        <Badge variant={patient.isActive ? 'default' : 'secondary'} className="border-2">
                          {patient.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                {dashboard.patients.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/medico/pacientes">
                        Ver Todos los Pacientes ({dashboard.patients.length})
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-2xl font-bold">Acciones Rápidas</CardTitle>
              <CardDescription className="mt-1">
                Accesos directos a las funciones más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/medico/pacientes">
                    <Users className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Gestionar Pacientes</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-secondary hover:text-secondary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/medico/citas">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Ver Citas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-accent hover:text-accent-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/medico/calendario">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Calendario</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/medico/reportes">
                    <Activity className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Reportes</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Info */}
          <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-bold">Tu Perfil Profesional</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Especialización</p>
                  <p className="font-bold text-lg">{dashboard.specialization}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Organización</p>
                  <p className="font-bold text-lg">{dashboard.organizationName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Pacientes</p>
                  <p className="font-bold text-lg">
                    {dashboard.totalPatients || 0} registrados
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Estado</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <p className="font-bold text-lg text-primary">Activo</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                  <Link href="/dashboard/medico/perfil">
                    Ver Perfil Completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
