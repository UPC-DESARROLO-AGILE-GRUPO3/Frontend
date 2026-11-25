import { useMemo, useState } from 'react';
import { edgeApi, type EdgeHealthRecord, type ClaimDeviceResponse, EdgeApiError } from '@/lib/edge-api';
import { readErrorMessage, useReadResource } from './use-read-resource';

interface UseEdgeDeviceReturn {
  claimDevice: (deviceId: string) => Promise<ClaimDeviceResponse>;
  isLoading: boolean;
  error: { message: string; status?: number } | null;
}

/**
 * Hook for managing device ownership (Claiming)
 */
export function useEdgeDevice(): UseEdgeDeviceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  const claimDevice = async (deviceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await edgeApi.claimDevice(deviceId);
      return response;
    } catch (err) {
      if (err instanceof EdgeApiError) {
        setError({ message: err.message, status: err.status });
      } else {
        setError({ message: err instanceof Error ? err.message : 'Failed to claim device' });
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { claimDevice, isLoading, error };
}

const EMPTY_HISTORY: EdgeHealthRecord[] = [];
const readLatestVitals = () => edgeApi.getLatestVitals();

function vitalsError(error: unknown, fallback: string) {
  if (error instanceof EdgeApiError) return { message: error.message, status: error.status };
  const message = readErrorMessage(error, fallback);
  return message ? { message } : null;
}

export function usePatientVitals(enabled = true) {
  const { data, isLoading, error, refresh } = useReadResource(enabled ? readLatestVitals : null);
  return {
    data,
    isLoading,
    error: vitalsError(error, 'No pudimos cargar los signos vitales.'),
    refresh,
  };
}

export function usePatientHistory(patientDeviceId?: string) {
  const readHistory = useMemo(() => {
    if (!patientDeviceId) return null;

    return async () => {
      const records = await edgeApi.getAllRecords();
      return records
        .filter(record => record.device_id === patientDeviceId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };
  }, [patientDeviceId]);
  const { data, isLoading, error, refresh } = useReadResource(readHistory);

  return {
    history: data ?? EMPTY_HISTORY,
    isLoading,
    error: vitalsError(error, 'No pudimos cargar el historial de signos vitales.'),
    refresh,
  };
}
