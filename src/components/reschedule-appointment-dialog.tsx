"use client"

import { useState, type FormEvent } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppointmentScheduleError, appointments, type AppointmentResponse } from "@/lib/api"

const dateInputFormat = "yyyy-MM-dd'T'HH:mm"
const dateLabel = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" })

interface Props {
  appointment: AppointmentResponse
  onCancel: () => void
  onRescheduled: (appointment: AppointmentResponse) => void
}

export function RescheduleAppointmentDialog({ appointment, onCancel, onRescheduled }: Props) {
  const [date, setDate] = useState("")
  const [error, setError] = useState("")
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [minimum] = useState(() => format(new Date(Date.now() + 24 * 60 * 60 * 1000 + 60000), dateInputFormat))

  function chooseDate(nextDate: string) {
    setDate(nextDate)
    setError("")
    setAlternatives([])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setAlternatives([])
    try {
      const updated = await appointments.reschedule(appointment.id, new Date(date).toISOString())
      onRescheduled(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar el nuevo horario.")
      if (err instanceof AppointmentScheduleError) setAlternatives(err.alternatives)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>
            Elige una fecha y hora con al menos 24 horas de anticipación. Avisaremos a tu médico cuando guardes el cambio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appointment-new-time">Nueva fecha y hora</Label>
            <Input id="appointment-new-time" type="datetime-local" min={minimum} value={date} required
              disabled={saving} onChange={(event) => chooseDate(event.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {alternatives.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Horarios alternativos</p>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((value) => (
                  <Button key={value} type="button" variant="outline" size="sm"
                    onClick={() => chooseDate(format(new Date(value), dateInputFormat))}>
                    {dateLabel.format(new Date(value))}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Volver</Button>
            <Button type="submit" disabled={saving || !date}>{saving ? "Guardando…" : "Guardar nuevo horario"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
