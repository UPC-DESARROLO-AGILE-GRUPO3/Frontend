"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { treatments } from "@/lib/api"
import type { TreatmentResponse, TreatmentSessionResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Calendar, Clock, Pill, Activity, AlertCircle, Heart } from "lucide-react"

const tipoNames: Record<string, string> = {
  CHEMOTHERAPY: "Quimioterapia",
  RADIOTHERAPY: "Radioterapia",
  IMMUNOTHERAPY: "Inmunoterapia",
  SURGERY: "Cirugía",
  HORMONE_THERAPY: "Terapia Hormonal",
  TARGETED_THERAPY: "Terapia Dirigida"
}

const estadoNames: Record<string, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  SUSPENDED: "Suspendido"
}

const estadoColors = {
  ACTIVE: "bg-primary/20 text-primary-foreground",
  PAUSED: "bg-primary/10 text-primary-foreground",
  COMPLETED: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-muted/50 text-muted-foreground",
}

export default function TratamientoPacientePage() {
  const { user } = useAuthContext()
  const patientProfileId = user && isPatientUser(user) ? user.profile.id : null
  const [treatment, setTreatment] = useState<TreatmentResponse | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<TreatmentSessionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("resumen")

  useEffect(() => {
    const loadTreatment = async () => {
      if (!patientProfileId) return

      try {
        setIsLoading(true)
        setError(null)

        const currentTreatment = await treatments.getPatientCurrent(patientProfileId)
        
        // Si no hay tratamiento, es un caso válido (no un error)
        if (!currentTreatment) {
          setTreatment(null)
          setUpcomingSessions([])
          setIsLoading(false)
          return
        }

        const sessions = await treatments.getUpcomingSessions(patientProfileId).catch(() => [])
        
        setTreatment(currentTreatment)
        setUpcomingSessions(sessions)
      } catch (err) {
        console.error('Error loading treatment:', err)
        // Solo mostramos error si fue un problema real del servidor
        setError('Ocurrió un error al cargar el tratamiento')
        setTreatment(null)
        setUpcomingSessions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTreatment()
  }, [patientProfileId])

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando tratamiento..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !treatment) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {error || "No tienes un tratamiento activo en este momento"}
              </p>
              {error && (
                <Button onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Mi Tratamiento
        </h1>
        <p className="text-muted-foreground text-lg">Información detallada sobre tu protocolo de tratamiento actual</p>
      </div>

      {/* Resumen del tratamiento */}
      <Card className="border-2 border-primary/30 shadow-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10">
        <CardHeader className="border-b border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{treatment.protocol}</h2>
              <p className="text-muted-foreground font-semibold text-lg">{tipoNames[treatment.type] || treatment.type}</p>
            </div>
            <Badge className={`${estadoColors[treatment.status as keyof typeof estadoColors]} border-2 font-bold text-lg px-4 py-2`}>
              {estadoNames[treatment.status] || treatment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Progreso del Tratamiento</p>
              <div className="mt-3">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-foreground">
                    Ciclo {treatment.currentCycle} de {treatment.totalCycles}
                  </span>
                  <span className="text-primary">{treatment.progressPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 border-2 border-border/50">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-300 shadow-lg"
                    style={{ width: `${treatment.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Fecha de Inicio</p>
              <p className="text-foreground font-bold text-lg">
                {new Date(treatment.startDate).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Próxima Sesión</p>
              <p className="text-foreground font-bold text-lg">
                {treatment.nextSession 
                  ? new Date(treatment.nextSession).toLocaleDateString('es-ES')
                  : 'Por programar'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="medicamentos">Medicamentos</TabsTrigger>
          <TabsTrigger value="efectos">Efectos</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  Estado Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Ciclo Actual:</span>
                    <span className="font-bold text-lg text-foreground">
                      {treatment.currentCycle}/{treatment.totalCycles}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Progreso:</span>
                    <span className="font-bold text-lg text-primary">{treatment.progressPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Estado:</span>
                    <Badge className="bg-primary/20 text-primary-foreground border-2 font-semibold">
                      {estadoNames[treatment.status] || treatment.status}
                    </Badge>
                  </div>
                  {treatment.effectiveness && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Efectividad:</span>
                      <span className="font-bold text-lg text-secondary">{treatment.effectiveness.toFixed(1)}%</span>
                    </div>
                  )}
                  {treatment.adherence && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">Adherencia:</span>
                      <span className="font-bold text-lg text-accent">{treatment.adherence.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Calendar className="w-5 h-5 text-secondary" />
                  </div>
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {treatment.location && (
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Ubicación:</p>
                      <p className="font-bold text-lg text-foreground">{treatment.location}</p>
                    </div>
                  )}
                  {treatment.sessionDurationMinutes && (
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Duración de sesión:</p>
                      <p className="font-bold text-lg text-foreground">{treatment.sessionDurationMinutes} minutos</p>
                    </div>
                  )}
                  {treatment.doctorName && (
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Tu médico:</p>
                      <p className="font-bold text-lg text-primary">{treatment.doctorName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {treatment.notes && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Heart className="w-5 h-5 text-destructive" />
                  </div>
                  Notas del Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-foreground font-medium leading-relaxed">{treatment.notes}</p>
              </CardContent>
            </Card>
          )}

          {treatment.preparationInstructions && (
            <Card className="border-2 border-secondary/30 shadow-lg bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardHeader className="border-b border-secondary/30">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-secondary">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <AlertCircle className="w-5 h-5 text-secondary" />
                  </div>
                  Instrucciones de Preparación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-foreground font-medium leading-relaxed">{treatment.preparationInstructions}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="medicamentos" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pill className="w-6 h-6 text-primary" />
                </div>
                Medicamentos del Protocolo
              </CardTitle>
              <CardDescription className="mt-1">Medicamentos que forman parte de tu tratamiento actual</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {treatment.medications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {treatment.medications.map((medicamento, index) => (
                    <div key={index} className="border-2 border-border/50 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-foreground">{medicamento}</h3>
                        <Badge variant="outline" className="border-2 font-semibold">Activo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Pill className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No hay medicamentos registrados</h3>
                  <p className="text-muted-foreground">No hay medicamentos registrados para este tratamiento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efectos" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <AlertCircle className="w-6 h-6 text-secondary" />
                </div>
                Efectos Secundarios Registrados
              </CardTitle>
              <CardDescription className="mt-1">Efectos secundarios que has experimentado durante el tratamiento</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {treatment.sideEffects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {treatment.sideEffects.map((efecto, index) => (
                    <div key={index} className="border-2 border-destructive/20 rounded-xl p-4 hover:border-destructive/40 hover:shadow-md transition-all bg-card">
                      <h3 className="font-bold text-lg text-foreground">{efecto}</h3>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No hay efectos secundarios registrados</h3>
                  <p className="text-muted-foreground">No se han reportado efectos secundarios para este tratamiento</p>
                </div>
              )}
              <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl" asChild>
                <a href="/dashboard/paciente/sintomas/nuevo">Reportar Nuevo Síntoma</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sesiones" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                Próximas Sesiones
              </CardTitle>
              <CardDescription className="mt-1">Sesiones programadas de tu tratamiento</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="border-2 border-border/50 rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all bg-card">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-foreground mb-2">
                            Sesión #{session.sessionNumber} - Ciclo {session.cycleNumber}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium mb-2">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(session.sessionDate).toLocaleDateString('es-ES')}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              {new Date(session.sessionDate).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {session.location && (
                            <p className="text-sm text-muted-foreground font-medium">{session.location}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-2 font-semibold">{session.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No hay sesiones próximas programadas</h3>
                  <p className="text-muted-foreground">Las sesiones aparecerán aquí cuando estén programadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
