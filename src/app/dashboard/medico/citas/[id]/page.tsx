"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  PlayCircle,
  Save,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react"

import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Loading } from "@/components/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { appointments, type AppointmentResponse } from "@/lib/api"

const statusLabels: Record<AppointmentResponse["status"], string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
}

const statusClasses: Record<AppointmentResponse["status"], string> = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-primary/30 bg-primary/10 text-primary",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  NO_SHOW: "border-slate-200 bg-slate-100 text-slate-700",
}

function formatAppointmentType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatDateTime(value: string) {
  try {
    return format(parseISO(value), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
  } catch {
    return "Fecha no disponible"
  }
}

export default function AppointmentDetailsPage() {
  const params = useParams()
  const appointmentId = Number(params.id)

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [followUpNotes, setFollowUpNotes] = useState("")

  const loadAppointment = useCallback(async () => {
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      setError("El identificador de la cita no es válido")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError("")
      const data = await appointments.getById(appointmentId)
      setAppointment(data)
      setFollowUpNotes(data.followUpNotes ?? "")
    } catch (err) {
      console.error("Error loading appointment:", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar la cita")
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    void loadAppointment()
  }, [loadAppointment])

  const updateStatus = async (
    status: AppointmentResponse["status"],
    reason?: string,
  ) => {
    if (!appointment) return

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")
      const updated = await appointments.updateStatus(appointment.id, status, reason)
      setAppointment(updated)
      setSuccess(`La cita ahora está ${statusLabels[status].toLowerCase()}.`)
      setCancelDialogOpen(false)
      setCancellationReason("")
    } catch (err) {
      console.error("Error updating appointment:", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar la cita")
    } finally {
      setIsSaving(false)
    }
  }

  const saveFollowUp = async () => {
    if (!appointment || !followUpNotes.trim()) {
      setError("Escribe las notas de seguimiento antes de guardar")
      return
    }

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")
      const updated = await appointments.addFollowUp(appointment.id, followUpNotes.trim())
      setAppointment(updated)
      setFollowUpNotes(updated.followUpNotes ?? followUpNotes.trim())
      setSuccess("Las notas de seguimiento se guardaron correctamente.")
    } catch (err) {
      console.error("Error saving follow-up notes:", err)
      setError(err instanceof Error ? err.message : "No se pudieron guardar las notas")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando detalle de la cita..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error && !appointment) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="mx-auto max-w-4xl space-y-6">
            <Button variant="outline" asChild className="border-2">
              <Link href="/dashboard/medico/citas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a citas
              </Link>
            </Button>
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
            <Button onClick={() => void loadAppointment()}>Intentar de nuevo</Button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!appointment) return null

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="mx-auto max-w-6xl space-y-8">
          <Button variant="outline" asChild className="border-2 hover:bg-primary hover:text-primary-foreground">
            <Link href="/dashboard/medico/citas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a citas
            </Link>
          </Button>

          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-2 border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <AlertDescription className="font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-secondary/5 to-background">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-3">
                      <Calendar className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold">Detalle de Cita</CardTitle>
                      <CardDescription className="mt-1 text-base">
                        {formatAppointmentType(appointment.type)}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusClasses[appointment.status]} border-2 text-sm font-semibold`}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {appointment.status === "SCHEDULED" && (
                    <Button disabled={isSaving} onClick={() => void updateStatus("CONFIRMED")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar cita
                    </Button>
                  )}
                  {appointment.status === "CONFIRMED" && (
                    <Button disabled={isSaving} onClick={() => void updateStatus("IN_PROGRESS")}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Iniciar cita
                    </Button>
                  )}
                  {(appointment.status === "CONFIRMED" || appointment.status === "IN_PROGRESS") && (
                    <Button
                      disabled={isSaving}
                      variant="outline"
                      className="border-2"
                      onClick={() => void updateStatus("COMPLETED")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completar
                    </Button>
                  )}
                  {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                    <Button
                      disabled={isSaving}
                      variant="destructive"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <User className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Paciente</p>
                    <Link
                      href={`/dashboard/medico/pacientes/${appointment.patientId}`}
                      className="block truncate font-bold hover:text-primary"
                    >
                      {appointment.patientName}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <Stethoscope className="h-5 w-5 shrink-0 text-secondary" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Médico</p>
                    <p className="truncate font-bold">{appointment.doctorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <Clock className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Fecha y hora</p>
                    <p className="font-bold capitalize">{formatDateTime(appointment.appointmentDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <MapPin className="h-5 w-5 shrink-0 text-secondary" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Ubicación</p>
                    <p className="truncate font-bold">{appointment.location || "No especificada"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                  Información de la cita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Tipo de cita</p>
                  <p className="mt-1 font-bold">{formatAppointmentType(appointment.type)}</p>
                </div>
                <div className="rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Duración</p>
                  <p className="mt-1 font-bold">{appointment.durationMinutes} minutos</p>
                </div>
                <div className="rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Estado</p>
                  <Badge className={`${statusClasses[appointment.status]} mt-2 border-2 font-semibold`}>
                    {statusLabels[appointment.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <FileText className="h-5 w-5 text-secondary" />
                  Indicaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-xl border-2 border-border/50 bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Notas</p>
                  <p className="mt-1 whitespace-pre-wrap">{appointment.notes || "Sin notas registradas"}</p>
                </div>
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-muted-foreground">Preparación</p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {appointment.preparationInstructions || "Sin instrucciones especiales"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {appointment.status === "CANCELLED" && (
            <Card className="border-2 border-red-200 bg-red-50/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Cita cancelada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-red-800">
                  {appointment.cancellationReason || "No se registró un motivo de cancelación."}
                </p>
              </CardContent>
            </Card>
          )}

          {appointment.status === "COMPLETED" && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-background">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  Seguimiento de la cita
                </CardTitle>
                <CardDescription>
                  Registra conclusiones o indicaciones posteriores para esta atención.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <Textarea
                  value={followUpNotes}
                  onChange={(event) => setFollowUpNotes(event.target.value)}
                  placeholder="Escribe las notas de seguimiento..."
                  className="min-h-32 border-2"
                />
                <Button disabled={isSaving || !followUpNotes.trim()} onClick={() => void saveFollowUp()}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar seguimiento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar cita</DialogTitle>
              <DialogDescription>
                Indica el motivo para que quede registrado en el detalle de la cita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Motivo de cancelación</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Ejemplo: el paciente solicitó reprogramar"
                className="min-h-24"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={isSaving} onClick={() => setCancelDialogOpen(false)}>
                Volver
              </Button>
              <Button
                variant="destructive"
                disabled={isSaving || !cancellationReason.trim()}
                onClick={() => void updateStatus("CANCELLED", cancellationReason.trim())}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar cancelación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </AuthGuard>
  )
}
