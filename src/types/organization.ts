// ========================================
// NUEVA ARQUITECTURA: Organizations → Doctors → Patients
// Backend v2.0 - OnControl
// ========================================

// ============================================
// ORGANIZATION TYPES (Users table)
// ============================================

export interface Organization {
  id: number;
  email: string;
  organizationName: string;
  country: string;
  city: string;
  phone?: string;
  address?: string;
  website?: string;
  licenseNumber?: string;
  taxId?: string;
  description?: string;
  role: 'ORGANIZATION';
  isActive: boolean;
  isEmailVerified: boolean;
  maxDoctors: number;
  maxPatients: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// DOCTOR PROFILE TYPES (Profiles + DoctorProfiles tables)
// ============================================

export interface DoctorProfile {
  id: number;
  accountProfileId?: number;
  profileId: string; // DOC-{timestamp}
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
  consultationFee?: number;
  bio?: string;
  isAvailable?: boolean;
  rating?: number;
  totalReviews?: number;
  isActive: boolean;
}

// ============================================
// PATIENT PROFILE TYPES (Profiles + PatientProfiles tables)
// ============================================

export interface PatientProfile {
  id: number;
  accountProfileId?: number;
  doctorAccountProfileId?: number;
  profileId: string; // PAT-{timestamp}
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
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
  diagnosisDate?: string;
  treatmentStatus?: string;
  lastTreatmentDate?: string;
  isActive: boolean;
}

export interface PatientRegistrationFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
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
  diagnosisDate?: string;
  treatmentStatus?: string;
  lastTreatmentDate?: string;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export interface Appointment {
  id: number;
  doctorProfileId: number;
  doctorName: string;
  patientProfileId: number;
  patientName: string;
  appointmentDate: string;
  durationMinutes: number;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECKUP' | 'EMERGENCY' | 'PROCEDURE';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  location?: string;
  notes?: string;
  preparationInstructions?: string;
  followUpNotes?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentFormData {
  appointmentDate: string;
  durationMinutes?: number;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECKUP' | 'EMERGENCY' | 'PROCEDURE';
  location?: string;
  notes?: string;
  preparationInstructions?: string;
  sendReminder?: boolean;
}

// ============================================
// SYMPTOM TYPES
// ============================================

export interface Symptom {
  id: number;
  patientProfileId: number;
  symptomName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  occurrenceDate: string;
  occurrenceTime: string;
  durationHours?: number;
  notes?: string;
  triggers?: string;
  managementActions?: string;
  impactOnDailyLife?: string;
  requiresMedicalAttention: boolean;
  reportedToDoctor: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSymptomFormData {
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

// ============================================
// CHANGE DOCTOR REQUEST TYPES
// ============================================

export interface ChangeDoctorRequest {
  id: number;
  patientId: number;
  patientName?: string;
  currentDoctorId: number;
  currentDoctorName?: string;
  requestedDoctorId: number;
  requestedDoctorName?: string;
  reason: string;
  patientNotes?: string;
  status: 'PENDING' | 'APPROVED_BY_CURRENT_DOCTOR' | 'APPROVED_BY_REQUESTED_DOCTOR' | 'APPROVED_BY_ADMIN' | 'REJECTED_BY_CURRENT_DOCTOR' | 'REJECTED_BY_REQUESTED_DOCTOR' | 'REJECTED_BY_ADMIN' | 'CANCELLED_BY_PATIENT' | 'COMPLETED';
  currentDoctorResponse?: string;
  requestedDoctorResponse?: string;
  adminNotes?: string;
  isActive: boolean;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
}

export interface ChangeDoctorRequestFormData {
  requestedDoctorId: number;
  reason: string;
  patientNotes?: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface OrganizationDashboard {
  organization: {
    id: number;
    name: string;
    email: string;
  };
  totalDoctors: number;
  totalPatients: number;
  doctors: DoctorProfile[];
}

export interface DoctorDashboard {
  doctor: DoctorProfile;
  totalPatients: number;
  upcomingAppointments: number;
  todayAppointments: number;
  recentPatients: PatientProfile[];
  upcomingAppointmentsList: Appointment[];
}

export interface PatientDashboard {
  patient: PatientProfile;
  upcomingAppointments: Appointment[];
  recentSymptoms: Symptom[];
  symptomStats: {
    totalSymptoms: number;
    severeSymptoms: number;
    period: string;
  };
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface OrganizationStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activeRequests: number;
  averageRating?: number;
}

export interface DoctorStats {
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  todayAppointments: number;
  pendingRequests: number;
  averageRating?: number;
  monthlyRevenue?: number;
}

export interface PatientStats {
  assignedDoctor: string;
  totalAppointments: number;
  upcomingAppointments: number;
  pendingRequests: number;
  nextAppointment?: string;
  recentSymptoms: number;
}

// ============================================
// FILTER TYPES
// ============================================

export interface OrganizationFilters {
  search?: string;
  isActive?: boolean;
  country?: string;
  sortBy?: 'organizationName' | 'createdAt' | 'totalDoctors';
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorFilters {
  organizationId?: number;
  specialization?: string;
  isAvailable?: boolean;
  minRating?: number;
  search?: string;
  sortBy?: 'firstName' | 'rating' | 'totalPatients';
  sortOrder?: 'asc' | 'desc';
}

export interface PatientFilters {
  doctorProfileId?: number;
  cancerType?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: 'firstName' | 'createdAt' | 'diagnosisDate';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// USER TYPES (for Auth Context)
// ============================================

export type UserRole = 'ORGANIZATION' | 'DOCTOR' | 'PATIENT';

export interface OrganizationUser extends Organization {
  type: 'ORGANIZATION';
  token: string;
}

export interface DoctorUser {
  type: 'DOCTOR';
  profile: DoctorProfile;
  token?: string;
}

export interface PatientUser {
  type: 'PATIENT';
  profile: PatientProfile;
  token?: string;
}

export type User = OrganizationUser | DoctorUser | PatientUser;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isOrganizationUser(user: User): user is OrganizationUser {
  return user.type === 'ORGANIZATION';
}

export function isDoctorUser(user: User): user is DoctorUser {
  return user.type === 'DOCTOR';
}

export function isPatientUser(user: User): user is PatientUser {
  return user.type === 'PATIENT';
}

export function getUserDisplayName(user: User): string {
  if (isOrganizationUser(user)) {
    return user.organizationName;
  } else if (isDoctorUser(user)) {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  } else {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  }
}

export function getUserId(user: User): number {
  if (isOrganizationUser(user)) {
    return user.id;
  } else if (isDoctorUser(user)) {
    return user.profile.id;
  } else {
    return user.profile.id;
  }
}
