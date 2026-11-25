"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { appointments as appointmentsApi } from "@/lib/api"
import type { AppointmentResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { RescheduleAppointmentDialog } from "@/components/reschedule-appointment-dialog"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle,
  X,
  AlertTriangle,
  Filter,
} from "lucide-react"
import { format, parseISO, isFuture, isPast } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

const editableStatuses: AppointmentResponse["status"][] = ["SCHEDULED", "CONFIRMED", "RESCHEDULED"]

export default function CitasPacientePage() {
  const { user } = useAuthContext()
  const patientProfileId = user && isPatientUser(user) ? user.profile.accountProfileId : null
  const [statusFilter, setStatusFilter] = useState("all")
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<AppointmentResponse | null>(null)

  useEffect(() => {
    const loadAppointments = async () => {
      if (!patientProfileId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await appointmentsApi.getPatientAppointments(patientProfileId)
        setAppointments(data)
      } catch (err) {
        console.error('Error loading appointments:', err)
        setError('Error al cargar las citas')
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [patientProfileId])

  const filteredAppointments = appointments.filter((appointment) => {
    if (statusFilter === "all") return true
    if (statusFilter === "upcoming") {
      return (
        isFuture(parseISO(appointment.appointmentDate)) &&
        editableStatuses.includes(appointment.status)
      )
    }
    if (statusFilter === "past") {
      return (
        isPast(parseISO(appointment.appointmentDate)) ||
        appointment.status === "COMPLETED" ||
        appointment.status === "CANCELLED"
      )
    }
    return appointment.status === statusFilter
  })

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "CONFIRMADA":
        return "bg-primary/10 text-primary border-primary/20"
      case "SCHEDULED":
      case "RESCHEDULED":
      case "PENDIENTE":
        return "bg-secondary/10 text-secondary border-secondary/20"
      case "COMPLETED":
      case "COMPLETADA":
        return "bg-accent/10 text-accent border-accent/20"
      case "CANCELLED":
      case "CANCELADA":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
      case "CONFIRMADA":
        return <CheckCircle className="h-4 w-4" />
      case "SCHEDULED":
      case "RESCHEDULED":
      case "PENDIENTE":
        return <Clock className="h-4 w-4" />
      case "COMPLETED":
      case "COMPLETADA":
        return <CheckCircle className="h-4 w-4" />
      case "CANCELLED":
      case "CANCELADA":
        return <X className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleStatusUpdate = async (appointmentId: number, status: "CONFIRMED" | "CANCELLED") => {
    const confirming = status === "CONFIRMED"
    setUpdatingStatus(true)
    setActionError(null)
    setActionSuccess("")
    try {
      const reason = confirming ? undefined : "Cancelada por el paciente"
      const updated = await appointmentsApi.updateStatus(appointmentId, status, reason)
      setAppointments((items) => items.map((item) => item.id === updated.id ? updated : item))
      setActionSuccess(confirming ? "Cita confirmada." : "Cita cancelada.")
    } catch (err) {
      const fallback = confirming ? "Error al confirmar la cita" : "Error al cancelar la cita"
      setActionError(err instanceof Error ? err.message : fallback)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRescheduled = (updated: AppointmentResponse) => {
    setAppointments((items) => items.map((item) => item.id === updated.id ? updated : item))
    setAppointmentToReschedule(null)
    setActionError(null)
    setActionSuccess("Cita reprogramada.")
  }

  const upcomingAppointments = appointments.filter(
    (apt) =>
      isFuture(parseISO(apt.appointmentDate)) && editableStatuses.includes(apt.status),
  )

  const completedAppointments = appointments.filter((apt) => apt.status === "COMPLETED")

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
          {actionSuccess && <p role="status" className="text-sm font-medium text-primary">{actionSuccess}</p>}
          {appointmentToReschedule && (
            <RescheduleAppointmentDialog
              appointment={appointmentToReschedule}
              onCancel={() => setAppointmentToReschedule(null)}
              onRescheduled={handleRescheduled}
            />
          )}
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mis Citas
              </h1>
              <p className="text-muted-foreground text-lg">Gestiona tus citas médicas</p>
            </div>
            <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl" asChild>
              <Link href="/dashboard/paciente/citas/nueva">
                <Calendar className="mr-2 h-5 w-5" />
                Solicitar Nueva Cita
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Próximas Citas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-primary mb-1">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Citas próximas
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pendientes</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-secondary mb-1">
                  {appointments.filter((apt) => apt.status === "SCHEDULED").length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Por confirmar
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Completadas</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-accent mb-1">{completedAppointments.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Finalizadas
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Canceladas</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-destructive mb-1">
                  {appointments.filter((apt) => apt.status === "CANCELLED").length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                  Canceladas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Next Appointment Alert */}
          {upcomingAppointments.length > 0 && (
            <Card className="border-2 border-primary/30 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="border-b border-primary/30">
                <CardTitle className="flex items-center gap-3 text-primary text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Próxima Cita
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AlertDescription className="text-base font-medium">
                  Tu próxima cita es el{" "}
                  <strong className="text-primary">{format(parseISO(upcomingAppointments[0].appointmentDate), "EEEE, d 'de' MMMM", { locale: es })}</strong> a
                  las <strong className="text-primary">{format(parseISO(upcomingAppointments[0].appointmentDate), "HH:mm", { locale: es })}</strong> con{" "}
                  <strong className="text-primary">{upcomingAppointments[0].doctorName}</strong>
                </AlertDescription>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-xl font-bold">Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[250px] h-12 border-2">
                    <Filter className="mr-2 h-5 w-5" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las citas</SelectItem>
                    <SelectItem value="upcoming">Próximas</SelectItem>
                    <SelectItem value="past">Pasadas</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                    <SelectItem value="SCHEDULED">Pendientes</SelectItem>
                    <SelectItem value="COMPLETED">Completadas</SelectItem>
                    <SelectItem value="CANCELLED">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="grid gap-6">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-2 shadow-lg hover:border-primary/40 hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-lg">
                          {appointment.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold">{appointment.type}</h3>
                          <Badge className={`${getStatusColor(appointment.status)} border-2 font-semibold`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status}</span>
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 font-medium">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{appointment.doctorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>
                              {format(parseISO(appointment.appointmentDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>
                              {format(parseISO(appointment.appointmentDate), "HH:mm", { locale: es })} • {appointment.durationMinutes} minutos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-xl border-2 border-muted">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {editableStatuses.includes(appointment.status) && (
                        <>
                          {(appointment.status === "SCHEDULED" || appointment.status === "RESCHEDULED") && (
                            isFuture(parseISO(appointment.appointmentDate)) ? (
                              <Button
                                size="sm"
                                disabled={updatingStatus}
                                onClick={() => handleStatusUpdate(appointment.id, "CONFIRMED")}
                              >
                                Confirmar cita
                              </Button>
                            ) : (
                              <p className="text-sm text-muted-foreground">La cita ya venció.</p>
                            )
                          )}
                          {isFuture(parseISO(appointment.appointmentDate)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingStatus}
                              className="border-2 hover:bg-primary hover:text-primary-foreground"
                              onClick={() => setAppointmentToReschedule(appointment)}
                            >
                              Reprogramar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingStatus}
                            onClick={() => handleStatusUpdate(appointment.id, "CANCELLED")}
                            className="text-destructive hover:text-destructive border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/paciente/citas/${appointment.id}`}>Ver cita</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAppointments.length === 0 && (
            <Card className="border-2 shadow-lg">
              <CardContent className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No hay citas</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  No tienes citas que coincidan con los filtros seleccionados.
                </p>
                <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg" asChild>
                  <Link href="/dashboard/paciente/citas/nueva">
                    <Calendar className="mr-2 h-5 w-5" />
                    Solicitar Nueva Cita
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-2xl font-bold">Acciones Rápidas</CardTitle>
              <CardDescription className="mt-1">Gestiona tus citas médicas</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col hover:bg-primary hover:text-primary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg" asChild>
                  <Link href="/dashboard/paciente/citas/nueva">
                    <Calendar className="h-7 w-7 mb-2" />
                    <span className="font-semibold">Solicitar Nueva Cita</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex-col hover:bg-secondary hover:text-secondary-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Phone className="h-7 w-7 mb-2" />
                  <span className="font-semibold">Contactar Clínica</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col hover:bg-accent hover:text-accent-foreground transition-all border-2 hover:scale-105 hover:shadow-lg">
                  <Calendar className="h-7 w-7 mb-2" />
                  <span className="font-semibold">Ver Calendario</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
