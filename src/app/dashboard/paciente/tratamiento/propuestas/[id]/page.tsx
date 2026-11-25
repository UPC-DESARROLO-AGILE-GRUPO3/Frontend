import { TreatmentProposalsPage } from "@/components/treatment-proposals"

export default async function PatientTreatmentProposal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TreatmentProposalsPage role="PATIENT" id={Number(id)} />
}
