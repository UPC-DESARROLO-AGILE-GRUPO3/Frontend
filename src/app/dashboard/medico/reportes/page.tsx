"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { reports } from "@/lib/api"
import type { 
  DoctorReportsResponse, 
  PatientsByMonthResponse, 
  TreatmentsByTypeResponse,
  AppointmentsByDayResponse 
} from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Heart, 
  Activity,
  Download,
  Filter,
  PieChart,
  LineChart
} from "lucide-react"

const tipoNames: Record<string, string> = {
  CHEMOTHERAPY: "Quimioterapia",
  RADIOTHERAPY: "Radioterapia",
  IMMUNOTHERAPY: "Inmunoterapia",
  SURGERY: "Cirugía",
  HORMONE_THERAPY: "Terapia Hormonal",
  TARGETED_THERAPY: "Terapia Dirigida"
}

const dayNames: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mié",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sáb",
  SUNDAY: "Dom"
}

export default function ReportesPage() {
  const { user } = useAuthContext()
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null
  const [overview, setOverview] = useState<DoctorReportsResponse | null>(null)
  const [patientsByMonth, setPatientsByMonth] = useState<PatientsByMonthResponse | null>(null)
  const [treatmentsByType, setTreatmentsByType] = useState<TreatmentsByTypeResponse | null>(null)
  const [appointmentsByDay, setAppointmentsByDay] = useState<AppointmentsByDayResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mes")

  useEffect(() => {
    const loadReports = async () => {
      if (!doctorProfileId) return

      try {
        setIsLoading(true)
        setError(null)

        // Load all report data in parallel
        const [overviewData, monthData, typeData, dayData] = await Promise.all([
          reports.getDoctorOverview(doctorProfileId).catch(() => null),
          reports.getPatientsByMonth(doctorProfileId, 6).catch(() => ({ data: [] })),
          reports.getTreatmentsByType(doctorProfileId).catch(() => ({ data: [] })),
          reports.getAppointmentsByDay(doctorProfileId).catch(() => ({ data: [] }))
        ])

        setOverview(overviewData)
        setPatientsByMonth(monthData)
        setTreatmentsByType(typeData)
        setAppointmentsByDay(dayData)
      } catch (err) {
        console.error('Error loading reports:', err)
        setError('Error al cargar los reportes')
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [doctorProfileId])

  const generarReporte = () => {
    console.log("Generando reporte:", { periodoSeleccionado })
    // TODO: Implementar generación de reportes personalizados
  }

  const exportarReporte = () => {
    console.log("Exportando reporte")
    // TODO: Implementar exportación a PDF
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando reportes..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !overview) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || 'Error al cargar los datos'}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
      <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Reportes y Análisis
              </h1>
              <p className="text-muted-foreground text-lg">Análisis detallado del rendimiento y métricas</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 border-2">
                  <Calendar className="mr-2 h-5 w-5" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="trimestre">Este trimestre</SelectItem>
                  <SelectItem value="año">Este año</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={generarReporte} className="border-2 hover:bg-primary hover:text-primary-foreground h-11 px-6">
                <Filter className="mr-2 h-5 w-5" />
                Generar Reporte
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl" onClick={exportarReporte}>
                <Download className="mr-2 h-5 w-5" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pacientes Totales</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{overview.patients.total}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="text-primary font-semibold">+{overview.patients.monthlyGrowth}</span> este mes
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Tratamientos Activos</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Activity className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{overview.treatments.active}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {overview.treatments.averageEffectiveness.toFixed(0)}% efectividad
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Citas Este Mes</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{overview.appointments.totalMonth}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  {overview.appointments.averageOccupancy.toFixed(0)}% ocupación promedio
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Satisfacción</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Heart className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{overview.patients.averageSatisfaction.toFixed(1)}/5</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                  Promedio de pacientes
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de pacientes por mes */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  Crecimiento de Pacientes
                </CardTitle>
                <CardDescription className="mt-1">Evolución mensual de pacientes registrados</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {patientsByMonth?.data && patientsByMonth.data.length > 0 ? (
                  <div className="space-y-4">
                    {patientsByMonth.data.map((item, index) => {
                      const maxCount = Math.max(...patientsByMonth.data.map(d => d.count))
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{item.monthName}</span>
                            <span className="text-sm text-muted-foreground font-semibold">{item.count} pacientes</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                            <div
                              className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 shadow-lg"
                              style={{ width: `${(item.count / (maxCount || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No hay datos de pacientes disponibles</h3>
                    <p className="text-muted-foreground">Los datos aparecerán cuando tengas pacientes registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribución de tratamientos */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <PieChart className="h-6 w-6 text-secondary" />
                  </div>
                  Distribución de Tratamientos
                </CardTitle>
                <CardDescription className="mt-1">Tipos de tratamiento más utilizados</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {treatmentsByType?.data && treatmentsByType.data.length > 0 ? (
                  <div className="space-y-4">
                    {treatmentsByType.data.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">
                            {tipoNames[item.type] || item.type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground font-semibold">{item.count}</span>
                            <Badge variant="outline" className="border-2 font-semibold">{item.percentage.toFixed(0)}%</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                          <div
                            className="bg-gradient-to-r from-secondary to-primary h-3 rounded-full transition-all duration-300 shadow-lg"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <PieChart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No hay tratamientos registrados</h3>
                    <p className="text-muted-foreground">Los datos aparecerán cuando tengas tratamientos activos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Análisis detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rendimiento de citas */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Rendimiento de Citas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Completadas</span>
                      <span className="text-sm text-primary font-bold">{overview.appointments.completed}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 shadow-lg"
                        style={{ width: `${overview.appointments.totalMonth > 0 
                          ? (overview.appointments.completed / overview.appointments.totalMonth) * 100 
                          : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Canceladas</span>
                      <span className="text-sm text-muted-foreground font-bold">{overview.appointments.cancelled}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                      <div
                        className="bg-gradient-to-r from-destructive to-secondary h-3 rounded-full transition-all duration-300 shadow-lg"
                        style={{ width: `${overview.appointments.totalMonth > 0 
                          ? (overview.appointments.cancelled / overview.appointments.totalMonth) * 100 
                          : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Reprogramadas</span>
                      <span className="text-sm text-foreground font-bold">{overview.appointments.rescheduled}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                      <div
                        className="bg-gradient-to-r from-accent to-primary h-3 rounded-full transition-all duration-300 shadow-lg"
                        style={{ width: `${overview.appointments.totalMonth > 0 
                          ? (overview.appointments.rescheduled / overview.appointments.totalMonth) * 100 
                          : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adherencia al tratamiento */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Heart className="h-5 w-5 text-secondary" />
                  </div>
                  Adherencia al Tratamiento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {overview.treatments.averageAdherence.toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground font-semibold">Adherencia promedio</p>
                </div>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Activos:</span>
                    <span className="font-bold text-foreground">{overview.treatments.active}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Completados:</span>
                    <span className="font-bold text-foreground">{overview.treatments.completed}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Pausados:</span>
                    <span className="font-bold text-foreground">{overview.treatments.paused}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Suspendidos:</span>
                    <span className="font-bold text-foreground">{overview.treatments.suspended}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de pacientes */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  Estado de Pacientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-sm font-bold text-foreground">{overview.patients.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Activos</span>
                    <span className="text-sm text-primary font-bold">{overview.patients.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">En seguimiento</span>
                    <span className="text-sm text-muted-foreground font-bold">{overview.patients.followUp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Nuevos</span>
                    <span className="text-sm text-primary font-bold">{overview.patients.newConsultations}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {overview.patients.averageSatisfaction.toFixed(1)}/5.0
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">Satisfacción promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Citas por día de la semana */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                Distribución Semanal de Citas
              </CardTitle>
              <CardDescription className="mt-1">Patrón de citas por día de la semana</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {appointmentsByDay?.data && appointmentsByDay.data.length > 0 ? (
                <div className="grid grid-cols-7 gap-4">
                  {appointmentsByDay.data.map((item, index) => {
                    const maxCount = Math.max(...appointmentsByDay.data.map(d => d.count))
                    return (
                      <div key={index} className="text-center space-y-3">
                        <div className="text-sm font-bold text-muted-foreground">{dayNames[item.day] || item.dayName}</div>
                        <div className="text-3xl font-bold text-primary">{item.count}</div>
                        <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 shadow-lg"
                            style={{ width: `${(item.count / (maxCount || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <LineChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No hay datos de citas disponibles</h3>
                  <p className="text-muted-foreground">Los datos aparecerán cuando tengas citas programadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
