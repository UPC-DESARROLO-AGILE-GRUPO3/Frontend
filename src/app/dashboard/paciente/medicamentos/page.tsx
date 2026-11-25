"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { medications } from "@/lib/api"
import type { MedicationResponse, UpcomingDoseResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Pill, Clock, CheckCircle, Info, Calendar } from "lucide-react"

const routeNames: Record<string, string> = {
  ORAL: "Oral",
  INTRAVENOUS: "Intravenosa",
  INTRAMUSCULAR: "Intramuscular",
  SUBCUTANEOUS: "Subcutánea",
  TOPICAL: "Tópica"
}

export default function MedicamentosPage() {
  const { user } = useAuthContext()
  const patientProfileId = user && isPatientUser(user) ? user.profile.id : null
  const [medicationsList, setMedicationsList] = useState<MedicationResponse[]>([])
  const [upcomingDoses, setUpcomingDoses] = useState<UpcomingDoseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMedications = async () => {
      if (!patientProfileId) return

      try {
        setIsLoading(true)
        setError(null)

        const [activeMeds, doses] = await Promise.all([
          medications.getPatientActive(patientProfileId),
          medications.getUpcomingDoses(patientProfileId, 1) // Next 24 hours
        ])

        setMedicationsList(activeMeds)
        setUpcomingDoses(doses)
      } catch (err) {
        console.error('Error loading medications:', err)
        setError('Error al cargar los medicamentos')
      } finally {
        setIsLoading(false)
      }
    }

    loadMedications()
  }, [patientProfileId])

  const handleMarkDoseTaken = async (medicationId: number) => {
    if (!patientProfileId) return

    try {
      await medications.markDoseTaken(medicationId, {
        takenAt: new Date().toISOString(),
        notes: 'Dosis tomada'
      })

      // Reload doses
      const doses = await medications.getUpcomingDoses(patientProfileId, 1)
      setUpcomingDoses(doses)
    } catch (err) {
      console.error('Error marking dose as taken:', err)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando medicamentos..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
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
              Mis Medicamentos
            </h1>
            <p className="text-muted-foreground text-lg">Gestiona tus medicamentos y recordatorios</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Medicamentos Activos</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{medicationsList.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Medicamentos activos
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Dosis Próximas (24h)</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{upcomingDoses.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Próximas 24 horas
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Dosis Pendientes</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {upcomingDoses.filter(d => !d.taken).length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Por tomar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Doses */}
          {upcomingDoses.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  Próximas Dosis
                </CardTitle>
                <CardDescription className="mt-1">Medicamentos que debes tomar en las próximas 24 horas</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {upcomingDoses.map((dose) => (
                    <div
                      key={`${dose.medicationId}-${dose.scheduledTime}`}
                      className={`flex items-center justify-between p-5 border-2 rounded-xl transition-all ${
                        dose.taken ? 'bg-muted/50 border-muted' : 'bg-card border-border/50 hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${dose.taken ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                          {dose.taken ? (
                            <CheckCircle className="w-6 h-6 text-primary" />
                          ) : (
                            <Clock className="w-6 h-6 text-secondary" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">{dose.medicationName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium mt-1">
                            <span>{dose.dosage}</span>
                            <span>•</span>
                            <span>{new Date(dose.scheduledTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      {!dose.taken && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkDoseTaken(dose.medicationId)}
                          className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-10 px-5 shadow-lg hover:shadow-xl"
                        >
                          Marcar como Tomada
                        </Button>
                      )}
                      {dose.taken && (
                        <Badge variant="outline" className="bg-primary/10 border-2 font-semibold">
                          Tomada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Medications */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Medicamentos Activos
              </h2>
            </div>

            {medicationsList.length === 0 ? (
              <Card className="border-2 shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                    <Pill className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No tienes medicamentos activos registrados</h3>
                  <p className="text-muted-foreground">Los medicamentos aparecerán aquí cuando estén prescritos</p>
                </CardContent>
              </Card>
            ) : (
              medicationsList.map((medication) => (
                <Card key={medication.id} className="border-2 shadow-lg hover:border-primary/40 hover:shadow-xl transition-all">
                  <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Pill className="w-5 h-5 text-primary" />
                          </div>
                          {medication.name}
                        </CardTitle>
                        <CardDescription className="text-base font-medium">
                          Prescrito por {medication.doctorName}
                        </CardDescription>
                      </div>
                      <Badge variant={medication.status === 'ACTIVE' ? 'default' : 'secondary'} className="border-2 font-semibold">
                        {medication.status === 'ACTIVE' ? 'Activo' : medication.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Dosage Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Dosis</p>
                        <p className="text-xl font-bold text-foreground">{medication.dosage}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Frecuencia</p>
                        <p className="text-xl font-bold text-foreground">{medication.frequency}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Vía</p>
                        <p className="text-xl font-bold text-foreground">
                          {routeNames[medication.route] || medication.route}
                        </p>
                      </div>
                    </div>

                    {/* Date Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-sm p-3 bg-card rounded-lg border-2 border-border/50">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-muted-foreground font-semibold">Inicio:</span>
                        <span className="font-bold text-foreground">
                          {new Date(medication.startDate).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {medication.endDate && (
                        <div className="flex items-center gap-3 text-sm p-3 bg-card rounded-lg border-2 border-border/50">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span className="text-muted-foreground font-semibold">Fin:</span>
                          <span className="font-bold text-foreground">
                            {new Date(medication.endDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    {medication.instructions && (
                      <Alert className="border-2 bg-card">
                        <Info className="h-5 w-5 text-primary" />
                        <AlertDescription className="font-medium">
                          <span className="font-bold">Instrucciones: </span>
                          {medication.instructions}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Side Effects */}
                    {medication.sideEffects && medication.sideEffects.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-bold mb-3 text-foreground">Posibles efectos secundarios:</p>
                        <div className="flex flex-wrap gap-2">
                          {medication.sideEffects.map((effect, index) => (
                            <Badge key={index} variant="outline" className="bg-secondary/10 border-2 font-semibold">
                              {effect}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Refill */}
                    {medication.nextRefillDate && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground font-medium">
                          Próximo resurtido:{' '}
                          <span className="font-bold text-primary text-lg">
                            {new Date(medication.nextRefillDate).toLocaleDateString('es-ES')}
                          </span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
