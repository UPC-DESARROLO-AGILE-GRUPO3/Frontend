"use client"

import { useMemo, useState } from 'react';
import { dashboard, organizations } from '@/lib/api';
import type {
  DoctorProfileResponse,
  CreateDoctorRequest
} from '@/lib/api';
import { readErrorMessage, useReadResource } from './use-read-resource';

// Tipo temporal para organizaciones (debe coincidir con el tipo del backend)
export interface Organization {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  totalDoctors?: number;
  createdAt: string;
}

const EMPTY_DOCTORS: DoctorProfileResponse[] = [];

export function useOrganizationDashboard(organizationId: number | null, doctorIdFilter?: number) {
  const readDashboard = useMemo(() => organizationId
    ? () => dashboard.getOrganizationDashboard(organizationId, doctorIdFilter)
    : null, [organizationId, doctorIdFilter]);
  const { data, isLoading, error, refresh } = useReadResource(readDashboard);

  return { dashboard: data, isLoading, error: readErrorMessage(error, 'Error al cargar dashboard'), refetch: refresh };
}

export function useOrganizationDoctors(organizationId: number | null) {
  const readDoctors = useMemo(() => organizationId
    ? () => organizations.getDoctors(organizationId)
    : null, [organizationId]);
  const { data, isLoading, error, refresh } = useReadResource(readDoctors);

  return { doctors: data ?? EMPTY_DOCTORS, isLoading, error: readErrorMessage(error, 'Error al cargar doctores'), refetch: refresh };
}

export function useOrganizationDoctor(organizationId: number | null, doctorId: number | null) {
  const readDoctor = useMemo(() => organizationId && doctorId
    ? () => organizations.getDoctor(organizationId, doctorId)
    : null, [organizationId, doctorId]);
  const { data, isLoading, error, refresh } = useReadResource(readDoctor);

  return { doctor: data, isLoading, error: readErrorMessage(error, 'Error al cargar doctor'), refetch: refresh };
}

/**
 * Hook para acciones de organización (crear doctores, crear organizaciones, etc)
 */
export function useOrganizationActions(organizationId: number | null = null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDoctor = async (data: CreateDoctorRequest): Promise<DoctorProfileResponse | null> => {
    if (!organizationId) {
      setError('ID de organización no disponible');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await organizations.createDoctor(organizationId, data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear doctor');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createOrganization = async (_data: Partial<Organization>): Promise<Organization | null> => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: Implementar endpoint en el backend para crear organizaciones
      // const result = await apiClient.createOrganization(_data);
      // return result;
      
      console.warn('createOrganization: Endpoint no implementado en el backend');
      setError('Funcionalidad no implementada');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear organización');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDoctor,
    createOrganization,
    isLoading,
    error
  };
}
