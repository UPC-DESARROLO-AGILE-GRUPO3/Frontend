"use client"

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError, apiClient, chatChangedEvent, type ChatConversation, type ChatMessage } from "@/lib/api"

type Role = "DOCTOR" | "PATIENT"
const messageDate = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" })

export function ChatPage({ role }: { role: Role }) {
  return (
    <AuthGuard requiredRole={role}>
      <DashboardLayout>
        <ChatWorkspace role={role} />
      </DashboardLayout>
    </AuthGuard>
  )
}

function ChatWorkspace({ role }: { role: Role }) {
  const [conversations, setConversations] = useState<ChatConversation[] | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    void apiClient.getChatConversations(controller.signal).then((data) => {
      if (!controller.signal.aborted) setConversations(data)
    }).catch(() => {
      if (!controller.signal.aborted) setError(true)
    })
    return () => controller.abort()
  }, [attempt])

  const selected = conversations?.find((conversation) => conversation.peerId === selectedId) ?? conversations?.[0]

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
      {error ? (
        <div className="space-y-2 rounded-lg border p-4">
          <p role="alert">No pudimos cargar tus conversaciones.</p>
          <Button variant="outline" onClick={() => { setError(false); setAttempt((value) => value + 1) }}>Reintentar</Button>
        </div>
      ) : !conversations ? (
        <p role="status" className="text-muted-foreground">Cargando conversaciones…</p>
      ) : selected ? (
        <div className="grid gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
          <aside aria-label={role === "DOCTOR" ? "Pacientes" : "Médico asignado"} className="rounded-lg border bg-card p-3">
            <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">{role === "DOCTOR" ? "Pacientes" : "Médico asignado"}</h2>
            <ul className="max-h-48 space-y-1 overflow-y-auto md:max-h-[65dvh]">
              {conversations.map((conversation) => (
                <li key={conversation.peerId}>
                  <Button type="button" variant={selected.peerId === conversation.peerId ? "secondary" : "ghost"}
                    className="h-auto w-full justify-start whitespace-normal break-words px-2 py-2 text-left"
                    aria-pressed={selected.peerId === conversation.peerId}
                    onClick={() => setSelectedId(conversation.peerId)}>
                    {conversation.name}
                  </Button>
                </li>
              ))}
            </ul>
          </aside>
          <ChatThread key={selected.peerId} conversation={selected} />
        </div>
      ) : (
        <p className="rounded-lg border bg-card p-5 text-muted-foreground">
          {role === "DOCTOR" ? "Aún no tienes pacientes asignados." : "Aún no tienes un médico asignado para chatear."}
        </p>
      )}
    </section>
  )
}

function mergeMessages(current: ChatMessage[] | null, incoming: ChatMessage[]): ChatMessage[] {
  if (!current?.length) return incoming
  const items = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) items.set(message.id, message)
  return [...items.values()].sort((first, second) => first.id - second.id)
}

function ChatThread({ conversation }: { conversation: ChatConversation }) {
  const peerId = conversation.peerId
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [hasOlder, setHasOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [syncError, setSyncError] = useState("")
  const [actionError, setActionError] = useState("")
  const [unavailable, setUnavailable] = useState(false)
  const requestId = useRef<string | null>(null)
  const retry = useRef<(() => void) | null>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const scrollUpdate = useRef<"bottom" | number | null>(null)

  useLayoutEffect(() => {
    const area = scrollArea.current
    const update = scrollUpdate.current
    if (!area || update === null) return
    area.scrollTop = update === "bottom" ? area.scrollHeight : area.scrollHeight - update
    scrollUpdate.current = null
  }, [messages])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    let syncedId: number | null = null
    let refreshing = false
    let pending = false
    let denied = false

    async function refresh() {
      if (signal.aborted || denied) return
      if (refreshing) {
        pending = true
        return
      }
      refreshing = true
      try {
        if (syncedId === null) {
          const initial = await apiClient.getChatMessages(peerId, undefined, signal)
          if (signal.aborted) return
          syncedId = initial.messages.at(-1)?.id ?? 0
          scrollUpdate.current = "bottom"
          setMessages(initial.messages)
          setHasOlder(initial.hasMore)
        } else {
          let hasMore: boolean
          do {
            const latest = await apiClient.getChatMessages(peerId, { after: syncedId }, signal)
            if (signal.aborted) return
            hasMore = latest.hasMore && latest.messages.length > 0
            if (latest.messages.length) {
              syncedId = latest.messages.at(-1)?.id ?? syncedId
              const area = scrollArea.current
              if (area && area.scrollHeight - area.scrollTop - area.clientHeight < 48) scrollUpdate.current = "bottom"
              setMessages((current) => mergeMessages(current, latest.messages))
            }
          } while (hasMore)
        }
        setSyncError("")
      } catch (error) {
        if (signal.aborted) return
        denied = error instanceof ApiRequestError && [403, 404].includes(error.status)
        if (denied) {
          setMessages(null)
          setUnavailable(true)
        } else {
          setSyncError("No pudimos actualizar la conversación.")
        }
      } finally {
        refreshing = false
        if (pending) {
          pending = false
          void refresh()
        }
      }
    }

    const update = () => { if (!document.hidden) void refresh() }
    retry.current = () => void refresh()
    window.addEventListener(chatChangedEvent, refresh)
    document.addEventListener("visibilitychange", update)
    const interval = window.setInterval(update, 15000)
    void refresh()
    return () => {
      retry.current = null
      controller.abort()
      window.removeEventListener(chatChangedEvent, refresh)
      document.removeEventListener("visibilitychange", update)
      window.clearInterval(interval)
    }
  }, [peerId])

  async function loadOlder() {
    const oldest = messages?.[0]?.id
    if (!oldest || loadingOlder) return
    setLoadingOlder(true)
    setActionError("")
    try {
      const older = await apiClient.getChatMessages(peerId, { before: oldest })
      const area = scrollArea.current
      if (area) scrollUpdate.current = area.scrollHeight - area.scrollTop
      setMessages((current) => mergeMessages(current, older.messages))
      setHasOlder(older.hasMore)
    } catch {
      setActionError("No pudimos cargar los mensajes anteriores.")
    } finally {
      setLoadingOlder(false)
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending || unavailable) return
    setSending(true)
    setActionError("")
    try {
      requestId.current ??= crypto.randomUUID()
      const saved = await apiClient.sendChatMessage(peerId, requestId.current, body)
      scrollUpdate.current = "bottom"
      setMessages((current) => mergeMessages(current, [saved]))
      setDraft("")
      requestId.current = null
      retry.current?.()
    } catch {
      setActionError("No pudimos enviar el mensaje. Puedes reintentar.")
    } finally {
      setSending(false)
    }
  }

  return (
    <section aria-label={`Conversación con ${conversation.name}`} className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <h2 className="border-b px-4 py-3 font-semibold">{conversation.name}</h2>
      {unavailable ? <p role="alert" className="p-4">Esta conversación no está disponible.</p> : (
        <>
          <div ref={scrollArea} className="h-[min(54dvh,32rem)] min-h-64 overflow-y-auto p-4">
            {hasOlder && (
              <div className="mb-3 text-center">
                <Button variant="outline" size="sm" onClick={loadOlder} disabled={loadingOlder}>
                  {loadingOlder ? "Cargando…" : "Ver mensajes anteriores"}
                </Button>
              </div>
            )}
            {messages === null && !syncError && <p role="status" className="text-muted-foreground">Cargando mensajes…</p>}
            {messages?.length === 0 && <p className="text-muted-foreground">Aún no hay mensajes en esta conversación.</p>}
            <ul aria-label="Mensajes" className="space-y-2">
              {messages?.map((message) => (
                <li key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-xl px-3 py-2 sm:max-w-[75%] ${message.mine ? "bg-primary/10" : "bg-muted"}`}>
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="sr-only">{message.mine ? "Mensaje enviado " : "Mensaje recibido "}</span>
                      <time dateTime={message.createdAt}>{messageDate.format(new Date(message.createdAt))}</time>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={send} className="space-y-2 border-t p-3">
            {syncError && (
              <div className="flex flex-wrap items-center gap-2">
                <p role="alert" className="text-sm text-destructive">{syncError}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => retry.current?.()}>Actualizar</Button>
              </div>
            )}
            {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
            <div className="flex items-end gap-2">
              <Textarea aria-label="Mensaje" placeholder="Escribe un mensaje" rows={2} maxLength={2000}
                value={draft} disabled={sending || messages === null}
                onChange={(event) => { setDraft(event.target.value); requestId.current = null; setActionError("") }} />
              <Button type="submit" disabled={sending || messages === null || !draft.trim()}>
                {sending ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
