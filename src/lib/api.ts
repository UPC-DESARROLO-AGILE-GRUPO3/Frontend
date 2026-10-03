// API Configuration and Client for OnControl Backend v2.0
// New Architecture: Organizations → Doctors → Patients

// API Base URL - defaults to production backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-vdtj.onrender.com';

// ============================================
// TYPE DEFINITIONS
// ============================================

// Auth Types
export interface RegisterRequest {
  email: string;
  password: string;
  organizationName: string;
  country: string;
  city: string;
  phone?: string;
  address?: string;
  website?: string;
  licenseNumber?: string;
  taxId?: string;
  description?: string;
  maxDoctors?: number;
  maxPatients?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterOrganizationRequest {
  email: string;
  password: string;
  organizationName: string;
  country: string;
  city: string;
  phone?: string;
  address?: string;
}

// Organization Login Response (from backend AuthController)
export interface OrganizationLoginResponse {
  id: number;
  email: string;
  organizationName: string;
  country: string;
  city: string;
  role: 'ORGANIZATION';
  type: 'ORGANIZATION';
  token: string;
  message: string;
}

// Profile Login Response (Doctor/Patient from backend AuthController)
export interface ProfileLoginResponse {
  profile: DoctorProfileResponse | PatientProfileResponse;
  token?: string; // JWT token for profile authentication
  message: string;
}

export type LoginResponse = OrganizationLoginResponse | ProfileLoginResponse;

// Profile Types
export interface CreateDoctorRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string; // LocalDate in backend
  city?: string;
  address?: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience?: number;
  hospitalAffiliation?: string;
  consultationFee?: string; // BigDecimal in backend, send as string
  bio?: string;
  isAvailable?: boolean;
}

export interface CreatePatientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string; // LocalDate in backend
  city?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicalHistory?: string;
  currentMedications?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  cancerType?: string;
  cancerStage?: string;
  diagnosisDate?: string; // LocalDate in backend
  treatmentStatus?: string;
  lastTreatmentDate?: string; // LocalDate in backend
}

export interface DoctorProfileResponse {
  id: number;
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  city?: string;
  address?: string;
  organizationId: number;
  organizationName?: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience?: number;
  hospitalAffiliation?: string;
  consultationFee?: string; // BigDecimal from backend
  bio?: string;
  isAvailable?: boolean;
  rating?: number;
  totalReviews?: number;
  isActive: boolean;
}

// Simple Patient Response (from backend)
export interface PatientResponse {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string; // LocalDate from backend
  city?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  isActive: boolean;
}

// Full Patient Profile Response (extended)
export interface PatientProfileResponse {
  id: number;
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string; // LocalDate from backend
  city?: string;
  address?: string;
  doctorProfileId: number;
  doctorName?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicalHistory?: string;
  currentMedications?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  cancerType?: string;
  cancerStage?: string;
  diagnosisDate?: string; // LocalDate from backend
  treatmentStatus?: string;
  lastTreatmentDate?: string; // LocalDate from backend
  isActive: boolean;
  status: string;
  activeTreatments: number;
  upcomingAppointments: number;
}

// Appointment Types
export type AppointmentType = 
  | 'PRIMERA_CONSULTA'
  | 'CONSULTA_SEGUIMIENTO'
  | 'REVISION_TRATAMIENTO'
  | 'REVISION_EXAMENES'
  | 'CONSULTA_URGENCIA'
  | 'CONSULTA_POST_OPERATORIA'
  | 'SESION_QUIMIOTERAPIA'
  | 'EXAMENES_LABORATORIO'
  | 'CONSULTA_NUTRICION'
  | 'CONSULTA_PSICOLOGICA'
  | 'CONSULTA_DOLOR'
  | 'CONSULTA_GENERAL'
  | 'OTRO';

export interface CreateAppointmentRequest {
  appointmentDate: string;
  durationMinutes?: number;
  type: AppointmentType;
  location?: string;
  notes?: string;
  preparationInstructions?: string;
  sendReminder?: boolean;
}

export interface AppointmentResponse {
  id: number;
  doctorId: number;
  doctorProfileId?: number; // For backwards compatibility
  doctorName: string;
  patientId: number;
  patientProfileId?: number; // For backwards compatibility
  patientName: string;
  appointmentDate: string;
  durationMinutes: number;
  type: AppointmentType;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  location?: string;
  notes?: string;
  preparationInstructions?: string;
  followUpNotes?: string;
  cancellationReason?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// Symptom Types
export interface CreateSymptomRequest {
  symptomName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  occurrenceDate: string;
  occurrenceTime: string;
  durationHours?: number;
  notes?: string;
  triggers?: string;
  managementActions?: string;
  impactOnDailyLife?: string;
  requiresMedicalAttention?: boolean;
}

export interface SymptomResponse {
  id: number;
  patientProfileId: number;
  symptomName: string;
  severity: string;
  occurrenceDate: string;
  occurrenceTime: string;
  durationHours?: number;
  notes?: string;
  triggers?: string;
  managementActions?: string;
  impactOnDailyLife?: string;
  requiresMedicalAttention: boolean;
  reportedToDoctor: boolean;
}

// ============================================
// TREATMENT TYPES
// ============================================

export type TreatmentType = 
  | 'CHEMOTHERAPY'
  | 'RADIOTHERAPY'
  | 'IMMUNOTHERAPY'
  | 'SURGERY'
  | 'HORMONE_THERAPY'
  | 'TARGETED_THERAPY'
  | 'STEM_CELL_TRANSPLANT';

export interface CreateTreatmentRequest {
  type: TreatmentType;
  protocol: string;
  totalCycles: number;
  startDate: string;
  sessionDurationMinutes?: number;
  location?: string;
  medications?: string[];
  notes?: string;
  preparationInstructions?: string;
}

export interface UpdateTreatmentRequest {
  protocol?: string;
  totalCycles?: number;
  endDate?: string;
  nextSession?: string;
  effectiveness?: number;
  adherence?: number;
  sessionDurationMinutes?: number;
  location?: string;
  medications?: string[];
  sideEffects?: string[];
  notes?: string;
  preparationInstructions?: string;
}

export interface UpdateTreatmentStatusRequest {
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'SUSPENDED';
  reason?: string;
}

export interface TreatmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  patientProfileId: string;
  doctorId: number;
  doctorName: string;
  type: TreatmentType;
  protocol: string;
  currentCycle: number;
  totalCycles: number;
  progressPercentage: number;
  startDate: string;
  endDate?: string;
  nextSession?: string;
  status: string;
  effectiveness?: number;
  adherence?: number;
  sessionDurationMinutes?: number;
  location?: string;
  medications: string[];
  sideEffects: string[];
  notes?: string;
  preparationInstructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  sessionDate: string;
  cycleNumber: number;
  medicationsAdministered?: string[];
  sideEffects?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  notes?: string;
}

export interface TreatmentSessionResponse {
  id: number;
  treatmentId: number;
  sessionNumber: number;
  cycleNumber: number;
  sessionDate: string;
  status: string;
  durationMinutes?: number;
  location?: string;
  medicationsAdministered: string[];
  sideEffects: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vitalSigns?: any;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TreatmentStatsResponse {
  active: number;
  completed: number;
  paused: number;
  suspended: number;
  averageEffectiveness?: number;
  averageAdherence?: number;
  byType: Record<string, number>;
}

// ============================================
// MEDICATION TYPES
// ============================================

export interface CreateMedicationRequest {
  name: string;
  dosage: string;
  frequency: string;
  route: 'ORAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'TOPICAL';
  startDate: string;
  endDate?: string;
  instructions?: string;
  sideEffects?: string[];
}

export interface UpdateMedicationRequest {
  dosage?: string;
  frequency?: string;
  route?: 'ORAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'TOPICAL';
  endDate?: string;
  instructions?: string;
  sideEffects?: string[];
}

export interface MedicationResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  treatmentId?: number;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  status: string;
  instructions?: string;
  sideEffects: string[];
  nextRefillDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingDoseResponse {
  medicationId: number;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  taken: boolean;
}

export interface MarkDoseTakenRequest {
  takenAt: string;
  notes?: string;
}

// ============================================
// MEDICAL HISTORY TYPES
// ============================================

export interface CreateHistoryEntryRequest {
  type: 'DIAGNOSIS' | 'CONSULTATION' | 'TREATMENT' | 'TEST_RESULT' | 'HOSPITALIZATION' | 'SURGERY';
  date: string;
  title: string;
  description?: string;
  doctorName?: string;
  specialty?: string;
  documents?: string[];
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HistoryEntryResponse {
  id: number;
  patientId: number;
  type: string;
  date: string;
  title: string;
  description?: string;
  doctorName?: string;
  specialty?: string;
  documents: string[];
  severity?: string;
  createdAt: string;
}

export interface CreateAllergyRequest {
  allergen: string;
  type: 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  reaction?: string;
  diagnosedDate?: string;
}

export interface AllergyResponse {
  id: number;
  patientId: number;
  allergen: string;
  type: string;
  severity: string;
  reaction?: string;
  diagnosedDate?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// REPORTS TYPES
// ============================================

export interface DoctorReportsResponse {
  patients: {
    total: number;
    active: number;
    followUp: number;
    newConsultations: number;
    monthlyGrowth: number;
    averageSatisfaction: number;
  };
  treatments: {
    active: number;
    completed: number;
    paused: number;
    suspended: number;
    averageEffectiveness: number;
    averageAdherence: number;
  };
  appointments: {
    totalMonth: number;
    completed: number;
    cancelled: number;
    rescheduled: number;
    averageDuration: number;
    averageOccupancy: number;
  };
}

export interface PatientsByMonthResponse {
  data: Array<{
    month: string;
    monthName: string;
    count: number;
  }>;
}

export interface TreatmentsByTypeResponse {
  data: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export interface AppointmentsByDayResponse {
  data: Array<{
    day: string;
    dayName: string;
    count: number;
  }>;
}

// Dashboard Types (NEW - from backend v2.0)
export interface OrganizationDashboardResponse {
  organizationId: number;
  organizationName: string;
  country: string;
  city: string;
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  activePatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  doctors: DoctorProfileResponse[];
  doctorStatistics?: Record<number, DoctorStatistics>;
}

export interface DoctorStatistics {
  doctorId: number;
  doctorName: string;
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  averageRating?: number;
}

export interface DoctorDashboardResponse {
  doctorId: number;
  doctorName: string;
  specialization: string;
  organizationId: number;
  organizationName: string;
  totalPatients: number;
  activePatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalSymptomsReported: number;
  criticalSymptoms: number;
  patients: PatientProfileResponse[];
  upcomingAppointmentsList: AppointmentResponse[];
  recentSymptoms: SymptomResponse[];
  patientStatistics?: Record<number, PatientStatistics>;
}

export interface PatientStatistics {
  patientId: number;
  patientName: string;
  totalAppointments: number;
  upcomingAppointments: number;
  symptomsLastMonth: number;
  criticalSymptoms: number;
  lastAppointmentDate?: string;
  nextAppointmentDate?: string;
}

export interface PatientDashboardResponse {
  patientId: number;
  patientName: string;
  email: string;
  bloodType?: string;
  cancerType?: string;
  cancerStage?: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  organizationName: string;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  upcomingAppointmentsList: AppointmentResponse[];
  nextAppointment?: AppointmentResponse;
  totalSymptoms: number;
  symptomsLastWeek: number;
  symptomsLastMonth: number;
  criticalSymptoms: number;
  recentSymptoms: SymptomResponse[];
  symptomsBySeverity: Record<string, number>;
  treatmentStatus?: string;
  diagnosisDate?: string;
}

// ============================================
// API CLIENT CLASS
// ============================================

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    this.loadTokenFromStorage();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Debug logging (can be disabled in production)
    const DEBUG_API = false; // Set to true to enable verbose logging
    
    if (DEBUG_API) {
      console.log('🔍 API Request:', {
        url,
        method: options.method || 'GET',
        hasToken: !!this.token,
        tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'NO TOKEN',
        headers: config.headers
      });
    }

    try {
      const response = await fetch(url, config);
      
      if (DEBUG_API) {
        console.log('📡 API Response:', {
          url,
          status: response.status,
          ok: response.ok
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Log 404 as info (expected when resource doesn't exist)
        if (response.status === 404) {
          console.log('ℹ️  API 404 - Resource not found:', { url, status: 404 });
        } else {
          // Log other errors as actual errors
          console.error('❌ API Error:', { url, status: response.status, errorData });
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (DEBUG_API) {
        console.log('✅ API Success:', { url, data });
      }
      
      return data;
    } catch (error) {
      // Only log if it's a network error (not an HTTP error already logged)
      if (error instanceof TypeError) {
        console.error('💥 Network error:', { 
          url, 
          error: error.message,
          baseURL: this.baseURL,
          endpoint,
          message: 'No se pudo conectar al servidor. Verifica tu conexión a internet o que el servidor esté disponible.'
        });
        
        // Create a more user-friendly error message
        const networkError = new Error(
          'No se pudo conectar al servidor. Por favor verifica tu conexión a internet y que el servidor esté disponible.'
        ) as Error & { isNetworkError?: boolean; url?: string };
        networkError.isNetworkError = true;
        networkError.url = url;
        throw networkError;
      }
      throw error;
    }
  }

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================

  async registerOrganization(data: RegisterOrganizationRequest): Promise<OrganizationLoginResponse> {
    const response = await this.request<OrganizationLoginResponse>(
      '/api/auth/register/organization',
      {
      method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token for all user types
    // For organizations: response has 'token' and 'type' = 'ORGANIZATION'
    // For profiles: response has 'profile' object and optionally 'token'
    if ('token' in response && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('organizationId');
      localStorage.removeItem('doctorProfileId');
      localStorage.removeItem('patientProfileId');
    }
  }

  // ============================================
  // DASHBOARD ENDPOINTS (NEW)
  // ============================================

  async getOrganizationDashboard(orgId: number, doctorId?: number): Promise<OrganizationDashboardResponse> {
    if (doctorId) {
      return this.request<OrganizationDashboardResponse>(
        `/api/dashboard/organization/${orgId}/filter/doctor/${doctorId}`
      );
    }
    return this.request<OrganizationDashboardResponse>(`/api/dashboard/organization/${orgId}`);
  }

  async getDoctorDashboard(doctorProfileId: number, patientId?: number): Promise<DoctorDashboardResponse> {
    if (patientId) {
      return this.request<DoctorDashboardResponse>(
        `/api/dashboard/doctor/${doctorProfileId}/filter/patient/${patientId}`
      );
    }
    return this.request<DoctorDashboardResponse>(`/api/dashboard/doctor/${doctorProfileId}`);
  }

  async getPatientDashboard(patientProfileId: number): Promise<PatientDashboardResponse> {
    return this.request<PatientDashboardResponse>(`/api/dashboard/patient/${patientProfileId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOrganizationStats(orgId: number): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/api/dashboard/organization/${orgId}/stats`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDoctorStats(doctorProfileId: number): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/api/dashboard/doctor/${doctorProfileId}/stats`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getPatientStats(patientProfileId: number): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/api/dashboard/patient/${patientProfileId}/stats`);
  }

  // ============================================
  // ORGANIZATION ENDPOINTS
  // ============================================

  async getOrganizationDoctors(orgId: number): Promise<DoctorProfileResponse[]> {
    const response = await this.request<{ doctors: DoctorProfileResponse[]; count: number }>(
      `/api/organizations/${orgId}/doctors`
    );
    return response.doctors;
  }

  async getOrganizationDoctor(orgId: number, doctorId: number): Promise<DoctorProfileResponse> {
    return this.request<DoctorProfileResponse>(`/api/organizations/${orgId}/doctors/${doctorId}`);
  }

  async createDoctor(orgId: number, data: CreateDoctorRequest): Promise<DoctorProfileResponse> {
    const response = await this.request<{ doctor: DoctorProfileResponse; message: string }>(
      `/api/organizations/${orgId}/doctors`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.doctor;
  }

  // ============================================
  // DOCTOR ENDPOINTS
  // ============================================

  async getDoctorPatients(doctorProfileId: number): Promise<PatientProfileResponse[]> {
    const response = await this.request<{ patients: PatientProfileResponse[]; count: number }>(
      `/api/doctors/${doctorProfileId}/patients`
    );
    return response.patients;
  }

  async getDoctorPatient(doctorProfileId: number, patientId: number): Promise<PatientProfileResponse> {
    return this.request<PatientProfileResponse>(
      `/api/doctors/${doctorProfileId}/patients/${patientId}`
    );
  }

  async getDoctorPatientSymptoms(doctorProfileId: number, patientId: number): Promise<SymptomResponse[]> {
    const response = await this.request<{ symptoms: SymptomResponse[]; count: number; patientId: number; patientName: string }>(
      `/api/doctors/${doctorProfileId}/patients/${patientId}/symptoms`
    );
    return response.symptoms;
  }

  async createPatient(doctorProfileId: number, data: CreatePatientRequest): Promise<PatientProfileResponse> {
    const response = await this.request<{ patient: PatientProfileResponse; message: string }>(
      `/api/doctors/${doctorProfileId}/patients`,
      {
      method: 'POST',
      body: JSON.stringify(data),
      }
    );
    return response.patient;
  }

  // ============================================
  // APPOINTMENT ENDPOINTS
  // ============================================

  async createAppointment(
    doctorProfileId: number,
    patientProfileId: number,
    data: CreateAppointmentRequest
  ): Promise<AppointmentResponse> {
    const response = await this.request<{ appointment: AppointmentResponse }>(
      `/api/appointments/doctor/${doctorProfileId}/patient/${patientProfileId}`,
      {
      method: 'POST',
      body: JSON.stringify(data),
      }
    );
    return response.appointment;
  }

  async getDoctorAppointments(doctorProfileId: number): Promise<AppointmentResponse[]> {
    const response = await this.request<{ appointments: AppointmentResponse[] }>(
      `/api/appointments/doctor/${doctorProfileId}`
    );
    return response.appointments;
  }

  async getPatientAppointments(patientProfileId: number): Promise<AppointmentResponse[]> {
    const response = await this.request<{ appointments: AppointmentResponse[] }>(
      `/api/appointments/patient/${patientProfileId}`
    );
    return response.appointments;
  }

  async getAppointmentById(id: number): Promise<AppointmentResponse> {
    return this.request<AppointmentResponse>(`/api/appointments/${id}`);
  }

  async updateAppointmentStatus(
    id: number,
    status: AppointmentResponse['status'],
    reason?: string
  ): Promise<AppointmentResponse> {
    const params = new URLSearchParams({ status });
    if (reason) params.append('reason', reason);
    
    const response = await this.request<{ appointment: AppointmentResponse }>(
      `/api/appointments/${id}/status?${params.toString()}`,
      { method: 'PATCH' }
    );
    return response.appointment;
  }

  async addAppointmentFollowUp(id: number, notes: string): Promise<AppointmentResponse> {
    const response = await this.request<{ appointment: AppointmentResponse }>(
      `/api/appointments/${id}/follow-up`,
      {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      }
    );
    return response.appointment;
  }

  // ============================================
  // SYMPTOM ENDPOINTS
  // ============================================

  async createSymptom(patientProfileId: number, data: CreateSymptomRequest): Promise<SymptomResponse> {
    const response = await this.request<{ symptom: SymptomResponse }>(`/api/symptoms/patient/${patientProfileId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.symptom;
  }

  async getPatientSymptoms(patientProfileId: number): Promise<SymptomResponse[]> {
    const response = await this.request<{ symptoms: SymptomResponse[] }>(`/api/symptoms/patient/${patientProfileId}`);
    return response.symptoms;
  }

  async getPatientRecentSymptoms(patientProfileId: number, days: number = 7): Promise<SymptomResponse[]> {
    const response = await this.request<{ symptoms: SymptomResponse[] }>(`/api/symptoms/patient/${patientProfileId}/recent?days=${days}`);
    return response.symptoms;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getPatientSymptomStats(patientProfileId: number): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/api/symptoms/patient/${patientProfileId}/stats`);
  }

  // ============================================
  // TREATMENT ENDPOINTS
  // ============================================

  async createTreatment(
    doctorProfileId: number,
    patientProfileId: number,
    data: CreateTreatmentRequest
  ): Promise<TreatmentResponse> {
    return this.request<TreatmentResponse>(
      `/api/treatments/doctor/${doctorProfileId}/patient/${patientProfileId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getTreatment(treatmentId: number): Promise<TreatmentResponse> {
    return this.request<TreatmentResponse>(`/api/treatments/${treatmentId}`);
  }

  async getDoctorTreatments(doctorProfileId: number): Promise<TreatmentResponse[]> {
    const response = await this.request<{ treatments: TreatmentResponse[]; count: number }>(
      `/api/treatments/doctor/${doctorProfileId}`
    );
    return response.treatments;
  }

  async getPatientTreatments(patientProfileId: number): Promise<TreatmentResponse[]> {
    const response = await this.request<{ treatments: TreatmentResponse[]; count: number }>(
      `/api/treatments/patient/${patientProfileId}`
    );
    return response.treatments;
  }

  async getPatientCurrentTreatment(patientProfileId: number): Promise<TreatmentResponse | null> {
    try {
      return await this.request<TreatmentResponse>(
        `/api/treatments/patient/${patientProfileId}/current`
      );
    } catch {
      return null;
    }
  }

  async updateTreatment(treatmentId: number, data: UpdateTreatmentRequest): Promise<TreatmentResponse> {
    return this.request<TreatmentResponse>(
      `/api/treatments/${treatmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async updateTreatmentStatus(
    treatmentId: number,
    data: UpdateTreatmentStatusRequest
  ): Promise<TreatmentResponse> {
    return this.request<TreatmentResponse>(
      `/api/treatments/${treatmentId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  async createTreatmentSession(
    treatmentId: number,
    data: CreateSessionRequest
  ): Promise<TreatmentSessionResponse> {
    const response = await this.request<{ session: TreatmentSessionResponse }>(
      `/api/treatments/${treatmentId}/sessions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.session;
  }

  async getTreatmentSessions(treatmentId: number): Promise<TreatmentSessionResponse[]> {
    const response = await this.request<{ sessions: TreatmentSessionResponse[]; count: number }>(
      `/api/treatments/${treatmentId}/sessions`
    );
    return response.sessions;
  }

  async getPatientUpcomingSessions(patientProfileId: number): Promise<TreatmentSessionResponse[]> {
    const response = await this.request<{ sessions: TreatmentSessionResponse[]; count: number }>(
      `/api/treatments/patient/${patientProfileId}/sessions/upcoming`
    );
    return response.sessions;
  }

  async getTreatmentStats(doctorProfileId: number): Promise<TreatmentStatsResponse> {
    return this.request<TreatmentStatsResponse>(
      `/api/treatments/doctor/${doctorProfileId}/stats`
    );
  }

  // ============================================
  // MEDICATION ENDPOINTS
  // ============================================

  async createMedication(
    doctorProfileId: number,
    patientProfileId: number,
    data: CreateMedicationRequest
  ): Promise<MedicationResponse> {
    const response = await this.request<{ medication: MedicationResponse }>(
      `/api/medications/doctor/${doctorProfileId}/patient/${patientProfileId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.medication;
  }

  async getMedication(medicationId: number): Promise<MedicationResponse> {
    return this.request<MedicationResponse>(`/api/medications/${medicationId}`);
  }

  async getPatientMedications(patientProfileId: number): Promise<MedicationResponse[]> {
    const response = await this.request<{ medications: MedicationResponse[]; count: number }>(
      `/api/medications/patient/${patientProfileId}`
    );
    return response.medications;
  }

  async getPatientActiveMedications(patientProfileId: number): Promise<MedicationResponse[]> {
    const response = await this.request<{ medications: MedicationResponse[]; count: number }>(
      `/api/medications/patient/${patientProfileId}/active`
    );
    return response.medications;
  }

  async getDoctorMedications(doctorProfileId: number): Promise<MedicationResponse[]> {
    const response = await this.request<{ medications: MedicationResponse[]; count: number }>(
      `/api/medications/doctor/${doctorProfileId}`
    );
    return response.medications;
  }

  async updateMedication(medicationId: number, data: UpdateMedicationRequest): Promise<MedicationResponse> {
    const response = await this.request<{ medication: MedicationResponse }>(
      `/api/medications/${medicationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.medication;
  }

  async discontinueMedication(medicationId: number, reason?: string): Promise<void> {
    await this.request(`/api/medications/${medicationId}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, {
      method: 'DELETE',
    });
  }

  async getUpcomingDoses(patientProfileId: number, days: number = 7): Promise<UpcomingDoseResponse[]> {
    const response = await this.request<{ doses: UpcomingDoseResponse[]; count: number }>(
      `/api/medications/patient/${patientProfileId}/upcoming-doses?days=${days}`
    );
    return response.doses;
  }

  async markDoseTaken(medicationId: number, data: MarkDoseTakenRequest): Promise<void> {
    await this.request(`/api/medications/${medicationId}/mark-taken`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // MEDICAL HISTORY ENDPOINTS
  // ============================================

  async createHistoryEntry(
    patientProfileId: number,
    data: CreateHistoryEntryRequest
  ): Promise<HistoryEntryResponse> {
    const response = await this.request<{ entry: HistoryEntryResponse }>(
      `/api/medical-history/patient/${patientProfileId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.entry;
  }

  async getPatientMedicalHistory(patientProfileId: number): Promise<HistoryEntryResponse[]> {
    const response = await this.request<{ entries: HistoryEntryResponse[]; count: number }>(
      `/api/medical-history/patient/${patientProfileId}`
    );
    return response.entries;
  }

  async getPatientHistoryByType(
    patientProfileId: number,
    type: string
  ): Promise<HistoryEntryResponse[]> {
    const response = await this.request<{ entries: HistoryEntryResponse[]; count: number }>(
      `/api/medical-history/patient/${patientProfileId}/type/${type}`
    );
    return response.entries;
  }

  async getPatientHistoryByDateRange(
    patientProfileId: number,
    startDate: string,
    endDate: string
  ): Promise<HistoryEntryResponse[]> {
    const response = await this.request<{ entries: HistoryEntryResponse[]; count: number }>(
      `/api/medical-history/patient/${patientProfileId}/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    return response.entries;
  }

  async createAllergy(patientProfileId: number, data: CreateAllergyRequest): Promise<AllergyResponse> {
    const response = await this.request<{ allergy: AllergyResponse }>(
      `/api/medical-history/patient/${patientProfileId}/allergies`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.allergy;
  }

  async getPatientAllergies(patientProfileId: number): Promise<AllergyResponse[]> {
    const response = await this.request<{ allergies: AllergyResponse[]; count: number }>(
      `/api/medical-history/patient/${patientProfileId}/allergies`
    );
    return response.allergies;
  }

  async deleteAllergy(allergyId: number): Promise<void> {
    await this.request(`/api/medical-history/allergies/${allergyId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // REPORTS ENDPOINTS
  // ============================================

  async getDoctorReportsOverview(doctorProfileId: number): Promise<DoctorReportsResponse> {
    return this.request<DoctorReportsResponse>(`/api/reports/doctor/${doctorProfileId}/overview`);
  }

  async getPatientsByMonth(doctorProfileId: number, months: number = 6): Promise<PatientsByMonthResponse> {
    return this.request<PatientsByMonthResponse>(
      `/api/reports/doctor/${doctorProfileId}/patients-by-month?months=${months}`
    );
  }

  async getTreatmentsByType(doctorProfileId: number): Promise<TreatmentsByTypeResponse> {
    return this.request<TreatmentsByTypeResponse>(
      `/api/reports/doctor/${doctorProfileId}/treatments-by-type`
    );
  }

  async getAppointmentsByDay(doctorProfileId: number): Promise<AppointmentsByDayResponse> {
    return this.request<AppointmentsByDayResponse>(
      `/api/reports/doctor/${doctorProfileId}/appointments-by-day`
    );
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const apiClient = new ApiClient(API_BASE_URL);

// ============================================
// HELPER FUNCTIONS
// ============================================

export const auth = {
  registerOrganization: (data: RegisterRequest) => apiClient.registerOrganization(data),
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  logout: () => apiClient.logout(),
  isAuthenticated: () => !!apiClient.getToken(),
};

export const dashboard = {
  // Organization dashboards
  getOrganizationDashboard: (orgId: number, doctorId?: number) => 
    apiClient.getOrganizationDashboard(orgId, doctorId),
  getOrganizationStats: (orgId: number) => apiClient.getOrganizationStats(orgId),
  
  // Doctor dashboards
  getDoctorDashboard: (doctorProfileId: number, patientId?: number) => 
    apiClient.getDoctorDashboard(doctorProfileId, patientId),
  getDoctorStats: (doctorProfileId: number) => apiClient.getDoctorStats(doctorProfileId),
  
  // Patient dashboards
  getPatientDashboard: (patientProfileId: number) => apiClient.getPatientDashboard(patientProfileId),
  getPatientStats: (patientProfileId: number) => apiClient.getPatientStats(patientProfileId),
};

export const organizations = {
  getDoctors: (orgId: number) => apiClient.getOrganizationDoctors(orgId),
  getDoctor: (orgId: number, doctorId: number) => apiClient.getOrganizationDoctor(orgId, doctorId),
  createDoctor: (orgId: number, data: CreateDoctorRequest) => apiClient.createDoctor(orgId, data),
};

export const doctors = {
  getPatients: (doctorProfileId: number) => apiClient.getDoctorPatients(doctorProfileId),
  getPatient: (doctorProfileId: number, patientId: number) => 
    apiClient.getDoctorPatient(doctorProfileId, patientId),
  getPatientSymptoms: (doctorProfileId: number, patientId: number) => 
    apiClient.getDoctorPatientSymptoms(doctorProfileId, patientId),
  createPatient: (doctorProfileId: number, data: CreatePatientRequest) => 
    apiClient.createPatient(doctorProfileId, data),
};

export const appointments = {
  create: (doctorProfileId: number, patientProfileId: number, data: CreateAppointmentRequest) =>
    apiClient.createAppointment(doctorProfileId, patientProfileId, data),
  getDoctorAppointments: (doctorProfileId: number) => apiClient.getDoctorAppointments(doctorProfileId),
  getPatientAppointments: (patientProfileId: number) => apiClient.getPatientAppointments(patientProfileId),
  getById: (id: number) => apiClient.getAppointmentById(id),
  updateStatus: (id: number, status: AppointmentResponse['status'], reason?: string) =>
    apiClient.updateAppointmentStatus(id, status, reason),
  addFollowUp: (id: number, notes: string) => apiClient.addAppointmentFollowUp(id, notes),
};

export const symptoms = {
  create: (patientProfileId: number, data: CreateSymptomRequest) =>
    apiClient.createSymptom(patientProfileId, data),
  getAll: (patientProfileId: number) => apiClient.getPatientSymptoms(patientProfileId),
  getRecent: (patientProfileId: number, days?: number) => 
    apiClient.getPatientRecentSymptoms(patientProfileId, days),
  getStats: (patientProfileId: number) => apiClient.getPatientSymptomStats(patientProfileId),
};

export const treatments = {
  create: (doctorProfileId: number, patientProfileId: number, data: CreateTreatmentRequest) =>
    apiClient.createTreatment(doctorProfileId, patientProfileId, data),
  get: (treatmentId: number) => apiClient.getTreatment(treatmentId),
  getDoctorTreatments: (doctorProfileId: number) => apiClient.getDoctorTreatments(doctorProfileId),
  getPatientTreatments: (patientProfileId: number) => apiClient.getPatientTreatments(patientProfileId),
  getPatientCurrent: (patientProfileId: number) => apiClient.getPatientCurrentTreatment(patientProfileId),
  update: (treatmentId: number, data: UpdateTreatmentRequest) =>
    apiClient.updateTreatment(treatmentId, data),
  updateStatus: (treatmentId: number, data: UpdateTreatmentStatusRequest) =>
    apiClient.updateTreatmentStatus(treatmentId, data),
  createSession: (treatmentId: number, data: CreateSessionRequest) =>
    apiClient.createTreatmentSession(treatmentId, data),
  getSessions: (treatmentId: number) => apiClient.getTreatmentSessions(treatmentId),
  getUpcomingSessions: (patientProfileId: number) => apiClient.getPatientUpcomingSessions(patientProfileId),
  getStats: (doctorProfileId: number) => apiClient.getTreatmentStats(doctorProfileId),
};

export const medications = {
  create: (doctorProfileId: number, patientProfileId: number, data: CreateMedicationRequest) =>
    apiClient.createMedication(doctorProfileId, patientProfileId, data),
  get: (medicationId: number) => apiClient.getMedication(medicationId),
  getPatientMedications: (patientProfileId: number) => apiClient.getPatientMedications(patientProfileId),
  getPatientActive: (patientProfileId: number) => apiClient.getPatientActiveMedications(patientProfileId),
  getDoctorMedications: (doctorProfileId: number) => apiClient.getDoctorMedications(doctorProfileId),
  update: (medicationId: number, data: UpdateMedicationRequest) =>
    apiClient.updateMedication(medicationId, data),
  discontinue: (medicationId: number, reason?: string) =>
    apiClient.discontinueMedication(medicationId, reason),
  getUpcomingDoses: (patientProfileId: number, days?: number) =>
    apiClient.getUpcomingDoses(patientProfileId, days),
  markDoseTaken: (medicationId: number, data: MarkDoseTakenRequest) =>
    apiClient.markDoseTaken(medicationId, data),
};

export const medicalHistory = {
  createEntry: (patientProfileId: number, data: CreateHistoryEntryRequest) =>
    apiClient.createHistoryEntry(patientProfileId, data),
  getHistory: (patientProfileId: number) => apiClient.getPatientMedicalHistory(patientProfileId),
  getByType: (patientProfileId: number, type: string) =>
    apiClient.getPatientHistoryByType(patientProfileId, type),
  getByDateRange: (patientProfileId: number, startDate: string, endDate: string) =>
    apiClient.getPatientHistoryByDateRange(patientProfileId, startDate, endDate),
  createAllergy: (patientProfileId: number, data: CreateAllergyRequest) =>
    apiClient.createAllergy(patientProfileId, data),
  getAllergies: (patientProfileId: number) => apiClient.getPatientAllergies(patientProfileId),
  deleteAllergy: (allergyId: number) => apiClient.deleteAllergy(allergyId),
};

export const reports = {
  getDoctorOverview: (doctorProfileId: number) => apiClient.getDoctorReportsOverview(doctorProfileId),
  getPatientsByMonth: (doctorProfileId: number, months?: number) =>
    apiClient.getPatientsByMonth(doctorProfileId, months),
  getTreatmentsByType: (doctorProfileId: number) => apiClient.getTreatmentsByType(doctorProfileId),
  getAppointmentsByDay: (doctorProfileId: number) => apiClient.getAppointmentsByDay(doctorProfileId),
};
