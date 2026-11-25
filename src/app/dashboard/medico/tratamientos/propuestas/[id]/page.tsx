import { TreatmentProposalsPage } from "@/components/treatment-proposals"

export default async function DoctorTreatmentProposal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TreatmentProposalsPage role="DOCTOR" id={Number(id)} />
}
