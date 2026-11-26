"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ApiRequestError, apiClient, type SavedPaymentCard } from "@/lib/api"

export default function PaymentsPage() {
  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <PaymentMethods />
      </DashboardLayout>
    </AuthGuard>
  )
}

function PaymentMethods() {
  const [cards, setCards] = useState<SavedPaymentCard[] | null>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [starting, setStarting] = useState(false)
  const requestId = useRef<string | null>(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_STRIPE_SANDBOX_ENABLED !== "true") return
    const controller = new AbortController()
    const { signal } = controller
    const url = new URL(window.location.href)
    const sessionId = url.searchParams.get("session_id")
    const canceled = url.searchParams.has("cancelado")

    async function load() {
      if (sessionId) {
        try {
          const { confirmed } = await apiClient.getPaymentMethodCheckout(sessionId, signal)
          if (signal.aborted) return
          setStatus(confirmed ? "Tarjeta guardada." : "Stripe aún no confirmó la tarjeta.")
          if (confirmed) url.searchParams.delete("session_id")
        } catch (cause) {
          if (signal.aborted) return
          setStatus("No pudimos confirmar el registro de la tarjeta.")
          if (cause instanceof ApiRequestError && cause.status === 404) url.searchParams.delete("session_id")
        }
      } else if (canceled) {
        setStatus("Cancelaste el registro de la tarjeta.")
        url.searchParams.delete("cancelado")
      }
      if (url.href !== window.location.href) window.history.replaceState(null, "", url)

      try {
        const result = await apiClient.listPaymentMethods(signal)
        if (signal.aborted) return
        setEnabled(result.enabled)
        setCards(result.cards)
      } catch {
        if (!signal.aborted) setError("No pudimos cargar tus métodos de pago.")
      }
    }

    void load()
    return () => controller.abort()
  }, [attempt])

  async function addCard() {
    if (starting) return
    setStarting(true)
    setError("")
    try {
      requestId.current ??= crypto.randomUUID()
      const { url } = await apiClient.startPaymentMethodCheckout(requestId.current)
      if (new URL(url).origin !== "https://checkout.stripe.com") throw new Error("URL de Stripe inválida")
      window.location.assign(url)
    } catch {
      setError("No pudimos abrir Stripe. Inténtalo de nuevo.")
      setStarting(false)
    }
  }

  const available = process.env.NEXT_PUBLIC_STRIPE_SANDBOX_ENABLED === "true" && enabled !== false

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Métodos de pago</h1>
          {available && <p className="text-sm text-muted-foreground">Modo de prueba de Stripe. Usa únicamente tarjetas ficticias.</p>}
        </div>
        {available && enabled && (
          <Button type="button" onClick={addCard} disabled={starting}>
            <CreditCard aria-hidden="true" />
            {starting ? "Abriendo Stripe…" : "Agregar tarjeta"}
          </Button>
        )}
      </div>

      {status && <p role="status" className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">{status}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm">
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => { setError(""); setAttempt((value) => value + 1) }}>
            Actualizar lista
          </Button>
        </div>
      )}

      {!available ? (
        <p className="rounded-lg border bg-card p-5 text-muted-foreground">Los métodos de pago de prueba no están habilitados en este entorno.</p>
      ) : !cards ? (
        !error && <p role="status" className="text-muted-foreground">Cargando métodos de pago…</p>
      ) : cards.length === 0 ? (
        <p className="rounded-lg border bg-card p-5 text-muted-foreground">Todavía no tienes tarjetas guardadas.</p>
      ) : (
        <ul aria-label="Tarjetas guardadas" className="divide-y overflow-hidden rounded-lg border bg-card">
          {cards.map((card) => (
            <li key={card.id} className="flex items-center gap-4 px-4 py-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><CreditCard aria-hidden="true" className="size-5" /></div>
              <div>
                <p className="font-medium"><span className="capitalize">{card.brand}</span> · Terminada en {card.last4}</p>
                <p className="text-sm text-muted-foreground">Vence {String(card.expirationMonth).padStart(2, "0")}/{card.expirationYear}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
