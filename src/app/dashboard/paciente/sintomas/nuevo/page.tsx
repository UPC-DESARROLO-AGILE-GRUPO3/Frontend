"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertTriangle, CalendarIcon, Activity, ArrowLeft, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useAuthContext } from "@/contexts/auth-context"
import { symptoms } from "@/lib/api"
import type { CreateSymptomRequest } from "@/lib/api"
import { isPatientUser } from "@/types/organization"

// Symptom types and severity levels
const symptomTypes = [
  "Fatiga",
  "Náuseas",
  "Vómitos",
  "Dolor de cabeza",
  "Dolor muscular",
  "Dolor articular",
  "Dolor abdominal",
  "Dolor de pecho",
  "Dificultad para respirar",
  "Tos",
  "Fiebre",
  "Escalofríos",
  "Sudoración nocturna",
  "Pérdida de apetito",
  "Pérdida de peso",
  "Aumento de peso",
  "Estreñimiento",
  "Diarrea",
  "Sofocos",
  "Insomnio",
  "Ansiedad",
  "Depresión",
  "Irritabilidad",
  "Confusión",
  "Pérdida de memoria",
  "Dificultad para concentrarse",
  "Pérdida de cabello",
  "Cambios en la piel",
  "Hormigueo en manos/pies",
  "Debilidad muscular",
  "Otro"
]

const severityLevels = [
  { value: "Leve", label: "Leve", description: "Molesto pero no interfiere con las actividades diarias" },
  { value: "Moderada", label: "Moderada", description: "Interfiere con algunas actividades diarias" },
  { value: "Severa", label: "Severa", description: "Interfiere significativamente con las actividades diarias" },
  { value: "Muy Severa", label: "Muy Severa", description: "Incapacitante, requiere atención médica inmediata" }
]

const commonTriggers = [
  "Tratamiento de quimioterapia",
  "Tratamiento de radioterapia",
  "Medicamentos",
  "Estrés",
  "Ansiedad",
  "Falta de sueño",
  "Cambios en la dieta",
  "Actividad física",
  "Cambios de temperatura",
  "Ruido",
  "Luz brillante",
  "Olores fuertes",
  "Ayuno prolongado",
  "Deshidratación",
  "Otro"
]

const managementActions = [
  "Descanso",
  "Hidratación",
  "Medicación prescrita",
  "Medicación de venta libre",
  "Técnicas de relajación",
  "Ejercicios de respiración",
  "Aplicación de calor",
  "Aplicación de frío",
  "Masaje",
  "Distracción",
  "Música relajante",
  "Baño tibio",
  "Comida ligera",
  "Evitar alimentos específicos",
  "Ventilación",
  "Ropa cómoda",
  "Otro"
]

export default function NuevoSintomaPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const patientProfileId = user && isPatientUser(user) ? user.profile.id : null
  const [formData, setFormData] = useState({
    symptom: "",
    severity: "",
    date: new Date(),
    time: "",
    duration: "",
    notes: "",
    triggers: [] as string[],
    managementActions: [] as string[],
    customSymptom: "",
    customTrigger: "",
    customManagement: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomSymptom, setShowCustomSymptom] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string | Date | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckboxChange = (field: 'triggers' | 'managementActions', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!patientProfileId) {
      setError("No se pudo identificar el paciente")
      return
    }
    
    setIsSubmitting(true)
    setError("")

    try {
      // Map severity to backend values
      const severityMap: Record<string, 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'> = {
        'Leve': 'MILD',
        'Moderada': 'MODERATE',
        'Severa': 'SEVERE',
        'Muy Severa': 'CRITICAL'
      }

      const symptomData: CreateSymptomRequest = {
        symptomName: formData.symptom || formData.customSymptom,
        severity: severityMap[formData.severity] || 'MODERATE',
        occurrenceDate: format(formData.date, 'yyyy-MM-dd'),
        occurrenceTime: formData.time,
        durationHours: formData.duration ? parseFloat(formData.duration) : undefined,
        notes: formData.notes || undefined,
        triggers: formData.triggers.length > 0 ? formData.triggers.join(', ') : undefined,
        managementActions: undefined,
        impactOnDailyLife: undefined,
        requiresMedicalAttention: formData.severity === 'Muy Severa'
      }

      console.log('Sending symptom data:', symptomData)
      await symptoms.create(patientProfileId, symptomData)
      
      // Redirect to symptoms page after successful submission
      router.push("/dashboard/paciente/sintomas")
    } catch (err) {
      console.error("Error creating symptom:", err)
      setError(err instanceof Error ? err.message : "Error al registrar el síntoma")
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.symptom && formData.severity && formData.time && formData.duration

  return (
    <AuthGuard requiredRole="PATIENT">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="outline" size="sm" asChild className="border-2 hover:bg-primary hover:text-primary-foreground">
              <Link href="/dashboard/paciente/sintomas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Reportar Síntoma
              </h1>
              <p className="text-muted-foreground text-lg">Registra un nuevo síntoma para tu seguimiento médico</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    Información Básica
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">Detalles principales del síntoma</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="symptom" className="text-base font-semibold">Tipo de Síntoma *</Label>
                    <Select value={formData.symptom} onValueChange={(value) => {
                      if (value === "Otro") {
                        setShowCustomSymptom(true)
                        handleInputChange("symptom", "")
                      } else {
                        setShowCustomSymptom(false)
                        handleInputChange("symptom", value)
                      }
                    }}>
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona el síntoma" />
                      </SelectTrigger>
                      <SelectContent>
                        {symptomTypes.map((symptom) => (
                          <SelectItem key={symptom} value={symptom}>
                            {symptom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showCustomSymptom && (
                      <Input
                        placeholder="Describe tu síntoma"
                        value={formData.customSymptom}
                        onChange={(e) => handleInputChange("customSymptom", e.target.value)}
                        className="h-12 text-base border-2 focus:border-primary"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity" className="text-base font-semibold">Severidad *</Label>
                    <Select value={formData.severity} onValueChange={(value) => handleInputChange("severity", value)}>
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona la severidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {severityLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div>
                              <div className="font-bold">{level.label}</div>
                              <div className="text-xs text-muted-foreground font-medium">{level.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-base font-semibold">Fecha *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start h-12 text-base border-2 hover:bg-primary hover:text-primary-foreground">
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {format(formData.date, "dd/MM/yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dynamic-island rounded-xl border-border/50" align="start">
                          <Calendar 
                            mode="single" 
                            selected={formData.date} 
                            onSelect={(date) => date && handleInputChange("date", date)} 
                            locale={es} 
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-base font-semibold">Hora *</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        className="h-12 text-base border-2 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base font-semibold">Duración *</Label>
                    <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue placeholder="¿Cuánto duró?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Menos de 30 minutos">Menos de 30 minutos</SelectItem>
                        <SelectItem value="30 minutos - 1 hora">30 minutos - 1 hora</SelectItem>
                        <SelectItem value="1-2 horas">1-2 horas</SelectItem>
                        <SelectItem value="2-4 horas">2-4 horas</SelectItem>
                        <SelectItem value="4-8 horas">4-8 horas</SelectItem>
                        <SelectItem value="8-12 horas">8-12 horas</SelectItem>
                        <SelectItem value="12-24 horas">12-24 horas</SelectItem>
                        <SelectItem value="Todo el día">Todo el día</SelectItem>
                        <SelectItem value="Varios días">Varios días</SelectItem>
                        <SelectItem value="Continúa">Continúa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <AlertTriangle className="h-5 w-5 text-secondary" />
                    </div>
                    Información Adicional
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">Contexto y manejo del síntoma</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-base font-semibold">Notas Adicionales</Label>
                    <Textarea
                      placeholder="Describe el síntoma con más detalle, cómo te sentiste, qué lo empeoró o mejoró..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={4}
                      className="text-base border-2 focus:border-primary min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Posibles Causas o Desencadenantes</Label>
                    <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                      {commonTriggers.map((trigger) => (
                        <div key={trigger} className="flex items-center space-x-3">
                          <Checkbox
                            id={`trigger-${trigger}`}
                            checked={formData.triggers.includes(trigger)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange("triggers", trigger, checked as boolean)
                            }
                            className="border-2"
                          />
                          <Label 
                            htmlFor={`trigger-${trigger}`} 
                            className="text-sm font-semibold cursor-pointer"
                          >
                            {trigger}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.triggers.includes("Otro") && (
                      <Input
                        placeholder="Especifica otra causa"
                        value={formData.customTrigger}
                        onChange={(e) => handleInputChange("customTrigger", e.target.value)}
                        className="h-12 text-base border-2 focus:border-primary"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Acciones de Manejo</Label>
                    <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                      {managementActions.map((action) => (
                        <div key={action} className="flex items-center space-x-3">
                          <Checkbox
                            id={`management-${action}`}
                            checked={formData.managementActions.includes(action)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange("managementActions", action, checked as boolean)
                            }
                            className="border-2"
                          />
                          <Label 
                            htmlFor={`management-${action}`} 
                            className="text-sm font-semibold cursor-pointer"
                          >
                            {action}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.managementActions.includes("Otro") && (
                      <Input
                        placeholder="Especifica otra acción"
                        value={formData.customManagement}
                        onChange={(e) => handleInputChange("customManagement", e.target.value)}
                        className="h-12 text-base border-2 focus:border-primary"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="text-xl font-bold">Resumen del Síntoma</CardTitle>
                <CardDescription className="mt-1 text-base">Revisa la información antes de enviar</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <span className="font-semibold text-muted-foreground text-xs block mb-2">Síntoma:</span>
                    <p className="font-bold text-base">{formData.symptom || formData.customSymptom || "No especificado"}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <span className="font-semibold text-muted-foreground text-xs block mb-2">Severidad:</span>
                    <p className="font-bold text-base">{formData.severity || "No especificada"}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <span className="font-semibold text-muted-foreground text-xs block mb-2">Fecha y Hora:</span>
                    <p className="font-bold text-base">
                      {format(formData.date, "dd/MM/yyyy")} {formData.time || "No especificada"}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <span className="font-semibold text-muted-foreground text-xs block mb-2">Duración:</span>
                    <p className="font-bold text-base">{formData.duration || "No especificada"}</p>
                  </div>
                </div>
                {formData.triggers.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <span className="font-semibold text-muted-foreground text-sm block mb-3">Desencadenantes:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.triggers.map((trigger, index) => (
                        <span key={index} className="px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold border-2 border-secondary/20">
                          {trigger === "Otro" ? formData.customTrigger : trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.managementActions.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    <span className="font-semibold text-muted-foreground text-sm block mb-3">Acciones de manejo:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.managementActions.map((action, index) => (
                        <span key={index} className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold border-2 border-accent/20">
                          {action === "Otro" ? formData.customManagement : action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" asChild className="h-12 px-8 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground">
                <Link href="/dashboard/paciente/sintomas">Cancelar</Link>
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Guardar Síntoma
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
