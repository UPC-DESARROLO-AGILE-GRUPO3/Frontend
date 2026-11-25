"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, type TreatmentDecision, type TreatmentProposal, type TreatmentType } from "@/lib/api"

const statusLabels: Record<TreatmentProposal["status"], string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
}

const treatmentTypes: Record<TreatmentType, string> = {
  CHEMOTHERAPY: "Quimioterapia",
  RADIOTHERAPY: "Radioterapia",
  IMMUNOTHERAPY: "Inmunoterapia",
  SURGERY: "Cirugía",
  HORMONE_THERAPY: "Terapia hormonal",
  TARGETED_THERAPY: "Terapia dirigida",
  STEM_CELL_TRANSPLANT: "Trasplante de células madre",
}

type Role = "PATIENT" | "DOCTOR"
const treatmentPath: Record<Role, string> = {
  PATIENT: "/dashboard/paciente/tratamiento",
  DOCTOR: "/dashboard/medico/tratamientos",
}

type LoadState<T> = { data: T; error?: never } | { error: string; data?: never } | null

export function TreatmentProposalsPage({ role, id }: { role: Role; id?: number }) {
  const basePath = treatmentPath[role]
  return (
    <AuthGuard requiredRole={role}>
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <Button asChild variant="outline">
            <Link href={id === undefined ? basePath : `${basePath}/propuestas`}>
              {id === undefined ? "Volver a tratamientos" : "Ver todas las propuestas"}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{id === undefined ? "Propuestas de tratamiento" : "Propuesta de tratamiento"}</h1>
          {id === undefined
            ? <ProposalList role={role} href={`${basePath}/propuestas`} />
            : <ProposalDetails key={id} id={id} role={role} />}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

function ProposalList({ role, href }: { role: Role; href: string }) {
  const [state, setState] = useState<LoadState<TreatmentProposal[]>>(null)

  useEffect(() => {
    const controller = new AbortController()
    apiClient.listTreatmentProposals(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ data })
    }).catch(() => {
      if (!controller.signal.aborted) setState({ error: "No pudimos cargar las propuestas." })
    })
    return () => controller.abort()
  }, [])

  if (!state) return <p role="status">Cargando propuestas…</p>
  if (state.error !== undefined) return <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
  if (state.data.length === 0) return <p className="text-muted-foreground">Aún no hay propuestas de tratamiento.</p>

  return (
    <ul className="space-y-3">
      {state.data.map((proposal) => (
        <li key={proposal.id}>
          <Link href={`${href}/${proposal.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted">
            <span>
              <span className="block font-semibold">{proposal.plan.protocol}</span>
              <span className="text-sm text-muted-foreground">{role === "DOCTOR" ? proposal.patientName : proposal.doctorName}</span>
            </span>
            <Badge variant="outline">{statusLabels[proposal.status]}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ProposalDetails({ id, role }: { id: number; role: Role }) {
  const [state, setState] = useState<LoadState<TreatmentProposal>>(null)
  const [busy, setBusy] = useState(false)
  const [decisionError, setDecisionError] = useState("")
  const [message, setMessage] = useState("")
  const validId = Number.isSafeInteger(id) && id > 0

  useEffect(() => {
    if (!validId) return
    const controller = new AbortController()
    apiClient.getTreatmentProposal(id, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ data })
    }).catch(() => {
      if (!controller.signal.aborted) setState({ error: "No pudimos abrir esta propuesta." })
    })
    return () => controller.abort()
  }, [id, validId])

  async function decide(decision: TreatmentDecision) {
    setBusy(true)
    setDecisionError("")
    try {
      const data = await apiClient.decideTreatmentProposal(id, decision)
      setState({ data })
      setMessage(decision === "ACCEPT" ? "Aceptaste la propuesta." : "Rechazaste la propuesta.")
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : "No pudimos guardar tu decisión.")
    } finally {
      setBusy(false)
    }
  }

  if (!validId) return <p>Esta propuesta no está disponible.</p>
  if (!state) return <p role="status">Cargando propuesta…</p>
  if (state.error !== undefined) return <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>

  const { plan, status, targetTreatmentId, doctorName, patientName } = state.data
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>{plan.protocol}</CardTitle>
          <Badge variant="outline">{statusLabels[status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{targetTreatmentId ? "Cambio al plan vigente" : "Nuevo plan"}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Médico</dt><dd>{doctorName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Paciente</dt><dd>{patientName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Tipo de tratamiento</dt><dd>{treatmentTypes[plan.type]}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Fecha de inicio</dt><dd><time dateTime={plan.startDate}>{format(parseISO(plan.startDate), "d 'de' MMMM 'de' yyyy", { locale: es })}</time></dd></div>
          <div><dt className="text-sm text-muted-foreground">Ciclos</dt><dd>{plan.totalCycles}</dd></div>
          {plan.sessionDurationMinutes && <div><dt className="text-sm text-muted-foreground">Duración de sesión</dt><dd>{plan.sessionDurationMinutes} minutos</dd></div>}
          {plan.location && <div><dt className="text-sm text-muted-foreground">Ubicación</dt><dd>{plan.location}</dd></div>}
        </dl>
        <PlanList label="Medicamentos" values={plan.medications} />
        <PlanList label="Procedimientos" values={plan.procedures} />
        {plan.preparationInstructions && <section><h2 className="font-semibold">Preparación</h2><p className="whitespace-pre-wrap">{plan.preparationInstructions}</p></section>}
        {plan.notes && <section><h2 className="font-semibold">Notas</h2><p className="whitespace-pre-wrap">{plan.notes}</p></section>}
        {decisionError && <Alert variant="destructive"><AlertDescription>{decisionError}</AlertDescription></Alert>}
        {message && <p role="status" className="font-medium text-primary">{message}</p>}
        {role === "PATIENT" && status === "PENDING" && (
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => decide("ACCEPT")}>Aceptar propuesta</Button>
            <Button variant="outline" disabled={busy} onClick={() => decide("REJECT")}>Rechazar propuesta</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PlanList({ label, values }: { label: string; values?: string[] }) {
  return (
    <section>
      <h2 className="font-semibold">{label}</h2>
      {values?.length
        ? <ul className="list-disc pl-5">{values.map((value, index) => <li key={index}>{value}</li>)}</ul>
        : <p className="text-sm text-muted-foreground">Sin elementos indicados.</p>}
    </section>
  )
}
