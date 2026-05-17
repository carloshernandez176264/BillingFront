export interface BillingNovelty {
  id: string;
  workLogId: string;
  developerId: string;
  developerName: string;
  clientId: string;
  clientName: string;
  noveltyType: string;
  unitType: 'DAYS' | 'HOURS' | 'BOTH';
  affectedDays: number;
  affectedHours: number;
  startDate?: string;
  endDate?: string;
  calculatedDiscount?: number;
  manualDiscountValue?: number;
  effectiveDiscount?: number;
  billingYear: number;
  billingMonth: number;
  observations?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateNoveltyRequest {
  workLogId: string;
  developerId: string;
  clientId: string;
  noveltyType: string;
  unitType: string;
  affectedDays?: number;
  affectedHours?: number;
  startDate?: string;
  endDate?: string;
  manualDiscountValue?: number;
  billingYear: number;
  billingMonth: number;
  observations?: string;
}
