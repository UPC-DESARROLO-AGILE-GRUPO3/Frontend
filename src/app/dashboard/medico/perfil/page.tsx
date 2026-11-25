"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard-updated"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loading } from "@/components/loading"
import { useAuthContext } from "@/contexts/auth-context"
import type { DoctorProfileResponse } from "@/lib/api"
import { isDoctorUser } from "@/types/organization"
import { 
  User, 
  Mail, 
  GraduationCap, 
  Award, 
  Settings,
  Save,
  Edit,
  Briefcase
} from "lucide-react"

export default function MedicoPerfilPage() {
  const { user, isLoading } = useAuthContext()
  const [draft, setDoctorData] = useState<DoctorProfileResponse | null>(null)
  const savedProfile = user && isDoctorUser(user) ? user.profile as DoctorProfileResponse : null
  const doctorData = draft?.id === savedProfile?.id ? draft : savedProfile
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSave = async () => {
    if (!doctorData || !user || !isDoctorUser(user)) return

    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      // TODO: Implement profile update endpoint
      // const updatedProfile = await doctors.updateProfile(user.profile.id, {
      //   specialty: doctorData.specialty,
      //   licenseNumber: doctorData.licenseNumber,
      //   phone: doctorData.phone,
      //   bio: doctorData.bio || undefined,
      //   officeAddress: doctorData.officeAddress || undefined
      // })
      
      // setDoctorData(updatedProfile)
      setError("La actualización de perfil aún no está implementada en el backend")
      setDoctorData(null)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <Loading message="Cargando perfil..." />
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!doctorData) {
    return (
      <AuthGuard requiredRole="DOCTOR">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No se pudo cargar el perfil</p>
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
                Mi Perfil
              </h1>
              <p className="text-muted-foreground text-lg">Gestiona tu información profesional</p>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => {
                if (isEditing) {
                  setSuccess("")
                  setError("")
                  setDoctorData(null)
                }
                setIsEditing(!isEditing)
              }}
              className={isEditing ? "border-2 hover:bg-muted hover:border-muted-foreground h-11 px-6" : "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-11 px-6 shadow-lg hover:shadow-xl"}
            >
              {isEditing ? (
                <>Cancelar</>
              ) : (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Editar Perfil
                </>
              )}
            </Button>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-2 border-primary/30 bg-primary/10">
              <AlertDescription className="text-primary font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header Card */}
          <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-lg">
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/30 to-secondary/30 text-primary">
                    {doctorData.firstName.charAt(0)}{doctorData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">
                    Dr. {doctorData.firstName} {doctorData.lastName}
                  </h2>
                  <p className="text-xl text-muted-foreground font-semibold">{doctorData.specialization}</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    ID: {doctorData.profileId}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    {doctorData.organizationName && (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground font-semibold px-4 py-2 bg-muted/50 rounded-xl border-2 border-border/50">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {doctorData.organizationName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  Información Personal
                </CardTitle>
                <CardDescription className="mt-1 text-base">Información básica de identificación</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-semibold">Nombre</Label>
                  <Input
                    id="firstName"
                    value={doctorData.firstName}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base font-semibold">Apellido</Label>
                  <Input
                    id="lastName"
                    value={doctorData.lastName}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={doctorData.email}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-semibold">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={doctorData.phone}
                    onChange={(e) => setDoctorData({ ...doctorData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <GraduationCap className="w-5 h-5 text-secondary" />
                  </div>
                  Información Profesional
                </CardTitle>
                <CardDescription className="mt-1 text-base">Credenciales y especialización</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-base font-semibold">Especialidad</Label>
                  <Input
                    id="specialty"
                    value={doctorData.specialization}
                    onChange={(e) => setDoctorData({ ...doctorData, specialization: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Número de Colegiatura
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={doctorData.licenseNumber}
                    onChange={(e) => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 text-base border-2 focus:border-primary"
                  />
                </div>

                {doctorData.organizationName && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Organización</Label>
                    <Input
                      value={doctorData.organizationName}
                      disabled={true}
                      className="h-12 text-base border-2 bg-muted/50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-semibold">Disponibilidad</Label>
                  <Input
                    id="status"
                    value={doctorData.isAvailable ? 'Disponible' : 'No disponible'}
                    disabled={true}
                    className="h-12 text-base border-2 bg-muted/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Biography */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-background">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Settings className="w-5 h-5 text-accent" />
                </div>
                Biografía Profesional
              </CardTitle>
              <CardDescription className="mt-1 text-base">Información adicional sobre tu práctica médica</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-semibold">Biografía</Label>
                <Textarea
                  id="bio"
                  value={doctorData.bio || ""}
                  onChange={(e) => setDoctorData({ ...doctorData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={6}
                  placeholder="Describe tu experiencia, especialización y enfoque médico..."
                  className="text-base border-2 focus:border-primary min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeAddress" className="text-base font-semibold">Dirección del Consultorio</Label>
                <Textarea
                  id="officeAddress"
                  value={doctorData.address || ""}
                  onChange={(e) => setDoctorData({ ...doctorData, address: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Dirección completa de tu consultorio..."
                  className="text-base border-2 focus:border-primary min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics - TODO: Add when statistics endpoint is implemented */}
          {/* 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Estadísticas
              </CardTitle>
              <CardDescription>Tu actividad en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Pacientes Activos</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Tratamientos Administrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          */}

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setError("")
                  setSuccess("")
                }}
                disabled={isSaving}
                className="h-12 px-8 text-lg font-semibold border-2 hover:bg-muted hover:border-muted-foreground"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity h-12 px-8 text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50">
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
