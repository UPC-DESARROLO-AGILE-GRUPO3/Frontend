"use client"

import { useMemo, useState } from 'react';
import { dashboard, doctors } from '@/lib/api';
import type { CreatePatientRequest, PatientProfileResponse, SymptomResponse } from '@/lib/api';
import { readErrorMessage, useReadResource } from './use-read-resource';

const EMPTY_PATIENTS: PatientProfileResponse[] = [];
const EMPTY_SYMPTOMS: SymptomResponse[] = [];

export function useDoctorDashboard(doctorProfileId: number | null, patientIdFilter?: number) {
  const readDashboard = useMemo(() => doctorProfileId
    ? () => dashboard.getDoctorDashboard(doctorProfileId, patientIdFilter)
    : null, [doctorProfileId, patientIdFilter]);
  const { data, isLoading, error, refresh } = useReadResource(readDashboard);

  return { dashboard: data, isLoading, error: readErrorMessage(error, 'Error al cargar dashboard'), refetch: refresh };
}

export function useDoctorPatients(doctorProfileId: number | null) {
  const readPatients = useMemo(() => doctorProfileId
    ? () => doctors.getPatients(doctorProfileId)
    : null, [doctorProfileId]);
  const { data, isLoading, error, refresh } = useReadResource(readPatients);

  return { patients: data ?? EMPTY_PATIENTS, isLoading, error: readErrorMessage(error, 'Error al cargar pacientes'), refetch: refresh };
}

export function useDoctorPatient(doctorProfileId: number | null, patientId: number | null) {
  const readPatient = useMemo(() => doctorProfileId && patientId
    ? () => doctors.getPatient(doctorProfileId, patientId)
    : null, [doctorProfileId, patientId]);
  const { data, isLoading, error, refresh } = useReadResource(readPatient);

  return { patient: data, isLoading, error: readErrorMessage(error, 'Error al cargar paciente'), refetch: refresh };
}

export function useDoctorPatientSymptoms(doctorProfileId: number | null, patientId: number | null) {
  const readSymptoms = useMemo(() => doctorProfileId && patientId
    ? () => doctors.getPatientSymptoms(doctorProfileId, patientId)
    : null, [doctorProfileId, patientId]);
  const { data, isLoading, error, refresh } = useReadResource(readSymptoms);

  return { symptoms: data ?? EMPTY_SYMPTOMS, isLoading, error: readErrorMessage(error, 'Error al cargar síntomas'), refetch: refresh };
}

/**
 * Hook para acciones del doctor (crear pacientes, etc)
 */
export function useDoctorActions(doctorProfileId: number | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPatient = async (data: CreatePatientRequest): Promise<PatientProfileResponse | null> => {
    if (!doctorProfileId) {
      setError('ID de doctor no disponible');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await doctors.createPatient(doctorProfileId, data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear paciente');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPatient,
    isLoading,
    error
  };
}
