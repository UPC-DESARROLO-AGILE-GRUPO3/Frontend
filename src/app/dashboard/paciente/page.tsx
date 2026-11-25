"use client"

import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { usePatientDashboard } from "@/hooks/use-patients"
import { isPatientUser } from "@/types/organization"
import { 
  Plus, 
  Calendar, 
  Activity, 
  Heart, 
  Clock,
  AlertTriangle,
  Stethoscope
} from "lucide-react"
import { PatientLatestVitals } from '@/components/dashboard/doctor/PatientLatestVitals'
import { PatientVitalsHistory } from '@/components/dashboard/doctor/PatientVitalsHistory'
import { usePatientVitals } from '@/hooks/use-edge-service'
import { ClaimDeviceDialog } from '@/components/dashboard/patient/ClaimDeviceDialog' // Import Dialog
import { RealtimeVitalsCard } from '@/components/dashboard/patient/RealtimeVitalsCard'

export default function PacienteDashboard() {
  const { user } = useAuthContext()
  const patientProfileId = user && isPatientUser(user) ? user.profile.id : null
  
  // Fetch vitals directly in the dashboard page
  const { data: vitals, error: vitalsError, refresh, isLoading: isVitalsLoading } = usePatientVitals(user?.type === "PATIENT")
  const deviceNotLinked = vitalsError?.status === 404 && vitalsError.message === "No devices claimed by this patient"

  const { dashboard, isLoading, error, refetch } = usePatientDashboard(patientProfileId)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando dashboard..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="PATIENT">
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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-secondary/20 text-secondary-foreground border-secondary/30'
      case 'SEVERE':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20'
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'MILD':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'Crítico'
      case 'SEVERE':
        return 'Severo'
      case 'MODERATE':
        return 'Moderado'
      case 'MILD':
        return 'Leve'
      default:
        return severity || 'N/A'
    }
  }

  const criticalSymptoms = dashboard.recentSymptoms.filter(s => s.requiresMedicalAttention)

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mi Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <p className="text-lg font-semibold text-foreground">{dashboard.patientName}</p>
              </div>
              {dashboard.doctorName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>Dr. {dashboard.doctorName}</span>
                  <span>•</span>
                  <span>{dashboard.organizationName}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl">
                <Link href="/dashboard/paciente/sintomas/nuevo">
                  <Plus className="mr-2 h-5 w-5" />
                  Reportar Síntoma
                </Link>
              </Button>
              <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2 h-11 px-6">
                <Link href="/dashboard/paciente/citas/nueva">
                  <Calendar className="mr-2 h-5 w-5" />
                  Solicitar Cita
                </Link>
              </Button>
            </div>
          </div>

          <RealtimeVitalsCard />

          {/* Vitals Card Integration */}
          {deviceNotLinked && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-yellow-900">Dispositivo no vinculado</h3>
                        <p className="text-yellow-700 mt-1">Vincula tu banda IoT para ver tus signos vitales en tiempo real.</p>
                    </div>
                    <div className="pt-2">
                        <ClaimDeviceDialog onClaimSuccess={refresh} />
                    </div>
                </CardContent>
            </Card>
          )}
          {vitals && (
            <div className="space-y-6">
                <PatientLatestVitals data={vitals} onRefresh={refresh} isRefreshing={isVitalsLoading} />
                
                {vitals.device_id && (
                    <PatientVitalsHistory 
                        initialDeviceId={vitals.device_id} 
                        currentPatientId={patientProfileId || undefined}
                    />
                )}
            </div>
          )}

          {/* Critical Symptoms Alert */}
          {criticalSymptoms.length > 0 && (
            <Card className="border-2 border-destructive shadow-lg bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardHeader className="border-b border-destructive/30">
                <CardTitle className="text-destructive flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  Atención: Síntomas que requieren atención médica
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {criticalSymptoms.map((symptom) => (
                    <div key={symptom.id} className="flex items-center justify-between p-4 bg-card border-2 border-destructive/20 rounded-xl hover:border-destructive/40 transition-all">
                      <div>
                        <p className="font-bold text-lg">{symptom.symptomName}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {new Date(symptom.occurrenceDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge className={`${getSeverityColor(symptom.severity)} border-2 font-semibold`}>
                        {getSeverityText(symptom.severity)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button asChild className="w-full mt-6 bg-gradient-to-r from-destructive to-secondary text-white hover:opacity-90 transition-opacity h-11 shadow-lg">
                  <Link href="/dashboard/paciente/citas/nueva">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Solicitar Cita de Emergencia
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Próximas Citas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {dashboard.upcomingAppointments}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Citas programadas
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Síntomas Recientes</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Activity className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {dashboard.recentSymptoms.length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Últimos 7 días
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Síntomas Severos</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-destructive mb-1">
                  {dashboard.criticalSymptoms}
                </div>
                <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span>
                  Requieren atención
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  Próximas Citas
                </CardTitle>
                <CardDescription className="mt-1">
                  {dashboard.upcomingAppointmentsList.length} citas programadas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.upcomingAppointmentsList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No tienes citas programadas</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Solicita una cita con tu médico para continuar con tu tratamiento
                      </p>
                      <Button asChild variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground h-11 px-6">
                        <Link href="/dashboard/paciente/citas/nueva">
                          <Calendar className="mr-2 h-5 w-5" />
                          Solicitar Cita
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.upcomingAppointmentsList.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/30">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{appointment.doctorName}</p>
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
                {dashboard.upcomingAppointmentsList && dashboard.upcomingAppointmentsList.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/paciente/citas">
                        Ver Todas las Citas
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Symptoms */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Activity className="h-6 w-6 text-secondary" />
                  </div>
                  Síntomas Recientes
                </CardTitle>
                <CardDescription className="mt-1">
                  Últimos {dashboard.recentSymptoms.length} síntomas reportados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {dashboard.recentSymptoms.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No has reportado síntomas recientemente</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Reporta tus síntomas para ayudar a tu médico a monitorear tu estado
                      </p>
                      <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg">
                        <Link href="/dashboard/paciente/sintomas/nuevo">
                          <Plus className="mr-2 h-5 w-5" />
                          Reportar Síntoma
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    dashboard.recentSymptoms.slice(0, 5).map((symptom) => (
                      <div
                        key={symptom.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/40 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-lg">{symptom.symptomName}</p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {new Date(symptom.occurrenceDate).toLocaleDateString('es-ES')} •{' '}
                            {symptom.occurrenceTime}
                          </p>
                        </div>
                        <Badge className={`${getSeverityColor(symptom.severity)} border-2 font-semibold`}>
                          {getSeverityText(symptom.severity)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                {dashboard.recentSymptoms.length > 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                      <Link href="/dashboard/paciente/sintomas">
                        Ver Todos los Síntomas
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
                  <Link href="/dashboard/paciente/citas">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mis Citas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-secondary hover:text-secondary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/paciente/sintomas">
                    <Activity className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mis Síntomas</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-accent hover:text-accent-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/paciente/historial">
                    <Heart className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mi Historial</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Link href="/dashboard/paciente/perfil">
                    <Stethoscope className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Mi Perfil</span>
                  </Link>
                </Button>
                <ClaimDeviceDialog />
              </div>
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-bold">Tu Información Médica</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Doctor Asignado</p>
                  <p className="font-bold text-lg">{dashboard.doctorName || 'No asignado'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Tipo de Sangre</p>
                  <p className="font-bold text-lg">{dashboard.bloodType || 'No especificado'}</p>
                </div>
                {dashboard.cancerType && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">Diagnóstico</p>
                      <p className="font-bold text-lg">{dashboard.cancerType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">Etapa</p>
                      <p className="font-bold text-lg">{dashboard.cancerStage || 'No especificada'}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors border-2">
                  <Link href="/dashboard/paciente/perfil">
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
