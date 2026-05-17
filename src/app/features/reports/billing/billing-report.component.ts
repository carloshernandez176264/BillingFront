import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { ClientService } from '@core/services/client.service';
import { BillingCalculationResult } from '@core/models';

interface PeriodSummary {
  billingYear:   number;
  billingMonth:  number;
  clientCount:   number;
  grandTotal:    number;
  clientResults: BillingCalculationResult[];
}

@Component({
  selector: 'app-billing-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectModule],
  template: `
    <div class="bp-page-header">
      <h1>Reportes de Facturación</h1>
    </div>

    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
        <div class="field">
          <label>Year</label>
          <p-select [(ngModel)]="year" [options]="yearOptions" [style]="{'min-width': '120px'}"></p-select>
        </div>
        <div class="field">
          <label>Month</label>
          <p-select [(ngModel)]="month" [options]="monthOptions"
                    optionLabel="label" optionValue="value" [style]="{'min-width': '120px'}"></p-select>
        </div>
        <p-button label="Cargar Reporte" icon="pi pi-search" (click)="load()" [loading]="loading()"/>
      </div>
    </div>

    <ng-container *ngIf="summary()">
      <!-- KPI cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
        <div class="bp-card" style="text-align:center">
          <div style="font-size:.85rem;color:#64748b;margin-bottom:.4rem">Clientes con facturación</div>
          <div style="font-size:2rem;font-weight:700;color:var(--bp-primary)">{{ summary()!.clientCount }}</div>
        </div>
        <div class="bp-card" style="text-align:center">
          <div style="font-size:.85rem;color:#64748b;margin-bottom:.4rem">Total de Líneas</div>
          <div style="font-size:2rem;font-weight:700;color:#0891b2">{{ totalLines() }}</div>
        </div>
        <div class="bp-card" style="text-align:center">
          <div style="font-size:.85rem;color:#64748b;margin-bottom:.4rem">Total General</div>
          <div style="font-size:2rem;font-weight:700;color:#059669">{{ summary()!.grandTotal | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- Per-client table -->
      <div class="bp-card">
        <h3 style="margin:0 0 1rem;color:var(--bp-primary)">Detalle por Cliente</h3>
        <p-table [value]="summary()!.clientResults" dataKey="clientId">
          <ng-template pTemplate="header">
            <tr>
              <th>Cliente</th><th class="text-right">Líneas</th>
              <th class="text-right">Subtotal</th><th class="text-right">Descuentos</th>
              <th class="text-right">IVA</th><th class="text-right">Total</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td>{{ r.clientId }}</td>
              <td class="text-right">{{ r.lines.length }}</td>
              <td class="text-right">{{ r.subtotal | number:'1.2-2' }}</td>
              <td class="text-right" style="color:#dc2626">{{ r.totalNoveltyDiscounts | number:'1.2-2' }}</td>
              <td class="text-right">{{ r.taxAmount | number:'1.2-2' }}</td>
              <td class="text-right"><strong style="color:var(--bp-primary)">{{ r.totalAmount | number:'1.2-2' }}</strong></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b">Sin datos de facturación para este período</td></tr>
          </ng-template>
        </p-table>
      </div>
    </ng-container>

    <div class="bp-card" *ngIf="!summary()">
      <div style="text-align:center;padding:3rem;color:#94a3b8">
        <i class="pi pi-chart-bar" style="font-size:3rem;margin-bottom:1rem;display:block"></i>
        <p>Select a period and click "Cargar Reporte"</p>
      </div>
    </div>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class BillingReportComponent {

  summary = signal<PeriodSummary | null>(null);
  loading = signal(false);

  year  = new Date().getFullYear();
  month = new Date().getMonth() + 1;

  yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },   { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },     { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },{ label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },{ label: 'Diciembre', value: 12 }
  ];

  constructor(private http: HttpClient) {}

  load() {
    this.loading.set(true);
    const params = new HttpParams().set('year', this.year).set('month', this.month);
    this.http.get<PeriodSummary>(`${environment.apiUrl}/reports/billing/period-summary`, { params })
      .subscribe({
        next: r => { this.summary.set(r); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  totalLines() {
    return this.summary()?.clientResults.reduce((acc, r) => acc + r.lines.length, 0) ?? 0;
  }
}
