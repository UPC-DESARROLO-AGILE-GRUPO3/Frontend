import { AppointmentDetailsPage } from "@/components/appointment-details"

export default async function PatientAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AppointmentDetailsPage id={id} role="PATIENT" />
}
