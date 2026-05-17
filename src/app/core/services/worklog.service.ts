import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { WorkLog, CreateWorkLogRequest, PageResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class WorkLogService {

  private url = `${environment.apiUrl}/work-logs`;

  constructor(private http: HttpClient) {}

  findAll(params: { clientId?: string; developerId?: string; year?: number; month?: number; page?: number; size?: number }) {
    let p = new HttpParams().set('page', params.page ?? 0).set('size', params.size ?? 20);
    if (params.clientId)    p = p.set('clientId',    params.clientId);
    if (params.developerId) p = p.set('developerId', params.developerId);
    if (params.year)        p = p.set('year',        params.year);
    if (params.month)       p = p.set('month',       params.month);
    return this.http.get<PageResponse<WorkLog>>(this.url, { params: p });
  }

  findById(id: string)                     { return this.http.get<WorkLog>(`${this.url}/${id}`); }
  create(req: CreateWorkLogRequest)        { return this.http.post<WorkLog>(this.url, req); }
  confirm(id: string)                      { return this.http.post<WorkLog>(`${this.url}/${id}/confirm`, {}); }
  deactivate(id: string)                   { return this.http.delete<void>(`${this.url}/${id}`); }
}
