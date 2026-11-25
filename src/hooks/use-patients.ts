"use client"

import { useMemo } from 'react';
import { dashboard } from '@/lib/api';
import { readErrorMessage, useReadResource } from './use-read-resource';

export function usePatientDashboard(patientProfileId: number | null) {
  const readDashboard = useMemo(() => patientProfileId
    ? () => dashboard.getPatientDashboard(patientProfileId)
    : null, [patientProfileId]);
  const { data, isLoading, error, refresh } = useReadResource(readDashboard);

  return { dashboard: data, isLoading, error: readErrorMessage(error, 'Error al cargar dashboard'), refetch: refresh };
}
