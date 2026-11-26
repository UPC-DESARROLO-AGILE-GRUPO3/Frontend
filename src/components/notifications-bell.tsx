"use client"

import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ApiRequestError, apiClient, chatChangedEvent, type AppNotification, type NotificationInbox } from "@/lib/api"
import { ReminderPreferencesDialog } from "@/components/reminder-preferences-dialog"
import { playReminderTone } from "@/lib/reminder-sound"

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

function mergeInbox(current: NotificationInbox | null, latest: NotificationInbox): NotificationInbox {
  if (!current || !latest.items.length) return latest
  const knownItems = new Map(current.items.map((item) => [item.id, item]))
  if (!latest.items.some((item) => knownItems.has(item.id))) return latest

  const recent = latest.items.map((item) => {
    const readAt = item.readAt ?? knownItems.get(item.id)?.readAt ?? null
    return { ...item, readAt }
  })
  const lastRecentId = recent[recent.length - 1].id
  const older = current.items.filter((item) => item.id < lastRecentId)
  return older.length
    ? { ...latest, items: [...recent, ...older], nextBeforeId: current.nextBeforeId }
    : { ...latest, items: recent }
}

export function NotificationsBell({ appointmentsHref, treatmentProposalsHref }: {
  appointmentsHref: string
  treatmentProposalsHref: string
}) {
  const [open, setOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [inbox, setInbox] = useState<NotificationInbox | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const refreshInbox = useRef<(() => void) | null>(null)
  const bell = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    let loading = false
    let refreshPending = false
    let retryTimer: number | undefined
    let retryDelay = 1000
    let latestNoticeId: number | null = null

    async function refresh() {
      if (signal.aborted) return
      if (loading) {
        refreshPending = true
        return
      }
      loading = true
      try {
        const data = await apiClient.getNotificationInbox(undefined, signal)
        if (!signal.aborted) {
          const previousId = latestNoticeId
          latestNoticeId = Math.max(previousId ?? 0, data.items[0]?.id ?? 0)
          if (previousId !== null && !document.hidden && navigator.userActivation?.hasBeenActive) {
            for (const item of data.items) {
              if (item.id <= previousId) break
              if (item.type === "REMINDER" && !item.readAt && item.reminderTone && item.reminderTone !== "SILENT") {
                void playReminderTone(item.reminderTone).catch(() => {})
                break
              }
            }
          }
          setInbox((current) => mergeInbox(current, data))
          setError("")
        }
      } catch {
        if (!signal.aborted) setError("No pudimos cargar las notificaciones.")
      } finally {
        loading = false
        if (refreshPending) {
          refreshPending = false
          void refresh()
        }
      }
    }

    async function listen() {
      try {
        await apiClient.watchNotificationInbox(() => {
          retryDelay = 1000
          void refresh()
        }, signal, () => window.dispatchEvent(new Event(chatChangedEvent)))
      } catch (error) {
        if (error instanceof ApiRequestError && [401, 403].includes(error.status)) return
      }
      if (!signal.aborted) {
        retryTimer = window.setTimeout(() => void listen(), retryDelay)
        retryDelay = Math.min(retryDelay * 2, 30000)
      }
    }

    const refreshWhenVisible = () => {
      if (!document.hidden) void refresh()
    }
    refreshInbox.current = () => void refresh()
    void refresh()
    void listen()
    const timer = window.setInterval(refreshWhenVisible, 30000)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      refreshInbox.current = null
      window.clearInterval(timer)
      window.clearTimeout(retryTimer)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      controller.abort()
    }
  }, [])

  async function showOlder(beforeId: number) {
    setBusy(true)
    setError("")
    try {
      const older = await apiClient.getNotificationInbox(beforeId)
      setInbox((current) => current?.nextBeforeId === beforeId ? {
        ...current,
        items: [...current.items, ...older.items],
        nextBeforeId: older.nextBeforeId,
      } : current)
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
        unreadCount: current.items.some((item) => item.id === updated.id && !item.readAt)
          ? Math.max(0, current.unreadCount - 1)
          : current.unreadCount,
        items: current.items.map((item) => item.id === updated.id ? updated : item),
      } : null)
      refreshInbox.current?.()
    } catch {
      setError("No pudimos marcar la notificación como leída.")
    } finally {
      setBusy(false)
    }
  }

  const unread = inbox?.unreadCount ?? 0

  return (
    <>
    <Popover open={open} onOpenChange={(next) => {
      setOpen(next)
      if (next) refreshInbox.current?.()
    }}>
      <PopoverTrigger asChild>
        <Button ref={bell} variant="ghost" size="icon" className="relative" aria-label={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}>
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[11px] leading-5 text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Notificaciones" className="w-[min(22rem,calc(100vw-2rem))] p-0"
        onCloseAutoFocus={(event) => { if (preferencesOpen) event.preventDefault() }}>
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
          <h2 className="text-base font-semibold">Notificaciones</h2>
          <Button variant="ghost" size="sm" aria-label="Configurar recordatorios" onClick={() => {
            setPreferencesOpen(true)
            setOpen(false)
          }}>Configurar</Button>
        </div>
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
    {preferencesOpen && <ReminderPreferencesDialog onClose={() => {
      setPreferencesOpen(false)
      requestAnimationFrame(() => bell.current?.focus())
    }} />}
    </>
  )
}
