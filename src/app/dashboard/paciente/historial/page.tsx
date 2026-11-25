"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { medicalHistory } from "@/lib/api"
import type { HistoryEntryResponse, AllergyResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { 
  FileText, 
  Heart, 
  Activity, 
  Stethoscope,
  AlertTriangle,
  Calendar
} from "lucide-react"

const typeNames: Record<string, string> = {
  CONSULTATION: "Consulta",
  PROCEDURE: "Procedimiento",
  SURGERY: "Cirugía",
  EMERGENCY: "Emergencia",
  LAB_RESULT: "Resultados de Laboratorio",
  IMAGING: "Imagenología",
  OTHER: "Otro"
}

const severityNames: Record<string, string> = {
  MILD: "Leve",
  MODERATE: "Moderado",
  SEVERE: "Severo",
  LIFE_THREATENING: "Riesgo de vida"
}

export default function HistorialPage() {
  const { user } = useAuthContext()
  const patientProfileId = user && isPatientUser(user) ? user.profile.id : null
  const [historyEntries, setHistoryEntries] = useState<HistoryEntryResponse[]>([])
  const [allergies, setAllergies] = useState<AllergyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("historial")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")

  useEffect(() => {
    const loadHistory = async () => {
      if (!patientProfileId) return

      try {
        setIsLoading(true)
        setError(null)

        const [history, allergyData] = await Promise.all([
          medicalHistory.getHistory(patientProfileId),
          medicalHistory.getAllergies(patientProfileId)
        ])

        setHistoryEntries(history)
        setAllergies(allergyData)
      } catch (err) {
        console.error('Error loading medical history:', err)
        setError('Error al cargar el historial médico')
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [patientProfileId])

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando historial médico..." />
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

  const filteredHistory = filtroTipo === "todos" 
    ? historyEntries 
    : historyEntries.filter((entry) => entry.type === filtroTipo)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CONSULTATION":
        return <Stethoscope className="w-5 h-5 text-blue-600" />
      case "PROCEDURE":
        return <Activity className="w-5 h-5 text-purple-600" />
      case "SURGERY":
        return <Heart className="w-5 h-5 text-red-600" />
      case "LAB_RESULT":
        return <FileText className="w-5 h-5 text-green-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CONSULTATION":
        return "bg-blue-100 text-blue-700"
      case "PROCEDURE":
        return "bg-purple-100 text-purple-700"
      case "SURGERY":
        return "bg-red-100 text-red-700"
      case "LAB_RESULT":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Historial Médico
            </h1>
            <p className="text-muted-foreground text-lg">Registro completo de tu atención médica</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="alergias">
                Alergias ({allergies.length})
              </TabsTrigger>
            </TabsList>

            {/* Medical History Tab */}
            <TabsContent value="historial" className="space-y-4">
              {/* Filter Buttons */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="text-xl font-bold">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={filtroTipo === "todos" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipo("todos")}
                      className={filtroTipo === "todos" ? "bg-gradient-to-r from-primary to-secondary text-white border-0" : "border-2 hover:bg-primary hover:text-primary-foreground"}
                    >
                      Todos ({historyEntries.length})
                    </Button>
                    <Button
                      variant={filtroTipo === "CONSULTATION" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipo("CONSULTATION")}
                      className={filtroTipo === "CONSULTATION" ? "bg-gradient-to-r from-primary to-secondary text-white border-0" : "border-2 hover:bg-primary hover:text-primary-foreground"}
                    >
                      Consultas ({historyEntries.filter(e => e.type === "CONSULTATION").length})
                    </Button>
                    <Button
                      variant={filtroTipo === "PROCEDURE" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipo("PROCEDURE")}
                      className={filtroTipo === "PROCEDURE" ? "bg-gradient-to-r from-primary to-secondary text-white border-0" : "border-2 hover:bg-primary hover:text-primary-foreground"}
                    >
                      Procedimientos ({historyEntries.filter(e => e.type === "PROCEDURE").length})
                    </Button>
                    <Button
                      variant={filtroTipo === "SURGERY" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipo("SURGERY")}
                      className={filtroTipo === "SURGERY" ? "bg-gradient-to-r from-primary to-secondary text-white border-0" : "border-2 hover:bg-primary hover:text-primary-foreground"}
                    >
                      Cirugías ({historyEntries.filter(e => e.type === "SURGERY").length})
                    </Button>
                    <Button
                      variant={filtroTipo === "LAB_RESULT" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroTipo("LAB_RESULT")}
                      className={filtroTipo === "LAB_RESULT" ? "bg-gradient-to-r from-primary to-secondary text-white border-0" : "border-2 hover:bg-primary hover:text-primary-foreground"}
                    >
                      Laboratorio ({historyEntries.filter(e => e.type === "LAB_RESULT").length})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* History Entries */}
              {filteredHistory.length === 0 ? (
                <Card className="border-2 shadow-lg">
                  <CardContent className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No hay entradas en tu historial médico</h3>
                    <p className="text-muted-foreground">Las entradas aparecerán aquí cuando tengas registros médicos</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredHistory.map((entry) => (
                    <Card key={entry.id} className="border-2 shadow-lg hover:border-primary/40 hover:shadow-xl transition-all">
                      <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-primary/10">
                              {getTypeIcon(entry.type)}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold mb-1">{entry.title}</CardTitle>
                              <CardDescription className="text-base font-medium">
                                {entry.doctorName}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className={`${getTypeColor(entry.type)} border-2 font-semibold`}>
                              {typeNames[entry.type] || entry.type}
                            </Badge>
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 justify-end">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(entry.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {/* Description */}
                        {entry.description && (
                          <Alert className="border-2 bg-card">
                            <FileText className="h-5 w-5 text-primary" />
                            <AlertDescription className="font-medium">{entry.description}</AlertDescription>
                          </Alert>
                        )}

                        {/* Documents */}
                        {entry.documents.length > 0 && (
                          <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                            <p className="text-sm font-bold mb-3 text-foreground">Documentos adjuntos:</p>
                            <div className="flex flex-wrap gap-2">
                              {entry.documents.map((doc, index) => (
                                <Badge key={index} variant="outline" className="border-2 font-semibold">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Allergies Tab */}
            <TabsContent value="alergias" className="space-y-6">
              {allergies.length === 0 ? (
                <Card className="border-2 shadow-lg">
                  <CardContent className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                      <AlertTriangle className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No tienes alergias registradas</h3>
                    <p className="text-muted-foreground">Las alergias aparecerán aquí cuando estén registradas</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allergies.map((allergy) => (
                    <Card key={allergy.id} className="border-2 shadow-lg hover:border-destructive/40 hover:shadow-xl transition-all">
                      <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-destructive/10">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            {allergy.allergen}
                          </CardTitle>
                          <Badge 
                            variant={allergy.severity === 'SEVERE' || allergy.severity === 'LIFE_THREATENING' ? 'destructive' : 'secondary'}
                            className="border-2 font-semibold"
                          >
                            {severityNames[allergy.severity] || allergy.severity}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1 font-medium text-base">{allergy.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        {allergy.reaction && (
                          <div className="mb-4 p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                            <p className="text-sm font-bold mb-2 text-foreground">Reacción:</p>
                            <p className="text-sm text-muted-foreground font-medium">{allergy.reaction}</p>
                          </div>
                        )}
                        {allergy.diagnosedDate && (
                          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Diagnosticada: {new Date(allergy.diagnosedDate).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
