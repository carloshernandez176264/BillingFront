import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { Developer, DeveloperProfile, CreateDeveloperRequest, PageResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class DeveloperService {

  private url        = `${environment.apiUrl}/developers`;
  private profileUrl = `${environment.apiUrl}/developer-profiles`;

  constructor(private http: HttpClient) {}

  findAll(params: { search?: string; status?: string; profileId?: string; page?: number; size?: number }) {
    let p = new HttpParams().set('page', params.page ?? 0).set('size', params.size ?? 20);
    if (params.search)    p = p.set('search',    params.search);
    if (params.status)    p = p.set('status',    params.status);
    if (params.profileId) p = p.set('profileId', params.profileId);
    return this.http.get<PageResponse<Developer>>(this.url, { params: p });
  }

  findById(id: string)  { return this.http.get<Developer>(`${this.url}/${id}`); }

  create(req: CreateDeveloperRequest) { return this.http.post<Developer>(this.url, req); }

  update(id: string, req: CreateDeveloperRequest) { return this.http.put<Developer>(`${this.url}/${id}`, req); }

  deactivate(id: string) { return this.http.delete<void>(`${this.url}/${id}`); }

  // Profiles
  findAllProfiles() { return this.http.get<DeveloperProfile[]>(this.profileUrl); }
}
