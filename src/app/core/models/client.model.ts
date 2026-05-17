export interface Client {
  id: string;
  taxId: string;
  companyName: string;
  tradeName?: string;
  country: string;
  city?: string;
  address?: string;
  billingEmail: string;
  contactName?: string;
  contactPhone?: string;
  primaryCurrencyId: string;
  primaryCurrencyCode: string;
  taxRegime?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateClientRequest {
  taxId: string;
  companyName: string;
  tradeName?: string;
  country: string;
  city?: string;
  address?: string;
  billingEmail: string;
  contactName?: string;
  contactPhone?: string;
  primaryCurrencyId: string;
  taxRegime?: string;
  notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: string;
}
