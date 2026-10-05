"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Clock, User, MapPin, FileText, ArrowLeft, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/auth-context"
import { isDoctorUser } from "@/types/organization"
import { appointments, doctors } from "@/lib/api"
import type { CreateAppointmentRequest, PatientProfileResponse, AppointmentType } from "@/lib/api"

const appointmentTypes: Array<{ value: AppointmentType, label: string }> = [
  { value: 'PRIMERA_CONSULTA', label: 'Primera consulta' },
  { value: 'CONSULTA_SEGUIMIENTO', label: 'Consulta de seguimiento' },
  { value: 'REVISION_TRATAMIENTO', label: 'Revisión de tratamiento' },
  { value: 'REVISION_EXAMENES', label: 'Revisión de exámenes' },
  { value: 'CONSULTA_URGENCIA', label: 'Consulta de urgencia' },
  { value: 'CONSULTA_POST_OPERATORIA', label: 'Consulta post-operatoria' },
  { value: 'SESION_QUIMIOTERAPIA', label: 'Sesión de quimioterapia' },
  { value: 'EXAMENES_LABORATORIO', label: 'Exámenes de laboratorio' },
  { value: 'CONSULTA_NUTRICION', label: 'Consulta nutricional' },
  { value: 'CONSULTA_PSICOLOGICA', label: 'Consulta psicológica' },
  { value: 'CONSULTA_DOLOR', label: 'Consulta de manejo del dolor' },
  { value: 'CONSULTA_GENERAL', label: 'Consulta general' },
  { value: 'OTRO', label: 'Otro' }
]

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
]

const durations = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora 30 minutos" },
  { value: 120, label: "2 horas" }
]

const locations = [
  "Consultorio 101 - Piso 1",
  "Consultorio 102 - Piso 1",
  "Consultorio 201 - Piso 2",
  "Consultorio 202 - Piso 2",
  "Consultorio 301 - Piso 3",
  "Sala de Infusiones - Piso 2",
  "Sala de Procedimientos - Piso 1",
  "Área de Quimioterapia - Piso 3",
  "Área de Radioterapia - Sótano",
  "Urgencias Oncológicas - Piso 1"
]

export default function NuevaCitaPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [patients, setPatients] = useState<PatientProfileResponse[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  
  const [formData, setFormData] = useState({
    patientProfileId: "" as string | number,
    date: undefined as Date | undefined,
    time: "",
    durationMinutes: 60,
    type: "" as AppointmentType | "",
    location: "",
    notes: "",
    preparationInstructions: "",
    sendReminder: true
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user && isDoctorUser(user)) {
      setDoctorProfileId(user.profile.id)
    }
  }, [user])

  useEffect(() => {
    const loadPatients = async () => {
      if (!doctorProfileId) return

      try {
        setIsLoadingPatients(true)
        const patientsList = await doctors.getPatients(doctorProfileId)
        setPatients(patientsList)
      } catch (err) {
        console.error('Error loading patients:', err)
        setError('Error al cargar la lista de pacientes')
      } finally {
        setIsLoadingPatients(false)
      }
    }

    loadPatients()
  }, [doctorProfileId])

  const handleInputChange = (field: string, value: string | Date | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!doctorProfileId) {
      setError("Error: No se pudo identificar el médico")
      setIsLoading(false)
      return
    }

    // Validación
    if (!formData.patientProfileId || formData.patientProfileId === "" || !formData.date || !formData.time || !formData.type) {
      setError("Por favor completa todos los campos obligatorios")
      setIsLoading(false)
      return
    }

    try {
      // Combinar fecha y hora en ISO string
      const [hours, minutes] = formData.time.split(':')
      const appointmentDateTime = new Date(formData.date)
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const appointmentData: CreateAppointmentRequest = {
        // The backend stores a LocalDateTime, so send the selected local wall-clock
        // time without converting it to UTC (which shifted appointments by 5 hours in Lima).
        appointmentDate: format(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
        durationMinutes: formData.durationMinutes,
        type: formData.type as AppointmentType,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        preparationInstructions: formData.preparationInstructions || undefined,
        sendReminder: formData.sendReminder
      }

      const patientId = typeof formData.patientProfileId === 'string' 
        ? parseInt(formData.patientProfileId) 
        : formData.patientProfileId;
      
      await appointments.create(doctorProfileId, patientId, appointmentData)
      setSuccess(true)

      setTimeout(() => {
        router.push("/dashboard/medico/calendario")
      }, 2000)
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError(err instanceof Error ? err.message : "Error al crear la cita")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-12">
            <Card className="text-center border-2 shadow-lg">
              <CardContent className="p-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary/20">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ¡Cita creada exitosamente!
                </h2>
                <p className="text-muted-foreground mb-8 text-lg font-medium">
                  La cita ha sido programada y se ha enviado una notificación al paciente.
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-6 text-lg font-semibold shadow-lg hover:shadow-xl">
                    <Link href="/dashboard/medico/calendario">Ver Calendario</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full h-12 px-6 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground">
                    <Link href="/dashboard/medico/citas/nueva">Crear Otra Cita</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="outline" size="sm" asChild className="border-2 hover:bg-primary hover:text-primary-foreground">
              <Link href="/dashboard/medico/calendario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Nueva Cita
              </h1>
              <p className="text-muted-foreground text-lg">Programa una nueva cita con un paciente</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            {/* Patient Selection */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Información del Paciente
                </CardTitle>
                <CardDescription className="mt-1 text-base">Selecciona el paciente para la cita</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient" className="text-base font-semibold">
                    Paciente <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.patientProfileId ? formData.patientProfileId.toString() : ""}
                    onValueChange={(value) => handleInputChange("patientProfileId", parseInt(value))}
                    disabled={isLoadingPatients}
                  >
                    <SelectTrigger id="patient" className="h-12 text-base border-2">
                      <SelectValue placeholder={isLoadingPatients ? "Cargando pacientes..." : "Selecciona un paciente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length === 0 && !isLoadingPatients ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No hay pacientes registrados
                        </div>
                      ) : (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.firstName} {patient.lastName} - {patient.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Date and Time */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <CalendarIcon className="h-5 w-5 text-secondary" />
                  </div>
                  Fecha y Hora
                </CardTitle>
                <CardDescription className="mt-1 text-base">Selecciona cuándo será la cita</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Fecha <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12 text-base border-2 hover:bg-primary hover:text-primary-foreground"
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {formData.date ? format(formData.date, "PPP") : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 dynamic-island rounded-xl border-border/50" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => handleInputChange("date", date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-base font-semibold">
                      Hora <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                      <SelectTrigger id="time" className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona una hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <Clock className="inline-block mr-2 h-4 w-4" />
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-base font-semibold">Duración</Label>
                  <Select
                    value={formData.durationMinutes.toString()}
                    onValueChange={(value) => handleInputChange("durationMinutes", parseInt(value))}
                  >
                    <SelectTrigger id="duration" className="h-12 text-base border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  Detalles de la Cita
                </CardTitle>
                <CardDescription className="mt-1 text-base">Información adicional sobre la cita</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-base font-semibold">
                    Tipo de Cita <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value as AppointmentType)}
                  >
                    <SelectTrigger id="type" className="h-12 text-base border-2">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Ubicación
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => handleInputChange("location", value)}
                  >
                    <SelectTrigger id="location" className="h-12 text-base border-2">
                      <SelectValue placeholder="Selecciona una ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-semibold">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional sobre la cita"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                    className="text-base border-2 focus:border-primary min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparation" className="text-base font-semibold">Instrucciones de Preparación</Label>
                  <Textarea
                    id="preparation"
                    placeholder="Indicaciones para el paciente antes de la cita"
                    value={formData.preparationInstructions}
                    onChange={(e) => handleInputChange("preparationInstructions", e.target.value)}
                    rows={4}
                    className="text-base border-2 focus:border-primary min-h-[100px]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                  <div className="space-y-1">
                    <Label htmlFor="reminder" className="text-base font-semibold">Enviar Recordatorio</Label>
                    <p className="text-sm text-muted-foreground font-medium">
                      El paciente recibirá un recordatorio antes de la cita
                    </p>
                  </div>
                  <Switch
                    id="reminder"
                    checked={formData.sendReminder}
                    onCheckedChange={(checked) => handleInputChange("sendReminder", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" asChild className="h-12 px-8 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground">
                <Link href="/dashboard/medico/calendario">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50">
                {isLoading ? "Creando..." : "Crear Cita"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
