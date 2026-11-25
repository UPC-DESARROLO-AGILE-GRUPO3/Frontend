"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiRequestError, appointments, type AppointmentResponse } from "@/lib/api"

const statuses: Record<AppointmentResponse["status"], string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
  RESCHEDULED: "Reprogramada",
}

const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeStyle: "short" })

type AppointmentDetailState =
  | { status: "loading" }
  | { status: "success"; appointment: AppointmentResponse }
  | { status: "unavailable" }
  | { status: "failed" }

export function AppointmentDetailsPage({ id, role }: { id: string; role: "DOCTOR" | "PATIENT" }) {
  const backHref = role === "DOCTOR" ? "/dashboard/medico/citas" : "/dashboard/paciente/citas"

  return (
    <AuthGuard requiredRole={role}>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-5">
          <Button asChild variant="outline">
            <Link href={backHref}><ArrowLeft aria-hidden="true" /> Volver a citas</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Detalle de la cita</h1>
          <AppointmentDetails key={id} id={id} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

function AppointmentDetails({ id }: { id: string }) {
  const [state, setState] = useState<AppointmentDetailState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)
  const numericId = Number(id)
  const validId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(numericId)

  useEffect(() => {
    if (!validId) return
    const controller = new AbortController()
    appointments.getById(numericId, controller.signal).then((appointment) => {
      if (!controller.signal.aborted) setState({ status: "success", appointment })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      const unavailable = error instanceof ApiRequestError && [403, 404].includes(error.status)
      setState({ status: unavailable ? "unavailable" : "failed" })
    })
    return () => controller.abort()
  }, [attempt, numericId, validId])

  if (!validId || state.status === "unavailable") {
    return <Alert><AlertDescription>Esta cita no está disponible para tu cuenta.</AlertDescription></Alert>
  }

  if (state.status === "loading") return <p role="status">Cargando cita…</p>

  if (state.status === "failed") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p>No pudimos cargar la cita.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => {
            setState({ status: "loading" })
            setAttempt((value) => value + 1)
          }}>Reintentar</Button>
        </AlertDescription>
      </Alert>
    )
  }

  const { appointment } = state
  const type = appointment.type.toLocaleLowerCase("es-PE").replaceAll("_", " ")
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="capitalize">{type}</CardTitle>
          <Badge variant={appointment.status === "CANCELLED" ? "destructive" : "outline"}>
            {statuses[appointment.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Fecha y hora</dt>
            <dd className="font-medium">
              <time dateTime={appointment.appointmentDate}>{dateFormat.format(new Date(appointment.appointmentDate))}</time>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Duración</dt>
            <dd className="font-medium">{appointment.durationMinutes} minutos</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Médico</dt>
            <dd className="font-medium">{appointment.doctorName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Paciente</dt>
            <dd className="font-medium">{appointment.patientName}</dd>
          </div>
          {appointment.location && (
            <div>
              <dt className="text-muted-foreground">Ubicación</dt>
              <dd className="font-medium">{appointment.location}</dd>
            </div>
          )}
          {appointment.preparationInstructions && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Indicaciones previas</dt>
              <dd className="whitespace-pre-wrap break-words">{appointment.preparationInstructions}</dd>
            </div>
          )}
          {appointment.status === "CANCELLED" && appointment.cancellationReason && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Motivo de cancelación</dt>
              <dd className="whitespace-pre-wrap break-words">{appointment.cancellationReason}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
