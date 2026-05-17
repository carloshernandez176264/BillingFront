import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { PreInvoice, GeneratePreInvoiceRequest, BillingCalculationResult, PageResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class PreInvoiceService {

  private url     = `${environment.apiUrl}/pre-invoices`;
  private calcUrl = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  findAll(params: { clientId?: string; status?: string; year?: number; month?: number; page?: number; size?: number }) {
    let p = new HttpParams().set('page', params.page ?? 0).set('size', params.size ?? 20);
    if (params.clientId) p = p.set('clientId', params.clientId);
    if (params.status)   p = p.set('status',   params.status);
    if (params.year)     p = p.set('year',     params.year);
    if (params.month)    p = p.set('month',    params.month);
    return this.http.get<PageResponse<PreInvoice>>(this.url, { params: p });
  }

  findById(id: string)                    { return this.http.get<PreInvoice>(`${this.url}/${id}`); }
  generate(req: GeneratePreInvoiceRequest){ return this.http.post<PreInvoice>(`${this.url}/generate`, req); }
  approve(id: string, obs?: string)       { return this.http.post<PreInvoice>(`${this.url}/${id}/approve`, {}, { params: obs ? { observations: obs } : {} }); }
  reject(id: string, reason: string)      { return this.http.post<PreInvoice>(`${this.url}/${id}/reject`, {}, { params: { reason } }); }
  sendToClient(id: string)                { return this.http.post<PreInvoice>(`${this.url}/${id}/send`, {}); }
  cancel(id: string, reason: string)      { return this.http.post<PreInvoice>(`${this.url}/${id}/cancel`, {}, { params: { reason } }); }

  calculate(clientId: string, year: number, month: number) {
    const p = new HttpParams().set('clientId', clientId).set('year', year).set('month', month);
    return this.http.get<BillingCalculationResult>(`${this.calcUrl}/calculate`, { params: p });
  }

  exportPdf(id: string)   { return this.http.get(`${this.url}/${id}/export/pdf`,   { responseType: 'blob' }); }
  exportExcel(id: string) { return this.http.get(`${this.url}/${id}/export/excel`, { responseType: 'blob' }); }
}
