"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Pill, Activity, Plus, Search, Eye, Edit } from "lucide-react"
import Link from "next/link"
import { useAuthContext } from "@/contexts/auth-context"
import { treatments } from "@/lib/api"
import type { TreatmentResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { Loading } from "@/components/loading"

const estadoColors = {
  ACTIVE: "bg-primary/20 text-primary-foreground",
  PAUSED: "bg-primary/10 text-primary-foreground",
  COMPLETED: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-muted/50 text-muted-foreground",
}

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

export default function TratamientosPage() {
  const { user } = useAuthContext()
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null
  const [tratamientosList, setTratamientosList] = useState<TreatmentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroTipo, setFiltroTipo] = useState("todos")

  useEffect(() => {
    const loadTreatments = async () => {
      if (!doctorProfileId) return

      try {
        setIsLoading(true)
        setError(null)
        const data = await treatments.getDoctorTreatments(doctorProfileId)
        setTratamientosList(data)
      } catch (err) {
        console.error('Error loading treatments:', err)
        setError('Error al cargar los tratamientos')
      } finally {
        setIsLoading(false)
      }
    }

    loadTreatments()
  }, [doctorProfileId])

  const tratamientosFiltrados = tratamientosList.filter((tratamiento) => {
    const matchesSearch =
      tratamiento.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipoNames[tratamiento.type]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tratamiento.protocol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filtroEstado === "todos" || tratamiento.status === filtroEstado
    const matchesTipo = filtroTipo === "todos" || tratamiento.type === filtroTipo

    return matchesSearch && matchesEstado && matchesTipo
  })

  // Calculate stats
  const stats = {
    total: tratamientosList.length,
    activos: tratamientosList.filter(t => t.status === 'ACTIVE').length,
    pausados: tratamientosList.filter(t => t.status === 'PAUSED').length,
    completados: tratamientosList.filter(t => t.status === 'COMPLETED').length,
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando tratamientos..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requiredRole="DOCTOR">
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
      <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestión de Tratamientos
          </h1>
          <p className="text-muted-foreground text-lg">Administra los protocolos de tratamiento de tus pacientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/medico/tratamientos/propuestas">Ver propuestas</Link>
          </Button>
          <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl" asChild>
            <Link href="/dashboard/medico/tratamientos/nuevo">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo tratamiento
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Tratamientos</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Tratamientos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Activos</CardTitle>
            <div className="p-2 rounded-lg bg-secondary/10">
              <Pill className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1">{stats.activos}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              En curso
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pausados</CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1">{stats.pausados}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              Temporalmente pausados
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-muted/20 hover:border-muted/40 transition-all hover:shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-muted/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Completados</CardTitle>
            <div className="p-2 rounded-lg bg-muted/10">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground mb-1">{stats.completados}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
              Finalizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
          <CardTitle className="text-xl font-bold">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Buscar por paciente, tipo o protocolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-primary"
              />
            </div>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-[200px] h-12 border-2">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="PAUSED">Pausados</SelectItem>
                <SelectItem value="COMPLETED">Completados</SelectItem>
                <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full md:w-[200px] h-12 border-2">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="CHEMOTHERAPY">Quimioterapia</SelectItem>
                <SelectItem value="RADIOTHERAPY">Radioterapia</SelectItem>
                <SelectItem value="IMMUNOTHERAPY">Inmunoterapia</SelectItem>
                <SelectItem value="SURGERY">Cirugía</SelectItem>
                <SelectItem value="HORMONE_THERAPY">Terapia Hormonal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tratamientos */}
      <div className="grid grid-cols-1 gap-6">
        {tratamientosFiltrados.length === 0 ? (
          <Card className="border-2 shadow-lg">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <Activity className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {searchTerm || filtroEstado !== "todos" || filtroTipo !== "todos"
                  ? "No se encontraron tratamientos"
                  : "No hay tratamientos registrados"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filtroEstado !== "todos" || filtroTipo !== "todos"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Comienza creando tratamientos para tus pacientes"}
              </p>
              {!searchTerm && filtroEstado === "todos" && filtroTipo === "todos" && (
                <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg" asChild>
                  <Link href="/dashboard/medico/tratamientos/nuevo">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Primer Tratamiento
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          tratamientosFiltrados.map((tratamiento) => (
            <Card key={tratamiento.id} className="border-2 shadow-lg hover:border-primary/40 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-foreground">{tratamiento.patientName}</h3>
                      <Badge className={`${estadoColors[tratamiento.status as keyof typeof estadoColors]} border-2 font-semibold`}>
                        {estadoNames[tratamiento.status] || tratamiento.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <Pill className="w-4 h-4 text-primary" />
                        {tipoNames[tratamiento.type] || tratamiento.type}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <Activity className="w-4 h-4 text-primary" />
                        Protocolo: {tratamiento.protocol}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        Ciclo {tratamiento.currentCycle}/{tratamiento.totalCycles}
                      </span>
                    </div>

                    {tratamiento.nextSession && (
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Clock className="w-4 h-4" />
                        Próxima sesión: {new Date(tratamiento.nextSession).toLocaleDateString('es-ES')}
                      </div>
                    )}

                    {tratamiento.notes && (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border-2 border-muted">{tratamiento.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="border-2 hover:bg-primary hover:text-primary-foreground" asChild>
                      <Link href={`/dashboard/medico/tratamientos/${tratamiento.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    {tratamiento.status === "ACTIVE" && (
                      <Button variant="outline" size="sm" className="border-2 hover:bg-secondary hover:text-secondary-foreground" asChild>
                        <Link href={`/dashboard/medico/tratamientos/nuevo?treatmentId=${tratamiento.id}`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Proponer cambios
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-muted-foreground">Progreso del tratamiento</span>
                    <span className="text-foreground">{tratamiento.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 border-2 border-border/50">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 shadow-lg"
                      style={{ width: `${tratamiento.progressPercentage}%` }}
                    />
                  </div>
                </div>
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
