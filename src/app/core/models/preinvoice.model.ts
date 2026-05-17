export interface PreInvoiceItem {
  id: string;
  workLogId: string;
  developerId: string;
  developerName: string;
  developerProfileId: string;
  developerProfileName: string;
  rateType: string;
  rateValue: number;
  billedHours: number;
  billedDays: number;
  grossAmount: number;
  noveltyDiscount: number;
  otherDiscount: number;
  netAmount: number;
  lineDescription: string;
  sortOrder: number;
}

export interface PreInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientBillingEmail: string;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  billingYear: number;
  billingMonth: number;
  periodDescription: string;
  items: PreInvoiceItem[];
  subtotal: number;
  totalNoveltyDiscounts: number;
  totalOtherDiscounts: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  generationDate: string;
  dueDate?: string;
  status: 'DRAFT' | 'GENERATED' | 'SENT_TO_CLIENT' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'INVOICED';
  observations?: string;
  rejectionReason?: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

export interface GeneratePreInvoiceRequest {
  clientId: string;
  currencyId: string;
  billingYear: number;
  billingMonth: number;
  observations?: string;
}

export interface BillingLine {
  workLogId: string;
  developerId: string;
  developerName: string;
  profileName: string;
  rateType: string;
  rateValue: number;
  billedHours: number;
  billedDays: number;
  grossAmount: number;
  noveltyDiscount: number;
  otherDiscount: number;
  netAmount: number;
}

export interface BillingCalculationResult {
  clientId: string;
  billingYear: number;
  billingMonth: number;
  lines: BillingLine[];
  subtotal: number;
  totalNoveltyDiscounts: number;
  totalOtherDiscounts: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}
