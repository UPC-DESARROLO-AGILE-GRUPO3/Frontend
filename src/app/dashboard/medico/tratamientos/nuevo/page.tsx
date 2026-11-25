"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, X, Save, CalendarIcon, User, Pill, Activity, CheckCircle, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/auth-context"
import { isDoctorUser } from "@/types/organization"
import { treatments, doctors } from "@/lib/api"
import type { CreateTreatmentRequest, PatientProfileResponse, TreatmentType } from "@/lib/api"

const treatmentTypes: Array<{ value: TreatmentType, label: string }> = [
  { value: 'CHEMOTHERAPY', label: 'Quimioterapia' },
  { value: 'RADIOTHERAPY', label: 'Radioterapia' },
  { value: 'IMMUNOTHERAPY', label: 'Inmunoterapia' },
  { value: 'SURGERY', label: 'Cirugía' },
  { value: 'HORMONE_THERAPY', label: 'Terapia Hormonal' },
  { value: 'TARGETED_THERAPY', label: 'Terapia Dirigida' },
  { value: 'STEM_CELL_TRANSPLANT', label: 'Trasplante de Células Madre' }
]

const commonMedications = [
  "Oxaliplatino", "5-Fluorouracilo", "Leucovorina", "Doxorrubicina", "Ciclofosfamida",
  "Paclitaxel", "Carboplatin", "Pembrolizumab", "Nivolumab", "Trastuzumab",
  "Bevacizumab", "Rituximab", "Docetaxel", "Vinblastina", "Dacarbazina",
  "Vincristina", "Prednisona", "Bleomicina", "Cetuximab", "Ipilimumab"
]

const protocolos = {
  CHEMOTHERAPY: [
    "FOLFOX - Oxaliplatino + 5-FU + Leucovorina",
    "AC-T - Doxorrubicina + Ciclofosfamida + Paclitaxel",
    "TCH - Docetaxel + Carboplatin + Trastuzumab",
    "ABVD - Doxorrubicina + Bleomicina + Vinblastina + Dacarbazina",
    "R-CHOP - Rituximab + Ciclofosfamida + Doxorrubicina + Vincristina + Prednisona",
    "FOLFIRINOX - 5-FU + Leucovorina + Irinotecan + Oxaliplatino",
    "CMF - Ciclofosfamida + Metotrexato + 5-FU",
    "Cisplatino + Gemcitabina"
  ],
  RADIOTHERAPY: [
    "IMRT - Radioterapia de Intensidad Modulada",
    "3D-CRT - Radioterapia Conformada 3D",
    "SBRT - Radioterapia Estereotáctica",
    "VMAT - Terapia de Arco Volumétrico Modulado",
    "Braquiterapia",
    "Radioterapia Conformacional"
  ],
  IMMUNOTHERAPY: [
    "Pembrolizumab - Inhibidor PD-1",
    "Nivolumab - Inhibidor PD-1",
    "Atezolizumab - Inhibidor PD-L1",
    "Ipilimumab - Inhibidor CTLA-4",
    "Durvalumab - Inhibidor PD-L1"
  ],
  SURGERY: [
    "Resección Quirúrgica",
    "Cirugía Laparoscópica",
    "Cirugía Robótica",
    "Mastectomía",
    "Lumpectomía",
    "Colectomía",
    "Prostatectomía"
  ],
  HORMONE_THERAPY: [
    "Tamoxifeno",
    "Letrozol",
    "Anastrozol",
    "Exemestano",
    "Fulvestrant",
    "Goserelina"
  ],
  TARGETED_THERAPY: [
    "Trastuzumab - Anti-HER2",
    "Bevacizumab - Anti-VEGF",
    "Rituximab - Anti-CD20",
    "Cetuximab - Anti-EGFR",
    "Imatinib - Inhibidor de Tirosina Quinasa"
  ],
  STEM_CELL_TRANSPLANT: [
    "Trasplante Autólogo",
    "Trasplante Alogénico",
    "Trasplante de Sangre de Cordón"
  ]
}

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
  "Quirófano 1 - Piso 4",
  "Quirófano 2 - Piso 4"
]

export default function NuevoTratamientoPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const doctorProfileId = user && isDoctorUser(user) ? user.profile.id : null
  const [patients, setPatients] = useState<PatientProfileResponse[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  
  const [formData, setFormData] = useState({
    patientProfileId: "" as string | number,
    type: "" as TreatmentType | "",
    protocol: "",
    totalCycles: "",
    startDate: undefined as Date | undefined,
    sessionDurationMinutes: "",
    location: "",
    medications: [] as string[],
    notes: "",
    preparationInstructions: ""
  })
  
  const [customMedication, setCustomMedication] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

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

  const handleInputChange = (field: string, value: string | Date | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const addMedication = (medication: string) => {
    if (medication && !formData.medications.includes(medication)) {
      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, medication]
      }))
    }
  }

  const removeMedication = (medication: string) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m !== medication)
    }))
  }

  const handleAddCustomMedication = () => {
    if (customMedication.trim()) {
      addMedication(customMedication.trim())
      setCustomMedication("")
    }
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

    // Validaciones
    if (!formData.patientProfileId || formData.patientProfileId === "" || !formData.type || !formData.protocol || !formData.totalCycles || !formData.startDate) {
      setError("Por favor completa todos los campos obligatorios")
      setIsLoading(false)
      return
    }

    try {
      const treatmentData: CreateTreatmentRequest = {
        type: formData.type as TreatmentType,
        protocol: formData.protocol,
        totalCycles: parseInt(formData.totalCycles),
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        sessionDurationMinutes: formData.sessionDurationMinutes ? parseInt(formData.sessionDurationMinutes) : undefined,
        location: formData.location || undefined,
        medications: formData.medications.length > 0 ? formData.medications : undefined,
        notes: formData.notes || undefined,
        preparationInstructions: formData.preparationInstructions || undefined
      }

      const patientId = typeof formData.patientProfileId === 'string' 
        ? parseInt(formData.patientProfileId) 
        : formData.patientProfileId;
      
      await treatments.create(doctorProfileId, patientId, treatmentData)
      setSuccess(true)

      setTimeout(() => {
        router.push("/dashboard/medico/tratamientos")
      }, 2000)
    } catch (err) {
      console.error('Error creating treatment:', err)
      setError(err instanceof Error ? err.message : "Error al crear el tratamiento")
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
                  ¡Tratamiento creado exitosamente!
                </h2>
                <p className="text-muted-foreground mb-8 text-lg font-medium">
                  El tratamiento ha sido registrado y está disponible para el paciente.
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-6 text-lg font-semibold shadow-lg hover:shadow-xl">
                    <Link href="/dashboard/medico/tratamientos">Ver Tratamientos</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full h-12 px-6 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground">
                    <Link href="/dashboard/medico/tratamientos/nuevo">Crear Otro Tratamiento</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  const selectedPatient: PatientProfileResponse | undefined = patients.find(p => 
    p.id === (typeof formData.patientProfileId === 'string' ? parseInt(formData.patientProfileId) : formData.patientProfileId)
  )

  return (
    <AuthGuard requiredRole="DOCTOR">
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
              <Link href="/dashboard/medico/tratamientos">
              <Button variant="outline" className="mb-4 border-2 hover:bg-primary hover:text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a tratamientos
              </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Nuevo Tratamiento
                </h1>
                <p className="text-muted-foreground text-lg">Registra un nuevo tratamiento oncológico para un paciente</p>
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
                    Selección de Paciente
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">Elige el paciente que recibirá el tratamiento</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
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
                            {patient.firstName} {patient.lastName} - {patient.cancerType || "Sin diagnóstico"}
                          </SelectItem>
                        ))
                      )}
                      </SelectContent>
                    </Select>
                  </div>

                {selectedPatient && (
                  <div className="p-5 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border-2 border-accent/20">
                    <h4 className="font-bold text-lg mb-2">{selectedPatient.firstName} {selectedPatient.lastName}</h4>
                    <p className="text-sm text-muted-foreground font-semibold mb-1">
                      {selectedPatient.cancerType} {selectedPatient.cancerStage && `- ${selectedPatient.cancerStage}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">ID: {selectedPatient.profileId}</p>
                  </div>
                )}
                </CardContent>
              </Card>

            {/* Treatment Details */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Activity className="h-5 w-5 text-secondary" />
                    </div>
                    Detalles del Tratamiento
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">Información básica del protocolo de tratamiento</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-base font-semibold">
                      Tipo de Tratamiento <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange("type", value as TreatmentType)}
                    >
                      <SelectTrigger id="type" className="h-12 text-base border-2">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protocol" className="text-base font-semibold">
                      Protocolo <span className="text-destructive">*</span>
                    </Label>
                    {formData.type && protocolos[formData.type as TreatmentType] ? (
                      <Select
                        value={formData.protocol}
                        onValueChange={(value) => handleInputChange("protocol", value)}
                      >
                        <SelectTrigger id="protocol" className="h-12 text-base border-2">
                          <SelectValue placeholder="Selecciona un protocolo" />
                        </SelectTrigger>
                        <SelectContent>
                          {protocolos[formData.type as TreatmentType].map((protocolo) => (
                            <SelectItem key={protocolo} value={protocolo}>
                              {protocolo}
                            </SelectItem>
                          ))}
                          <SelectItem value="otro">Otro (personalizado)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="protocol"
                        placeholder="Primero selecciona un tipo de tratamiento"
                        value={formData.protocol}
                        onChange={(e) => handleInputChange("protocol", e.target.value)}
                        disabled={!formData.type}
                        className="h-12 text-base border-2 focus:border-primary"
                      />
                    )}
                    {formData.protocol === "otro" && (
                      <Input
                        placeholder="Especifica el protocolo personalizado"
                        value={formData.protocol === "otro" ? "" : formData.protocol}
                        onChange={(e) => handleInputChange("protocol", e.target.value)}
                        className="mt-2 h-12 text-base border-2 focus:border-primary"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="totalCycles" className="text-base font-semibold">
                      Ciclos Totales <span className="text-destructive">*</span>
                    </Label>
                      <Input
                      id="totalCycles"
                        type="number"
                        min="1"
                        placeholder="Ej: 6"
                      value={formData.totalCycles}
                      onChange={(e) => handleInputChange("totalCycles", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Fecha de Inicio <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-12 text-base border-2 hover:bg-primary hover:text-primary-foreground"
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {formData.startDate ? format(formData.startDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 dynamic-island rounded-xl border-border/50" align="start">
                        <Calendar 
                          mode="single" 
                          selected={formData.startDate}
                          onSelect={(date) => handleInputChange("startDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionDuration" className="text-base font-semibold">Duración de Sesión (minutos)</Label>
                    <Input
                      id="sessionDuration"
                      type="number"
                      min="15"
                      placeholder="Ej: 120"
                      value={formData.sessionDurationMinutes}
                      onChange={(e) => handleInputChange("sessionDurationMinutes", e.target.value)}
                      className="h-12 text-base border-2 focus:border-primary"
                    />
                  </div>

                    <div className="space-y-2">
                    <Label htmlFor="location" className="text-base font-semibold">Ubicación / Consultorio</Label>
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
                    </div>
                </CardContent>
              </Card>

            {/* Medications */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    Medicamentos
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">Medicamentos incluidos en el protocolo</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex gap-3">
                  <Select
                    value=""
                    onValueChange={(value) => addMedication(value)}
                  >
                      <SelectTrigger className="flex-1 h-12 text-base border-2">
                      <SelectValue placeholder="Selecciona un medicamento" />
                      </SelectTrigger>
                      <SelectContent>
                      {commonMedications.map((med) => (
                        <SelectItem key={med} value={med}>
                          {med}
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
                        handleAddCustomMedication()
                      }
                    }}
                    className="h-12 text-base border-2 focus:border-primary flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomMedication}
                    className="h-12 px-4 border-2 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                {formData.medications.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-xl border-2 border-border/50">
                    {formData.medications.map((med, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold border-2 border-primary/20"
                      >
                        <span>{med}</span>
                            <button
                              type="button"
                          onClick={() => removeMedication(med)}
                          className="hover:text-destructive rounded-full p-0.5 hover:bg-primary/20"
                            >
                          <X className="h-4 w-4" />
                            </button>
                      </div>
                    ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            {/* Additional Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  Información Adicional
                </CardTitle>
                <CardDescription className="mt-1 text-base">Notas e instrucciones para el tratamiento</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-semibold">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones generales sobre el tratamiento..."
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
                    placeholder="Indicaciones para el paciente antes de cada sesión..."
                    value={formData.preparationInstructions}
                    onChange={(e) => handleInputChange("preparationInstructions", e.target.value)}
                    rows={4}
                    className="text-base border-2 focus:border-primary min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" asChild className="h-12 px-8 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground">
                <Link href="/dashboard/medico/tratamientos">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50">
                <Save className="mr-2 h-5 w-5" />
                {isLoading ? "Creando..." : "Crear Tratamiento"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
