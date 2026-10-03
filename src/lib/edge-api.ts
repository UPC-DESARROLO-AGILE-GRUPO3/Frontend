// Edge Service API Client
// Handles communication with the Python/Flask EdgeService.


const EDGE_API_URL = process.env.NEXT_PUBLIC_EDGE_API_URL || 'https://edgeservice.onrender.com';


type RawEdgeHealthRecord = {
  id?: number;
  device_id?: string;
  timestamp?: string;
  created_at?: string;
  bpm?: number | string;
  spo2?: number | string;
  temp?: number | string;
  temperature?: number | string;
  patient_id?: number;
  is_critical?: boolean;
  riskScore?: number | string;
  riskLevel?: string;
  reasons?: string[];
  aiExplanation?: string;
};

export interface EdgeHealthRecord {
  id?: number;
  device_id: string;
  timestamp: string;
  created_at: string;
  bpm: number;
  spo2: number;
  temp: number;
  temperature: number;
  patient_id?: number;
  is_critical: boolean;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | string;
  reasons: string[];
  aiExplanation: string;
}

export type LatestHealthParameters = EdgeHealthRecord;

export interface ClaimDeviceRequest {
  device_id: string;
}

export interface ClaimDeviceResponse {
  message: string;
  device_id: string;
  status: string;
  ownership_id?: number;
}

export class EdgeApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EdgeApiError';
    this.status = status;
  }
}

class EdgeApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private normalizeHealthRecord(record: RawEdgeHealthRecord): EdgeHealthRecord {
    const createdAt = record.created_at ?? record.timestamp ?? '';
    const temp = Number(record.temp ?? record.temperature ?? 0);

    return {
      id: record.id,
      device_id: record.device_id ?? '',
      timestamp: createdAt,
      created_at: createdAt,
      bpm: Number(record.bpm ?? 0),
      spo2: Number(record.spo2 ?? 0),
      temp,
      temperature: temp,
      patient_id: record.patient_id,
      is_critical: Boolean(record.is_critical),
      riskScore: Number(record.riskScore ?? 0),
      riskLevel: record.riskLevel ?? 'LOW',
      reasons: Array.isArray(record.reasons) ? record.reasons : [],
      aiExplanation: record.aiExplanation ?? '',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Edge API Error:', { url, status: response.status, errorData });
        throw new EdgeApiError(
          errorData.error || errorData.message || `Edge Service Error: ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof EdgeApiError) {
        throw error;
      }

      console.error('Edge Network Error:', error);
      throw new EdgeApiError('No se pudo conectar con EdgeService', 0);
    }
  }

  // ============================================
  // DEVICE MANAGEMENT
  // ============================================

  async claimDevice(deviceId: string): Promise<ClaimDeviceResponse> {
    return this.request<ClaimDeviceResponse>('/devices/claim', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
    });
  }

  // ============================================
  // VITALS MONITORING
  // ============================================

  async getLatestVitals(): Promise<EdgeHealthRecord> {
    const record = await this.request<RawEdgeHealthRecord>('/OnControl/parameters/latest');
    return this.normalizeHealthRecord(record);
  }

  async getLatestHealthParameters(): Promise<LatestHealthParameters> {
    const record = await this.request<RawEdgeHealthRecord>('/OnControl/parameters/latest-demo');
    return this.normalizeHealthRecord(record);
  }

  async getAllRecords(): Promise<EdgeHealthRecord[]> {
    const records = await this.request<RawEdgeHealthRecord[]>('/OnControl/parameters');
    return records.map((record) => this.normalizeHealthRecord(record));
  }
}

export const edgeApi = new EdgeApiClient(EDGE_API_URL);
export const getLatestHealthParameters = () => edgeApi.getLatestHealthParameters();
