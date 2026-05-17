export interface DeveloperProfile {
  id: string;
  name: string;
  level?: string;
  description?: string;
  baseSkills?: string;
  baseMonthlyRate?: number;
  active: boolean;
}

export interface Developer {
  id: string;
  documentId: string;
  documentType: string;
  fullName: string;
  email?: string;
  profileId: string;
  profileName: string;
  hireDate: string;
  assignmentMode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  active: boolean;
  createdAt: string;
}

export interface CreateDeveloperRequest {
  documentId: string;
  documentType: string;
  fullName: string;
  email?: string;
  profileId: string;
  hireDate: string;
  assignmentMode?: string;
}
