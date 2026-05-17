import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Client, CreateClientRequest, UpdateClientRequest, PageResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ClientService {

  private url = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  findAll(params: { search?: string; status?: string; page?: number; size?: number }) {
    let p = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20)
      .set('sort', 'companyName');
    if (params.search) p = p.set('search', params.search);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<PageResponse<Client>>(this.url, { params: p });
  }

  findById(id: string) {
    return this.http.get<Client>(`${this.url}/${id}`);
  }

  create(request: CreateClientRequest) {
    return this.http.post<Client>(this.url, request);
  }

  update(id: string, request: UpdateClientRequest) {
    return this.http.put<Client>(`${this.url}/${id}`, request);
  }

  deactivate(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
