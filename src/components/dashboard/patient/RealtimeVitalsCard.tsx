"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Droplets, Loader2, RefreshCw, Thermometer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EdgeApiError, getLatestHealthParameters, type LatestHealthParameters } from "@/lib/edge-api"
import { cn } from "@/lib/utils"

const POLLING_INTERVAL_MS = 3000

function formatUpdatedAt(value?: string) {
  if (!value) return "Sin datos"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function RealtimeVitalsCard() {
  const [data, setData] = useState<LatestHealthParameters | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestInProgress = useRef(false)

  const fetchVitals = useCallback(() => {
    if (requestInProgress.current) return
    requestInProgress.current = true

    void getLatestHealthParameters()
      .then(latest => {
        setData(latest)
        setError(null)
      }, (err: unknown) => {
        setData(null)
        setError(err instanceof EdgeApiError && err.status === 404
          ? null
          : "El monitor IoT no está disponible en este momento. Puedes volver a intentarlo.")
      })
      .finally(() => {
        requestInProgress.current = false
        setIsLoading(false)
        setIsRefreshing(false)
      })
  }, [])

  useEffect(() => {
    fetchVitals()
    const intervalId = window.setInterval(() => {
      if (!document.hidden) fetchVitals()
    }, POLLING_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [fetchVitals])

  function refreshVitals() {
    if (requestInProgress.current) return
    setIsRefreshing(true)
    fetchVitals()
  }

  const statusLabel = data?.is_critical ? "Riesgo" : "Normal"
  const statusIcon = data?.is_critical ? AlertTriangle : CheckCircle2
  const StatusIcon = statusIcon
  const riskLevel = data?.riskLevel ?? "LOW"
  const riskBadgeVariant = riskLevel === "HIGH" ? "destructive" : "outline"
  const riskLevelLabel = riskLevel === "HIGH" ? "Alto" : riskLevel === "MODERATE" ? "Moderado" : "Bajo"
  const riskLevelClass =
    riskLevel === "HIGH"
      ? "border-red-200 bg-red-50 text-red-700"
      : riskLevel === "MODERATE"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-green-200 bg-green-50 text-green-700"

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="flex flex-col gap-4 border-b bg-gradient-to-r from-muted/50 to-background sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <span className="rounded-lg bg-primary/10 p-2">
              <Activity className="h-6 w-6 text-primary" />
            </span>
            Signos vitales IoT
          </CardTitle>
          <CardDescription>
            Última actualización: {formatUpdatedAt(data?.created_at)}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <Badge
              variant={data.is_critical ? "destructive" : "outline"}
              className={cn("h-8 gap-2 px-3 text-sm", !data.is_critical && "border-green-200 text-green-700")}
            >
              <StatusIcon className="h-4 w-4" />
              {statusLabel}
            </Badge>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={refreshVitals}
            disabled={isLoading || isRefreshing}
            title="Actualizar"
          >
            <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
            <span className="sr-only">Actualizar</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando mediciones…
          </div>
        ) : error ? (
          <div role="status" className="flex min-h-32 items-center justify-center rounded-lg border bg-muted/30 p-4 text-center text-muted-foreground">
            {error}
          </div>
        ) : !data ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border bg-muted/30 p-4 text-center text-muted-foreground">
            Aún no hay mediciones de demostración.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="min-h-32 rounded-lg border border-red-100 bg-red-50/60 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-700">
                  <Activity className="h-5 w-5" />
                  BPM
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{data.bpm}</span>
                  <span className="text-sm text-muted-foreground">lat/min</span>
                </div>
              </div>

              <div className="min-h-32 rounded-lg border border-orange-100 bg-orange-50/60 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-orange-700">
                  <Thermometer className="h-5 w-5" />
                  Temperatura
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{data.temp.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">C</span>
                </div>
              </div>

              <div className="min-h-32 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <Droplets className="h-5 w-5" />
                  SpO2
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{data.spo2}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <div className={cn("rounded-lg border p-4", riskLevelClass)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <BrainCircuit className="h-5 w-5" />
                    Alerta preventiva IA
                  </div>
                  <p className="text-sm">
                    {data.aiExplanation || "Sin alerta preventiva generada."}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge variant={riskBadgeVariant}>Riesgo {riskLevelLabel}</Badge>
                  <Badge variant="outline">Score {data.riskScore}%</Badge>
                </div>
              </div>

              {data.reasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.reasons.map((reason) => (
                    <Badge key={reason} variant="secondary">
                      {reason}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
