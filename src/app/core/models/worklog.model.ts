export interface WorkLog {
  id: string;
  clientId: string;
  clientName: string;
  developerId: string;
  developerName: string;
  developerProfileId: string;
  developerProfileName: string;
  appliedRateId?: string;
  appliedRateType?: string;
  billingYear: number;
  billingMonth: number;
  expectedWorkingDays: number;
  expectedWorkingHours: number;
  actualWorkedHours: number;
  billableAmount?: number;
  observations?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'BILLED';
  createdAt: string;
  createdBy: string;
}

export interface CreateWorkLogRequest {
  clientId: string;
  developerId: string;
  developerProfileId: string;
  billingYear: number;
  billingMonth: number;
  expectedWorkingDays: number;
  expectedWorkingHours: number;
  actualWorkedHours: number;
  observations?: string;
}
