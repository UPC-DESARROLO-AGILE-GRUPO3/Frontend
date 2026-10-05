"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { useAuthContext } from "@/contexts/auth-context"
import { appointments } from "@/lib/api"
import type { AppointmentType, CreateAppointmentRequest } from "@/lib/api"
import { isPatientUser } from "@/types/organization"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ArrowLeft, 
  Save, 
  Info,
  CheckCircle
} from "lucide-react"
import { format, isBefore, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

const appointmentTypes: { value: AppointmentType; label: string; description: string; duration: number }[] = [
  { value: "PRIMERA_CONSULTA", label: "Primera Consulta", description: "Consulta inicial con el médico", duration: 60 },
  { value: "CONSULTA_SEGUIMIENTO", label: "Consulta de Seguimiento", description: "Revisión médica de rutina", duration: 30 },
  { value: "REVISION_TRATAMIENTO", label: "Revisión de Tratamiento", description: "Evaluación del tratamiento actual", duration: 45 },
  { value: "REVISION_EXAMENES", label: "Revisión de Exámenes", description: "Revisión de resultados de laboratorio", duration: 20 },
  { value: "CONSULTA_URGENCIA", label: "Consulta de Urgencia", description: "Atención médica urgente", duration: 45 },
  { value: "CONSULTA_POST_OPERATORIA", label: "Consulta Post-Operatoria", description: "Seguimiento después de cirugía", duration: 30 },
  { value: "SESION_QUIMIOTERAPIA", label: "Sesión de Quimioterapia", description: "Sesión de quimioterapia programada", duration: 180 },
  { value: "EXAMENES_LABORATORIO", label: "Exámenes de Laboratorio", description: "Toma de muestras de laboratorio", duration: 15 },
  { value: "CONSULTA_NUTRICION", label: "Consulta Nutricional", description: "Asesoramiento nutricional", duration: 30 },
  { value: "CONSULTA_PSICOLOGICA", label: "Consulta Psicológica", description: "Apoyo psicológico", duration: 60 },
  { value: "CONSULTA_DOLOR", label: "Consulta de Manejo del Dolor", description: "Evaluación y manejo del dolor", duration: 45 },
  { value: "CONSULTA_GENERAL", label: "Consulta General", description: "Consulta médica general", duration: 30 },
  { value: "OTRO", label: "Otro", description: "Otro tipo de consulta", duration: 30 }
]

const locations = [
  "Consultorio 101 - Piso 1",
  "Consultorio 102 - Piso 1",
  "Consultorio 201 - Piso 2",
  "Consultorio 202 - Piso 2",
  "Sala de Infusiones - Piso 3",
  "Laboratorio Clínico - Piso 1",
  "Sala de Procedimientos",
  "Consultorio Virtual",
  "Urgencias",
  "Hospital Principal"
]

export default function NuevaCitaPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null)
  const [doctorProfileId, setDoctorProfileId] = useState<number | null>(null)
  const [doctorName, setDoctorName] = useState<string>("")
  
  const [formData, setFormData] = useState({
    type: "" as AppointmentType | "",
    date: undefined as Date | undefined,
    time: "",
    durationMinutes: 30,
    location: "",
    notes: "",
    preparationInstructions: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user && isPatientUser(user)) {
      setPatientProfileId(user.profile.id)
      setDoctorProfileId(user.profile.doctorProfileId)
      setDoctorName(user.profile.doctorName || "Tu médico")
    }
  }, [user])

  const handleInputChange = (field: string, value: string | Date | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Update duration when appointment type changes
    if (field === "type") {
      const selectedType = appointmentTypes.find(t => t.value === value)
      if (selectedType) {
        setFormData(prev => ({ ...prev, durationMinutes: selectedType.duration }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!patientProfileId || !doctorProfileId) {
      setError("No se pudo identificar al paciente o al doctor")
      return
    }

    if (!formData.type || !formData.date || !formData.time) {
      setError("Por favor completa todos los campos requeridos")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess(false)

    try {
      // Combine date and time into ISO string
      const [hours, minutes] = formData.time.split(':')
      const appointmentDateTime = new Date(formData.date)
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const appointmentData: CreateAppointmentRequest = {
        // Preserve the local time selected by the patient. The backend receives
        // LocalDateTime and must not be given a UTC-converted ISO value.
        appointmentDate: format(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
        durationMinutes: formData.durationMinutes,
        type: formData.type as AppointmentType,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        preparationInstructions: formData.preparationInstructions || undefined
      }

      await appointments.create(doctorProfileId, patientProfileId, appointmentData)
      
      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard/paciente/citas")
      }, 2000)
    } catch (err) {
      console.error("Error creating appointment:", err)
      setError(err instanceof Error ? err.message : "Error al solicitar la cita")
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.type && formData.date && formData.time

  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
  ]

  if (success) {
    return (
      <AuthGuard requiredRole="PATIENT">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md border-2 shadow-lg">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4 border-2 border-primary/20">
                      <CheckCircle className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ¡Solicitud Enviada!
                    </h3>
                    <p className="text-muted-foreground text-lg font-medium">
                      Tu solicitud de cita ha sido enviada exitosamente. El doctor la revisará y te contactará pronto.
                    </p>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-6 text-lg font-semibold shadow-lg hover:shadow-xl">
                    <Link href="/dashboard/paciente/citas">Ver Mis Citas</Link>
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
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/paciente/citas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Solicitar Nueva Cita</h1>
              <p className="text-muted-foreground">Agenda una cita médica con {doctorName}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Detalles de la Cita
                  </CardTitle>
                  <CardDescription>Información básica de tu consulta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Consulta *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleInputChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de consulta" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor Asignado</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">{doctorName}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Motivo de la Consulta</Label>
                    <Textarea
                      placeholder="Describe brevemente el motivo de tu consulta..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-secondary" />
                    Programación
                  </CardTitle>
                  <CardDescription>Fecha, hora y ubicación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha Preferida *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start bg-transparent"
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "dd/MM/yyyy", { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={formData.date} 
                          onSelect={(date) => date && handleInputChange("date", date)} 
                          locale={es} 
                          initialFocus
                          disabled={(date) => isBefore(date, startOfDay(new Date()))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Hora Preferida *</Label>
                    <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración Estimada</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formData.durationMinutes} minutos</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la ubicación" />
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
                    <Label htmlFor="preparationInstructions">Instrucciones de Preparación</Label>
                    <Textarea
                      placeholder="Si tienes alguna condición especial o necesitas preparación..."
                      value={formData.preparationInstructions}
                      onChange={(e) => handleInputChange("preparationInstructions", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Important Information */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Tu solicitud de cita será enviada al doctor para su aprobación. 
                Recibirás una notificación una vez que el doctor confirme o sugiera una fecha alternativa.
              </AlertDescription>
            </Alert>

            {/* Summary Card */}
            {formData.type && formData.date && formData.time && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de la Solicitud</CardTitle>
                  <CardDescription>Revisa la información antes de enviar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Tipo de Consulta:</span>
                      <p className="font-medium">
                        {appointmentTypes.find(t => t.value === formData.type)?.label}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Doctor:</span>
                      <p className="font-medium">{doctorName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Fecha y Hora:</span>
                      <p className="font-medium">
                        {format(formData.date, "dd/MM/yyyy", { locale: es })} a las {formData.time}
                      </p>
                    </div>
                    {formData.location && (
                      <div>
                        <span className="font-medium text-muted-foreground">Ubicación:</span>
                        <p className="font-medium">{formData.location}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-muted-foreground">Duración:</span>
                      <p className="font-medium">{formData.durationMinutes} minutos</p>
                    </div>
                  </div>
                  {formData.notes && (
                    <div className="mt-4">
                      <span className="font-medium text-muted-foreground">Motivo:</span>
                      <p className="text-sm mt-1">{formData.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild type="button">
                <Link href="/dashboard/paciente/citas">Cancelar</Link>
              </Button>
              <Button 
                type="submit" 
                className="oncontrol-gradient text-white"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando Solicitud...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Solicitar Cita
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
