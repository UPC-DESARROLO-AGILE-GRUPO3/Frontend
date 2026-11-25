"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { symptoms } from "@/lib/api"
import type { SymptomResponse } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { Search, Plus, Activity, AlertTriangle, Clock, Calendar } from "lucide-react"

export default function SymptomsPage() {
  const { user } = useAuthContext()
  const patientProfileId = user && isPatientUser(user) ? user.profile.id : null
  const [symptomsList, setSymptomsList] = useState<SymptomResponse[]>([])
  const [weekStart] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    const loadSymptoms = async () => {
      if (!patientProfileId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await symptoms.getAll(patientProfileId)
        
        // Sort by occurrence date (most recent first)
        data.sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
        
        setSymptomsList(data)
      } catch (err) {
        console.error('Error loading symptoms:', err)
        setError('Error al cargar los síntomas')
      } finally {
        setIsLoading(false)
      }
    }

    loadSymptoms()
  }, [patientProfileId])

  const filteredSymptoms = useMemo(() => {
    let filtered = symptomsList

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(symptom =>
        symptom.symptomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symptom.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symptom.triggers?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by severity
    if (severityFilter !== "all") {
      filtered = filtered.filter(symptom => symptom.severity === severityFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const today = new Date()
      filtered = filtered.filter(symptom => {
        const symptomDate = new Date(symptom.occurrenceDate)
        switch (dateFilter) {
          case "today":
            return symptomDate.toDateString() === today.toDateString()
          case "yesterday":
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            return symptomDate.toDateString() === yesterday.toDateString()
          case "thisWeek":
            const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return symptomDate >= weekStart && symptomDate <= today
          case "thisMonth":
            const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            return symptomDate >= monthStart && symptomDate <= today
          default:
            return true
        }
      })
    }

    return filtered
  }, [symptomsList, searchTerm, severityFilter, dateFilter])

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'crítico':
        return 'bg-secondary/20 text-secondary-foreground border-secondary/30'
      case 'severo':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20'
      case 'moderado':
        return 'bg-primary/20 text-primary-foreground border-primary/30'
      case 'leve':
        return 'bg-primary/10 text-primary-foreground border-primary/20'
      default:
        return 'bg-muted text-muted-foreground border-muted'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'crítico':
        return 'Crítico'
      case 'severo':
        return 'Severo'
      case 'moderado':
        return 'Moderado'
      case 'leve':
        return 'Leve'
      default:
        return severity || 'N/A'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`)
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const criticalSymptoms = filteredSymptoms.filter(s => s.requiresMedicalAttention)
  const reportedToDoctor = filteredSymptoms.filter(s => s.reportedToDoctor)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <Loading message="Cargando síntomas..." />
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mis Síntomas
              </h1>
              <p className="text-muted-foreground text-lg">
                Registro y seguimiento de síntomas ({filteredSymptoms.length} {filteredSymptoms.length === 1 ? 'síntoma' : 'síntomas'})
              </p>
            </div>
            <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl">
              <Link href="/dashboard/paciente/sintomas/nuevo">
                <Plus className="mr-2 h-5 w-5" />
                Reportar Síntoma
              </Link>
            </Button>
          </div>

          {/* Critical Alerts */}
          {criticalSymptoms.length > 0 && (
            <Card className="border-2 border-destructive shadow-lg bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardHeader className="border-b border-destructive/30">
                <CardTitle className="flex items-center gap-3 text-destructive text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  Atención Médica Requerida
                </CardTitle>
                <CardDescription className="text-destructive font-semibold text-base mt-1">
                  Tienes {criticalSymptoms.length} síntoma(s) que requieren atención médica inmediata
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {criticalSymptoms.slice(0, 3).map((symptom) => (
                    <div key={symptom.id} className="flex items-center justify-between p-4 bg-card border-2 border-destructive/20 rounded-xl hover:border-destructive/40 transition-all">
                      <div>
                        <p className="font-bold text-lg">{symptom.symptomName}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {formatDate(symptom.occurrenceDate)} a las {formatTime(symptom.occurrenceTime)}
                        </p>
                      </div>
                      <Badge className={`${getSeverityColor(symptom.severity)} border-2 font-semibold`}>
                        {getSeverityText(symptom.severity)}
                      </Badge>
                    </div>
                  ))}
                </div>
                {criticalSymptoms.length > 3 && (
                  <p className="text-sm text-destructive font-semibold mt-4">
                    Y {criticalSymptoms.length - 3} más...
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Síntomas</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{symptomsList.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Síntomas reportados
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-destructive/20 hover:border-destructive/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Críticos</CardTitle>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-destructive mb-1">{criticalSymptoms.length}</div>
                <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span>
                  Requieren atención
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Reportados al Doctor</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Activity className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">{reportedToDoctor.length}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Notificados
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Esta Semana</CardTitle>
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {symptomsList.filter(s => {
                    return new Date(s.occurrenceDate).getTime() >= weekStart
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Últimos 7 días
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-xl font-bold">Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, notas o desencadenantes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-2 focus:border-primary"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12 border-2">
                    <SelectValue placeholder="Filtrar por severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Leve">Leve</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Severo">Severo</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-12 border-2">
                    <SelectValue placeholder="Filtrar por fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="yesterday">Ayer</SelectItem>
                    <SelectItem value="thisWeek">Esta semana</SelectItem>
                    <SelectItem value="thisMonth">Este mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Symptoms Table */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="text-2xl font-bold">Registro de Síntomas</CardTitle>
              <CardDescription className="mt-1">
                {filteredSymptoms.length} {filteredSymptoms.length === 1 ? 'síntoma encontrado' : 'síntomas encontrados'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {filteredSymptoms.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                    <Activity className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {searchTerm || severityFilter !== "all" || dateFilter !== "all"
                      ? "No se encontraron síntomas" 
                      : "No has reportado síntomas aún"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchTerm || severityFilter !== "all" || dateFilter !== "all"
                      ? "Intenta cambiar los filtros de búsqueda" 
                      : "Comienza reportando tus síntomas para ayudar a tu médico"}
                  </p>
                  {!searchTerm && severityFilter === "all" && dateFilter === "all" && (
                    <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg">
                      <Link href="/dashboard/paciente/sintomas/nuevo">
                        <Plus className="mr-2 h-5 w-5" />
                        Reportar Primer Síntoma
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Síntoma</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Requiere Atención</TableHead>
                      <TableHead>Reportado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSymptoms.map((symptom) => (
                      <TableRow key={symptom.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{symptom.symptomName}</p>
                            {symptom.notes && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {symptom.notes}
                              </p>
                            )}
                            {symptom.triggers && (
                              <p className="text-xs text-muted-foreground">
                                Desencadenantes: {symptom.triggers}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getSeverityColor(symptom.severity)} border-2 font-semibold`}>
                            {getSeverityText(symptom.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(symptom.occurrenceDate)}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(symptom.occurrenceTime)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {symptom.durationHours ? `${symptom.durationHours}h` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {symptom.requiresMedicalAttention ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-secondary mr-1" />
                                <span className="text-secondary font-medium">Sí</span>
                              </>
                            ) : (
                              <span className="text-primary">No</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={symptom.reportedToDoctor ? "default" : "secondary"} className="border-2">
                            {symptom.reportedToDoctor ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
