import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Currency } from '@core/models';
import { shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrencyService {

  private url = `${environment.apiUrl}/currencies`;
  private cache$ = this.http.get<Currency[]>(this.url).pipe(shareReplay(1));

  constructor(private http: HttpClient) {}

  findAll() { return this.cache$; }

  findById(id: string) { return this.http.get<Currency>(`${this.url}/${id}`); }
}
