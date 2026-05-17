export interface Rate {
  id: string;
  clientId?: string;
  clientName?: string;
  developerProfileId: string;
  developerProfileName: string;
  currencyId: string;
  currencyCode: string;
  rateType: 'MONTHLY' | 'DAILY' | 'HOURLY';
  monthlyRate?: number;
  dailyRate?: number;
  hourlyRate?: number;
  validFrom: string;
  validUntil?: string;
  includesTax: boolean;
  taxPercentage?: number;
  discountPercentage: number;
  workingHoursPerDay: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  commercialNotes?: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateRateRequest {
  clientId?: string;
  developerProfileId: string;
  currencyId: string;
  rateType: string;
  monthlyRate?: number;
  dailyRate?: number;
  hourlyRate?: number;
  validFrom: string;
  validUntil?: string;
  includesTax: boolean;
  taxPercentage?: number;
  discountPercentage?: number;
  workingHoursPerDay?: number;
  commercialNotes?: string;
}
