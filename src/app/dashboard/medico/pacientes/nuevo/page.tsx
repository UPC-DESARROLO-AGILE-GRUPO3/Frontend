"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  UserPlus,
  Eye,
  EyeOff,
  Activity,
  Plus,
  X
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/auth-context"
import { useDoctorActions } from "@/hooks/use-doctors"
import { isDoctorUser } from "@/types/organization"
import type { CreatePatientRequest } from "@/lib/api"

const tiposSangre = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const tiposCancer = [
  "Cáncer de mama",
  "Cáncer de próstata",
  "Cáncer de pulmón",
  "Cáncer colorrectal",
  "Cáncer de piel (melanoma)",
  "Cáncer de tiroides",
  "Cáncer de riñón",
  "Cáncer de páncreas",
  "Cáncer de hígado",
  "Cáncer de estómago",
  "Cáncer de vejiga",
  "Cáncer de ovario",
  "Cáncer de útero",
  "Cáncer de esófago",
  "Leucemia",
  "Linfoma Hodgkin",
  "Linfoma no Hodgkin",
  "Mieloma múltiple",
  "Sarcoma",
  "Cáncer de cerebro",
  "Otro"
]

const etapasCancer = [
  "Estadio 0 (in situ)",
  "Estadio I",
  "Estadio II",
  "Estadio III",
  "Estadio IV",
  "Desconocido"
]

const estadosTratamiento = [
  "Recién diagnosticado",
  "En tratamiento activo",
  "En seguimiento",
  "En remisión",
  "Tratamiento completado",
  "Cuidados paliativos",
  "Desconocido"
]

const alergiasComunes = [
  "Penicilina",
  "Amoxicilina",
  "Cefalosporinas",
  "Sulfonamidas",
  "Aspirina",
  "Ibuprofeno",
  "Paracetamol",
  "Contraste yodado",
  "Látex",
  "Mariscos",
  "Nueces",
  "Huevo",
  "Soja",
  "Polen",
  "Ácaros del polvo"
]

const medicamentosComunes = [
  "Paracetamol",
  "Ibuprofeno",
  "Omeprazol",
  "Metformina",
  "Losartán",
  "Atorvastatina",
  "Enalapril",
  "Levotiroxina",
  "Amoxicilina",
  "Aspirina",
  "Diclofenaco",
  "Ranitidina",
  "Metronidazol",
  "Prednisona",
  "Tramadol"
]

const relacionesEmergencia = [
  "Esposo/a",
  "Hijo/a",
  "Padre",
  "Madre",
  "Hermano/a",
  "Abuelo/a",
  "Nieto/a",
  "Tío/a",
  "Sobrino/a",
  "Primo/a",
  "Pareja",
  "Amigo/a cercano",
  "Vecino/a",
  "Cuidador/a",
  "Otro"
]

export default function NuevoPacientePage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null
  const { createPatient, isLoading, error: actionError } = useDoctorActions(doctorProfileId)

  const [showPassword, setShowPassword] = useState(false)
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [selectedMedications, setSelectedMedications] = useState<string[]>([])
  const [customAllergy, setCustomAllergy] = useState("")
  const [customMedication, setCustomMedication] = useState("")
  
  const [formData, setFormData] = useState<CreatePatientRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    city: "",
    address: "",
    bloodType: "",
    allergies: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    medicalHistory: "",
    currentMedications: "",
    insuranceProvider: "",
    insuranceNumber: "",
    cancerType: "",
    cancerStage: "",
    diagnosisDate: "",
    treatmentStatus: "",
    lastTreatmentDate: "",
  })
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: keyof CreatePatientRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validaciones básicas
    if (!formData.firstName || !formData.lastName) {
      setError("Nombre y apellido son requeridos")
      return
    }

    if (!formData.email) {
      setError("El email es requerido")
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    // Preparar datos con alergias y medicamentos concatenados
    const patientData = {
      ...formData,
      allergies: selectedAllergies.length > 0 ? selectedAllergies.join(", ") : formData.allergies,
      currentMedications: selectedMedications.length > 0 ? selectedMedications.join(", ") : formData.currentMedications,
    }

    try {
      const result = await createPatient(patientData)
      
      if (result) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard/medico/pacientes")
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el paciente")
    }
  }

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-5xl space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/dashboard/medico/pacientes">
              <Button variant="outline" className="mb-4 border-2 hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a pacientes
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Registrar Nuevo Paciente
              </h1>
              <p className="text-muted-foreground text-lg">Complete la información del paciente</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}
            
            {actionError && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription className="font-semibold">{actionError}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-primary/10 border-2 border-primary/30">
                <AlertDescription className="text-primary-foreground flex items-center gap-2 font-semibold">
                  <Activity className="h-5 w-5" />
                  Paciente creado exitosamente. Redirigiendo...
                </AlertDescription>
              </Alert>
            )}

            {/* Información Personal */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  Información Personal
                </CardTitle>
                <CardDescription className="mt-1 text-base">Datos básicos del paciente</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-base font-semibold">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-base font-semibold">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="paciente@example.com"
                    className="h-12 text-base border-2 focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-semibold">Contraseña Inicial *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-12 h-12 text-base border-2 focus:border-primary"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    El paciente podrá cambiar esta contraseña después
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-semibold">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-base font-semibold">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base font-semibold">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodType" className="text-base font-semibold">Tipo de Sangre</Label>
                    <Select 
                      value={formData.bloodType} 
                      onValueChange={(value) => handleInputChange("bloodType", value)}
                    >
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposSangre.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base font-semibold">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información Médica */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Activity className="h-6 w-6 text-secondary" />
                  </div>
                  Información Médica
                </CardTitle>
                <CardDescription className="mt-1 text-base">Diagnóstico y tratamiento</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cancerType" className="text-base font-semibold">Tipo de Cáncer</Label>
                    <Select
                      value={formData.cancerType}
                      onValueChange={(value) => handleInputChange("cancerType", value)}
                    >
                      <SelectTrigger id="cancerType" className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona el tipo de cáncer" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposCancer.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancerStage" className="text-base font-semibold">Etapa</Label>
                    <Select
                      value={formData.cancerStage}
                      onValueChange={(value) => handleInputChange("cancerStage", value)}
                    >
                      <SelectTrigger id="cancerStage" className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona la etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {etapasCancer.map((etapa) => (
                          <SelectItem key={etapa} value={etapa}>
                            {etapa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosisDate" className="text-base font-semibold">Fecha de Diagnóstico</Label>
                    <Input
                      id="diagnosisDate"
                      type="date"
                      value={formData.diagnosisDate}
                      onChange={(e) => handleInputChange("diagnosisDate", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatmentStatus" className="text-base font-semibold">Estado del Tratamiento</Label>
                    <Select
                      value={formData.treatmentStatus}
                      onValueChange={(value) => handleInputChange("treatmentStatus", value)}
                    >
                      <SelectTrigger id="treatmentStatus" className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosTratamiento.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Alergias</Label>
                  <div className="flex gap-3">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!selectedAllergies.includes(value)) {
                          setSelectedAllergies([...selectedAllergies, value])
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 text-base border-2 flex-1">
                        <SelectValue placeholder="Selecciona alergia" />
                      </SelectTrigger>
                      <SelectContent>
                        {alergiasComunes.map((alergia) => (
                          <SelectItem key={alergia} value={alergia}>
                            {alergia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="O escribe una alergia personalizada"
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (customAllergy && !selectedAllergies.includes(customAllergy)) {
                            setSelectedAllergies([...selectedAllergies, customAllergy])
                            setCustomAllergy("")
                          }
                        }
                      }}
                      className="h-12 text-base border-2 focus:border-primary flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (customAllergy && !selectedAllergies.includes(customAllergy)) {
                          setSelectedAllergies([...selectedAllergies, customAllergy])
                          setCustomAllergy("")
                        }
                      }}
                      className="h-12 px-4 border-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                      {selectedAllergies.map((allergy, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-semibold border-2 border-destructive/20"
                        >
                          <span>{allergy}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedAllergies(selectedAllergies.filter((_, i) => i !== index))}
                            className="hover:text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Medicamentos Actuales</Label>
                  <div className="flex gap-3">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (!selectedMedications.includes(value)) {
                          setSelectedMedications([...selectedMedications, value])
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 text-base border-2 flex-1">
                        <SelectValue placeholder="Selecciona medicamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicamentosComunes.map((medicamento) => (
                          <SelectItem key={medicamento} value={medicamento}>
                            {medicamento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="O escribe un medicamento personalizado"
                      value={customMedication}
                      onChange={(e) => setCustomMedication(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (customMedication && !selectedMedications.includes(customMedication)) {
                            setSelectedMedications([...selectedMedications, customMedication])
                            setCustomMedication("")
                          }
                        }
                      }}
                      className="h-12 text-base border-2 focus:border-primary flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (customMedication && !selectedMedications.includes(customMedication)) {
                          setSelectedMedications([...selectedMedications, customMedication])
                          setCustomMedication("")
                        }
                      }}
                      className="h-12 px-4 border-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {selectedMedications.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                      {selectedMedications.map((medication, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold border-2 border-primary/20"
                        >
                          <span>{medication}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedMedications(selectedMedications.filter((_, i) => i !== index))}
                            className="hover:text-primary-foreground rounded-full p-0.5 hover:bg-primary/20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory" className="text-base font-semibold">Historial Médico</Label>
                  <Textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    placeholder="Describa el historial médico relevante..."
                    rows={4}
                    className="text-base border-2 focus:border-primary min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contacto de Emergencia */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <UserPlus className="h-6 w-6 text-accent" />
                  </div>
                  Contacto de Emergencia
                </CardTitle>
                <CardDescription className="mt-1 text-base">Persona a contactar en caso de emergencia</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName" className="text-base font-semibold">Nombre Completo</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone" className="text-base font-semibold">Teléfono</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelationship" className="text-base font-semibold">Relación</Label>
                    <Select
                      value={formData.emergencyContactRelationship}
                      onValueChange={(value) => handleInputChange("emergencyContactRelationship", value)}
                    >
                      <SelectTrigger id="emergencyContactRelationship" className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona la relación" />
                      </SelectTrigger>
                      <SelectContent>
                        {relacionesEmergencia.map((relacion) => (
                          <SelectItem key={relacion} value={relacion}>
                            {relacion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Seguro */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <UserPlus className="h-6 w-6 text-secondary" />
                  </div>
                  Información de Seguro (Opcional)
                </CardTitle>
                <CardDescription className="mt-1 text-base">Datos del seguro médico</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceProvider" className="text-base font-semibold">Proveedor de Seguro</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceNumber" className="text-base font-semibold">Número de Póliza</Label>
                    <Input
                      id="insuranceNumber"
                      value={formData.insuranceNumber}
                      onChange={(e) => handleInputChange("insuranceNumber", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  "Registrando..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Registrar Paciente
                  </>
                )}
              </Button>
              <Link href="/dashboard/medico/pacientes">
                <Button type="button" variant="outline" className="h-12 px-8 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
