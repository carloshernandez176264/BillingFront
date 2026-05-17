import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Rate, CreateRateRequest, PageResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class RateService {

  private url = `${environment.apiUrl}/rates`;

  constructor(private http: HttpClient) {}

  findAll(params: { clientId?: string; profileId?: string; status?: string; page?: number; size?: number }) {
    let p = new HttpParams().set('page', params.page ?? 0).set('size', params.size ?? 20);
    if (params.clientId)  p = p.set('clientId',  params.clientId);
    if (params.profileId) p = p.set('profileId', params.profileId);
    if (params.status)    p = p.set('status',    params.status);
    return this.http.get<PageResponse<Rate>>(this.url, { params: p });
  }

  findById(id: string) { return this.http.get<Rate>(`${this.url}/${id}`); }

  create(req: CreateRateRequest) { return this.http.post<Rate>(this.url, req); }

  deactivate(id: string) { return this.http.delete<void>(`${this.url}/${id}`); }
}
