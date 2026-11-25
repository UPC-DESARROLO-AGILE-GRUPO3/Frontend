"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, type ReminderFrequency, type ReminderTone } from "@/lib/api"
import { playReminderTone } from "@/lib/reminder-sound"

export function ReminderPreferencesDialog({ onClose }: { onClose: () => void }) {
  const [time, setTime] = useState("")
  const [timeZone, setTimeZone] = useState("")
  const [frequency, setFrequency] = useState<ReminderFrequency>("DAY_BEFORE")
  const [tone, setTone] = useState<ReminderTone>("SILENT")
  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    apiClient.getReminderPreferences(controller.signal).then((preferences) => {
      if (controller.signal.aborted) return
      setTime(preferences.time ?? "")
      setTimeZone(preferences.timeZone ?? (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"))
      setFrequency(preferences.frequency)
      setTone(preferences.tone)
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError("No pudimos cargar tus preferencias. Vuelve a abrir la configuración.")
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [])

  function edit() {
    setError("")
    setSaved(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    edit()
    if (!time) {
      setError("Selecciona al menos un horario.")
      return
    }
    setSaving(true)
    try {
      await apiClient.saveReminderPreferences({ time, timeZone, frequency, tone })
      setSaved(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No pudimos guardar tus preferencias.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar recordatorios</DialogTitle>
          <DialogDescription>Elige cuándo recibir los recordatorios de tus citas dentro de OnControl.</DialogDescription>
        </DialogHeader>
        {loading && <p role="status">Cargando preferencias…</p>}
        {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
        {!loading && !loadError && (
          <form noValidate onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reminder-time">Horario</Label>
              <Input id="reminder-time" type="time" value={time} required disabled={saving}
                onChange={(event) => { setTime(event.target.value); edit() }} />
              <p className="text-sm text-muted-foreground">Zona horaria · {timeZone}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reminder-frequency">Frecuencia</Label>
              <Select value={frequency} disabled={saving} onValueChange={(value) => { setFrequency(value as ReminderFrequency); edit() }}>
                <SelectTrigger id="reminder-frequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY_BEFORE">El día anterior</SelectItem>
                  <SelectItem value="DAY_OF">El mismo día</SelectItem>
                  <SelectItem value="BOTH">El día anterior y el mismo día</SelectItem>
                </SelectContent>
              </Select>
              {frequency !== "DAY_BEFORE" && (
                <p className="text-sm text-muted-foreground">Si tu cita es antes de esa hora, recibirás el aviso hasta una hora antes, dentro del mismo día.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reminder-tone">Sonido</Label>
              <div className="flex flex-wrap gap-2">
                <Select value={tone} disabled={saving} onValueChange={(value) => { setTone(value as ReminderTone); edit() }}>
                  <SelectTrigger id="reminder-tone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SILENT">Sin sonido</SelectItem>
                    <SelectItem value="SOFT">Suave</SelectItem>
                    <SelectItem value="CHIME">Campanilla</SelectItem>
                  </SelectContent>
                </Select>
                {tone !== "SILENT" && (
                  <Button type="button" variant="outline" disabled={saving} onClick={() => {
                    void playReminderTone(tone).catch(() => setError("No pudimos reproducir el sonido."))
                  }}>Probar sonido</Button>
                )}
              </div>
              {tone !== "SILENT" && <p className="text-sm text-muted-foreground">Se reproduce con la app abierta después de interactuar con la pestaña.</p>}
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {saved && <p role="status" className="text-sm font-medium text-primary">Preferencias guardadas.</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cerrar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar preferencias"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
