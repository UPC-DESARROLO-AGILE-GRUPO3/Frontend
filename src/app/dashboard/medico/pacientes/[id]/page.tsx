"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import { doctors, appointments as appointmentsApi, treatments, medicalHistory } from "@/lib/api"
import type { PatientProfileResponse, AppointmentResponse, TreatmentResponse, HistoryEntryResponse, AllergyResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { 
  ArrowLeft,
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  Heart,
  FileText,
  Clock,
  AlertTriangle,
  Shield,
  Edit,
  Stethoscope
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PatientVitalsHistory } from '@/components/dashboard/doctor/PatientVitalsHistory';
import { PatientLatestVitals } from '@/components/dashboard/doctor/PatientLatestVitals';

export default function PatientDetailsPage() {
  const { user } = useAuthContext()
  const params = useParams()
  const patientId = params.id as string
  
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null
  const doctorAccountProfileId = user && isDoctorUser(user) ? user.profile.accountProfileId : null
  const [patient, setPatient] = useState<PatientProfileResponse | null>(null)
  const [appointmentsData, setAppointmentsData] = useState<AppointmentResponse[]>([])
  const [treatmentsData, setTreatmentsData] = useState<TreatmentResponse[]>([])
  const [medicalHistoryEntries, setMedicalHistoryEntries] = useState<HistoryEntryResponse[]>([])
  const [allergies, setAllergies] = useState<AllergyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadPatientData = async () => {
      if (!doctorProfileId) return
      
      setIsLoading(true)
      setError("")
      
      try {
        // Get patient by ID from doctor's patients
        const allPatients = await doctors.getPatients(doctorProfileId)
        const patientData = allPatients.find(p => p.id.toString() === patientId)
        
        if (!patientData) {
          setError("Paciente no encontrado")
          setIsLoading(false)
          return
        }
        
        setPatient(patientData)
        
        // Load related data
        const patientProfileId = patientData.id
        
        const [appointmentsResult, treatmentsResult, historyData, allergiesData] = await Promise.all([
          doctorAccountProfileId
            ? appointmentsApi.getDoctorAppointments(doctorAccountProfileId)
              .then(data => data.filter(apt => apt.patientId === patientData.accountProfileId))
              .catch(() => [])
            : Promise.resolve([]),
          treatments.getDoctorTreatments(doctorProfileId)
            .then(data => data.filter(t => Number(t.patientProfileId) === patientProfileId))
            .catch(() => []),
          medicalHistory.getHistory(patientProfileId)
            .catch(() => []),
          medicalHistory.getAllergies(patientProfileId)
            .catch(() => [])
        ])
        
        setAppointmentsData(appointmentsResult)
        setTreatmentsData(treatmentsResult)
        setMedicalHistoryEntries(historyData)
        setAllergies(allergiesData)
        
      } catch (err) {
        console.error("Error loading patient data:", err)
        setError("Error al cargar los datos del paciente")
      } finally {
        setIsLoading(false)
      }
    }

    loadPatientData()
  }, [doctorProfileId, doctorAccountProfileId, patientId])

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "N/A"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificado"
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "ACTIVO":
        return "default"
      case "COMPLETED":
      case "COMPLETADO":
        return "secondary"
      case "CANCELLED":
      case "CANCELADO":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getAppointmentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SCHEDULED":
      case "PROGRAMADA":
        return "bg-blue-500/10 text-blue-500"
      case "CONFIRMED":
      case "CONFIRMADA":
        return "bg-green-500/10 text-green-500"
      case "COMPLETED":
      case "COMPLETADA":
        return "bg-gray-500/10 text-gray-500"
      case "CANCELLED":
      case "CANCELADA":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }


  const getHistoryTypeIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case "CONSULTATION":
      case "CONSULTA":
        return <Stethoscope className="h-5 w-5 text-primary" />
      case "DIAGNOSIS":
      case "DIAGNÓSTICO":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "TREATMENT":
      case "TRATAMIENTO":
        return <Activity className="h-5 w-5 text-blue-500" />
      case "LAB_RESULT":
      case "RESULTADO_LABORATORIO":
        return <FileText className="h-5 w-5 text-green-500" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error || !patient) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <Link href="/dashboard/medico/pacientes">
              <Button variant="outline" className="border-2 hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a pacientes
              </Button>
            </Link>
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-semibold">
                {error || "Paciente no encontrado"}
              </AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Link href="/dashboard/medico/pacientes">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a pacientes
              </Button>
            </Link>
            
            {/* Patient Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">
                        {patient.firstName} {patient.lastName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {patient.profileId}
                        </code>
                        <Badge variant={patient.isActive ? "default" : "secondary"}>
                          {patient.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/dashboard/medico/pacientes/${patient.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{patient.email}</span>
                  </div>
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patient.phone}</span>
                    </div>
                  )}
                  {patient.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patient.city}</span>
                    </div>
                  )}
                  {patient.birthDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{calculateAge(patient.birthDate)} años</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tratamientos Activos</p>
                    <p className="text-2xl font-bold">{patient.activeTreatments}</p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Citas Próximas</p>
                    <p className="text-2xl font-bold">{patient.upcomingAppointments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alergias Registradas</p>
                    <p className="text-2xl font-bold">{allergies.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IoT Vitals Banner (High Priority) */}
          <PatientLatestVitals />

          {/* Tabs */}
          <Tabs defaultValue="medical" className="space-y-4">
            <TabsList>
              <TabsTrigger value="medical">Información Médica</TabsTrigger>
              <TabsTrigger value="appointments">Citas</TabsTrigger>
              <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="iot">Monitoreo IoT</TabsTrigger>
            </TabsList>

            {/* Medical Information Tab */}
            <TabsContent value="medical" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cancer Information */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      Información Oncológica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Tipo de Cáncer</p>
                      <p className="text-base font-bold">{patient.cancerType || "No especificado"}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Etapa</p>
                      <p className="text-base font-bold">{patient.cancerStage || "No especificado"}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Fecha de Diagnóstico</p>
                      <p className="text-base font-bold">{formatDate(patient.diagnosisDate)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Estado de Tratamiento</p>
                      <Badge variant="outline" className="border-2 font-semibold">{patient.treatmentStatus || "No especificado"}</Badge>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Último Tratamiento</p>
                      <p className="text-base font-bold">{formatDate(patient.lastTreatmentDate)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Medical Details */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Heart className="h-6 w-6 text-secondary" />
                      </div>
                      Información Médica General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Tipo de Sangre</p>
                      <p className="text-base font-bold">{patient.bloodType || "No especificado"}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Historial Médico</p>
                      <p className="text-sm font-medium">{patient.medicalHistory || "No especificado"}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Medicamentos Actuales</p>
                      <p className="text-sm font-medium">{patient.currentMedications || "No especificado"}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Alergias</p>
                      <p className="text-sm font-medium">{patient.allergies || "No especificado"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance */}
                {(patient.insuranceProvider || patient.insuranceNumber) && (
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Shield className="h-6 w-6 text-accent" />
                        </div>
                        Seguro Médico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Proveedor</p>
                        <p className="text-base font-bold">{patient.insuranceProvider || "No especificado"}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Número de Póliza</p>
                        <p className="text-base font-bold">{patient.insuranceNumber || "No especificado"}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Emergency Contact */}
                {patient.emergencyContactName && (
                  <Card className="border-2 shadow-lg border-primary/20">
                    <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-background">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <AlertTriangle className="h-6 w-6 text-primary" />
                        </div>
                        Contacto de Emergencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Nombre</p>
                        <p className="text-base font-bold">{patient.emergencyContactName}</p>
                      </div>
                      {patient.emergencyContactPhone && (
                        <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Teléfono</p>
                          <p className="text-base font-bold">{patient.emergencyContactPhone}</p>
                        </div>
                      )}
                      {patient.emergencyContactRelationship && (
                        <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Relación</p>
                          <p className="text-base font-bold">{patient.emergencyContactRelationship}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Allergies */}
              {allergies.length > 0 && (
                <Card className="border-2 shadow-lg border-destructive/20">
                  <CardHeader className="border-b bg-gradient-to-r from-destructive/10 to-background">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <Shield className="h-6 w-6 text-destructive" />
                      </div>
                      Alergias Detalladas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {allergies.map((allergy) => (
                        <div key={allergy.id} className="flex items-start gap-3 p-4 bg-destructive/10 rounded-xl border-2 border-destructive/20 hover:border-destructive/40 transition-all">
                          <div className="p-2 rounded-lg bg-destructive/20">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-destructive text-base">{allergy.allergen}</p>
                            {allergy.reaction && (
                              <p className="text-sm text-muted-foreground font-medium mt-1">Reacción: {allergy.reaction}</p>
                            )}
                            <Badge variant="outline" className="mt-2 border-2 font-semibold">
                              Severidad: {allergy.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-6">
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      Citas del Paciente
                    </CardTitle>
                    <Link href={`/dashboard/medico/citas/nueva?patientId=${patient.id}`}>
                      <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0">
                        <Calendar className="mr-2 h-4 w-4" />
                        Nueva Cita
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {appointmentsData.length === 0 ? (
                    <div className="py-12 text-center">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay citas registradas</p>
                      <p className="text-sm text-muted-foreground mt-2">Las citas de este paciente aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointmentsData.map((appointment) => (
                        <Card key={appointment.id} className="border-2 hover:border-primary/40 hover:shadow-md transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <Badge className={`${getAppointmentStatusColor(appointment.status)} border-2 font-semibold`}>
                                    {appointment.status}
                                  </Badge>
                                  <Badge variant="outline" className="border-2 font-semibold">{appointment.type}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{appointment.durationMinutes} min</span>
                                  </div>
                                  {appointment.location && (
                                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                      <MapPin className="h-4 w-4 text-primary" />
                                      <span className="font-medium">{appointment.location}</span>
                                    </div>
                                  )}
                                </div>
                                {appointment.notes && (
                                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Notas:</p>
                                    <p className="text-sm font-medium">{appointment.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Treatments Tab */}
            <TabsContent value="treatments" className="space-y-6">
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      Tratamientos del Paciente
                    </CardTitle>
                    <Link href={`/dashboard/medico/tratamientos/nuevo?patientId=${patient.id}`}>
                      <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0">
                        <Activity className="mr-2 h-4 w-4" />
                        Nuevo Tratamiento
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {treatmentsData.length === 0 ? (
                    <div className="py-12 text-center">
                      <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay tratamientos registrados</p>
                      <p className="text-sm text-muted-foreground mt-2">Los tratamientos de este paciente aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {treatmentsData.map((treatment) => (
                        <Link key={treatment.id} href={`/dashboard/medico/tratamientos/${treatment.id}`}>
                          <Card className="border-2 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold mb-1">{treatment.type}</h4>
                                    <p className="text-sm font-medium text-muted-foreground">{treatment.protocol}</p>
                                  </div>
                                  <Badge variant={getStatusBadgeVariant(treatment.status)} className="border-2 font-semibold">
                                    {treatment.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Inicio</p>
                                    <p className="text-sm font-bold">{formatDate(treatment.startDate)}</p>
                                  </div>
                                  <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Ciclos</p>
                                    <p className="text-sm font-bold">
                                      {treatment.currentCycle} / {treatment.totalCycles}
                                    </p>
                                  </div>
                                  {treatment.location && (
                                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">Ubicación</p>
                                      <p className="text-sm font-bold">{treatment.location}</p>
                                    </div>
                                  )}
                                  {treatment.sessionDurationMinutes && (
                                    <div className="p-3 bg-muted/50 rounded-xl border-2 border-border/50">
                                      <p className="text-xs font-semibold text-muted-foreground mb-1">Duración</p>
                                      <p className="text-sm font-bold">{treatment.sessionDurationMinutes} min</p>
                                    </div>
                                  )}
                                </div>
                                {treatment.notes && (
                                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Notas:</p>
                                    <p className="text-sm font-medium">{treatment.notes}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    Historial Médico
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {medicalHistoryEntries.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold text-muted-foreground">No hay entradas en el historial</p>
                      <p className="text-sm text-muted-foreground mt-2">Las entradas del historial médico aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {medicalHistoryEntries.map((entry) => (
                        <Card key={entry.id} className="border-2 hover:border-primary/40 hover:shadow-md transition-all">
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold mb-1">{entry.title}</h4>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {formatDate(entry.date)}
                                  </p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/50">
                                  {getHistoryTypeIcon(entry.type)}
                                </div>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                                <p className="text-sm font-medium">{entry.description}</p>
                              </div>
                              {entry.doctorName && (
                                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                                  <User className="h-4 w-4 text-primary" />
                                  <p className="text-sm font-semibold text-primary">
                                    Doctor: {entry.doctorName} {entry.specialty && `- ${entry.specialty}`}
                                  </p>
                                </div>
                              )}
                              {entry.documents && entry.documents.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {entry.documents.map((doc, idx) => (
                                    <Badge key={idx} variant="outline" className="border-2 font-semibold">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {doc}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* IoT Monitoring Tab */}
            <TabsContent value="iot" className="space-y-6">
                <PatientVitalsHistory 
                  currentPatientId={patient.id}
                  currentPatientName={`${patient.firstName} ${patient.lastName}`}
                />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
