"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiClient, type AppNotification, type NotificationInbox } from "@/lib/api"

const titles: Record<AppNotification["type"], string> = {
  SCHEDULED: "Nueva cita programada",
  CANCELLED: "Cita cancelada",
  RESCHEDULED: "Cita reprogramada",
  REMINDER: "Recordatorio de cita",
  TREATMENT_PROPOSED: "Propuesta de tratamiento",
  TREATMENT_ACCEPTED: "Propuesta de tratamiento aceptada",
  TREATMENT_REJECTED: "Propuesta de tratamiento rechazada",
}

const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" })

export function NotificationsBell({ appointmentsHref, treatmentProposalsHref }: {
  appointmentsHref: string
  treatmentProposalsHref: string
}) {
  const [open, setOpen] = useState(false)
  const [inbox, setInbox] = useState<NotificationInbox | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let loading = false

    async function refresh() {
      if (loading || controller.signal.aborted) return
      loading = true
      try {
        const data = await apiClient.getNotificationInbox(undefined, controller.signal)
        if (!controller.signal.aborted) {
          setInbox(data)
          setError("")
        }
      } catch {
        if (!controller.signal.aborted) setError("No pudimos cargar las notificaciones.")
      } finally {
        loading = false
      }
    }

    void refresh()
    const timer = open ? undefined : window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, 30000)
    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [open])

  async function showOlder(beforeId: number) {
    setBusy(true)
    setError("")
    try {
      const older = await apiClient.getNotificationInbox(beforeId)
      setInbox((current) => current ? { ...older, items: [...current.items, ...older.items] } : older)
    } catch {
      setError("No pudimos cargar las notificaciones anteriores.")
    } finally {
      setBusy(false)
    }
  }

  async function markRead(notification: AppNotification) {
    setBusy(true)
    setError("")
    try {
      const updated = await apiClient.markNotificationRead(notification.id)
      setInbox((current) => current ? {
        ...current,
        unreadCount: Math.max(0, current.unreadCount - 1),
        items: current.items.map((item) => item.id === updated.id ? updated : item),
      } : null)
    } catch {
      setError("No pudimos marcar la notificación como leída.")
    } finally {
      setBusy(false)
    }
  }

  const unread = inbox?.unreadCount ?? 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}>
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[11px] leading-5 text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Notificaciones" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <h2 className="border-b px-4 py-3 text-base font-semibold">Notificaciones</h2>
        <div className="max-h-[min(24rem,65vh)] overflow-y-auto">
          {error && <p role="alert" className="px-4 py-3 text-sm text-destructive">{error}</p>}
          {!inbox && !error && <p role="status" className="px-4 py-3 text-sm text-muted-foreground">Cargando avisos…</p>}
          {inbox?.items.length === 0 && <p className="px-4 py-5 text-sm text-muted-foreground">Aún no tienes notificaciones.</p>}
          <ul className="divide-y">
            {inbox?.items.map((item) => (
              <li key={item.id} className={item.readAt ? "px-4 py-3" : "bg-primary/5 px-4 py-3"}>
                <p className={item.readAt ? "text-sm" : "text-sm font-semibold"}>{titles[item.type]}</p>
                {item.type === "RESCHEDULED" ? (
                  <dl className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {item.previousAppointmentDate && (
                      <div className="flex flex-wrap gap-x-1">
                        <dt>Fecha anterior</dt>
                        <dd><time dateTime={item.previousAppointmentDate}>{dateFormat.format(new Date(item.previousAppointmentDate))}</time></dd>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-1">
                      <dt className="font-medium text-foreground">Nueva fecha</dt>
                      <dd><time dateTime={item.appointmentDate}>{dateFormat.format(new Date(item.appointmentDate))}</time></dd>
                    </div>
                  </dl>
                ) : "appointmentDate" in item && item.appointmentDate && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cita del <time dateTime={item.appointmentDate}>{dateFormat.format(new Date(item.appointmentDate))}</time>
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Recibida el <time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time>
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4">
                  <Button asChild variant="link" className="h-8 p-0">
                    <Link href={"proposalId" in item
                      ? `${treatmentProposalsHref}/${item.proposalId}`
                      : `${appointmentsHref}/${item.appointmentId}`} onClick={() => setOpen(false)}>
                      {"proposalId" in item ? "Ver propuesta" : "Ver cita"}
                    </Link>
                  </Button>
                  {!item.readAt && (
                    <Button variant="link" className="h-8 p-0" disabled={busy} onClick={() => void markRead(item)}>
                      Marcar como leída
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {inbox?.nextBeforeId != null && (
            <Button variant="ghost" className="my-2 w-full" disabled={busy} onClick={() => void showOlder(inbox.nextBeforeId!)}>
              Ver anteriores
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
