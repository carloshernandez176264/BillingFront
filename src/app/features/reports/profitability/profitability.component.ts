import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { environment } from '@env/environment';
import { ClientService } from '@core/services/client.service';

interface ProfitabilityLine {
  developerId: string;
  developerName: string;
  profileName: string;
  clientId: string;
  clientName: string;
  baseSalary: number;
  socialCharges: number;
  totalCost: number;
  prima: number;
  cesantias: number;
  interesesCesantias: number;
  vacaciones: number;
  saludEmpleador: number;
  pensionEmpleador: number;
  arl: number;
  cajaCompensacion: number;
  icbf: number;
  sena: number;
  clientRate: number;
  baseRate: number;
  discountAmount: number;
  discountPct: number;
  margin: number;
  marginPct: number;
}

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule,
            SelectModule, TagModule, DialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Rentabilidad</h1>
      <div style="display:flex;gap:.75rem">
        <p-button label="Por Cliente" icon="pi pi-building"
                  severity="secondary" (click)="mode='client'"
                  [outlined]="mode !== 'client'"/>
        <p-button label="Todos" icon="pi pi-users"
                  severity="secondary" (click)="loadAll()"
                  [outlined]="mode !== 'all'"/>
      </div>
    </div>

    <!-- Filtro cliente -->
    @if (mode === 'client') {
      <div class="bp-card mb-3">
        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
          <div style="flex:1;min-width:250px">
            <label style="font-weight:600;font-size:.875rem;display:block;margin-bottom:.4rem">
              Cliente
            </label>
            <p-select [(ngModel)]="selectedClientId"
                      [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el cliente"
                      class="w-full">
            </p-select>
          </div>
          <p-button label="Calcular Rentabilidad" icon="pi pi-calculator"
                    [loading]="loading()"
                    [disabled]="!selectedClientId || loading()"
                    (click)="loadByClient()"/>
        </div>
      </div>
    }

    <!-- KPIs resumen -->
    @if (data().length > 0) {
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">

        <div class="bp-card" style="text-align:center">
          <div style="font-size:.8rem;color:#64748b;margin-bottom:.4rem">
            Total Ingreso Mensual
          </div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--bp-primary)">
            {{ totalIngreso() | number:'1.0-0' }}
          </div>
          <div style="font-size:.75rem;color:#64748b">COP</div>
        </div>

        <div class="bp-card" style="text-align:center">
          <div style="font-size:.8rem;color:#64748b;margin-bottom:.4rem">
            Total Costo Mensual
          </div>
          <div style="font-size:1.6rem;font-weight:800;color:#dc2626">
            {{ totalCosto() | number:'1.0-0' }}
          </div>
          <div style="font-size:.75rem;color:#64748b">COP</div>
        </div>

        <div class="bp-card" style="text-align:center">
          <div style="font-size:.8rem;color:#64748b;margin-bottom:.4rem">
            Margen Total
          </div>
          <div [style.color]="totalMargen() >= 0 ? '#059669' : '#dc2626'"
               style="font-size:1.6rem;font-weight:800">
            {{ totalMargen() | number:'1.0-0' }}
          </div>
          <div style="font-size:.75rem;color:#64748b">COP</div>
        </div>

        <div class="bp-card" style="text-align:center">
          <div style="font-size:.8rem;color:#64748b;margin-bottom:.4rem">
            Rentabilidad Promedio
          </div>
          <div [style.color]="marginColor(avgMarginPct())"
               style="font-size:1.6rem;font-weight:800">
            {{ avgMarginPct() | number:'1.1-1' }}%
          </div>
          <div style="font-size:.75rem;color:#64748b">sobre ingreso</div>
        </div>

      </div>

      <!-- Tarjetas por desarrollador -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
                  gap:1rem;margin-bottom:1.5rem">
        @for (line of data(); track line.developerId + line.clientId) {
          <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;
                      box-shadow:0 1px 4px rgba(0,0,0,.06)">

            <!-- Header -->
            <div [style.background]="marginBg(line.marginPct)"
                 style="padding:.85rem 1rem;color:#fff;
                        display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700">{{ line.developerName }}</div>
                <div style="font-size:.78rem;opacity:.85">
                  {{ line.profileName }} — {{ line.clientName }}
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.72rem;opacity:.8">Rentabilidad</div>
                <div style="font-size:1.4rem;font-weight:800">
                  {{ line.marginPct | number:'1.1-1' }}%
                </div>
              </div>
            </div>

            <!-- Body -->
            <div style="padding:1rem">

              <!-- Fila ingreso vs costo -->
              <div style="display:grid;grid-template-columns:1fr 1fr;
                           gap:.75rem;margin-bottom:.75rem">
                <div style="background:#f0fdf4;border-radius:8px;padding:.6rem;text-align:center">
                  <div style="font-size:.7rem;color:#166534;font-weight:600">INGRESO</div>
                  <div style="font-size:1rem;font-weight:700;color:#166534">
                    {{ line.clientRate | number:'1.0-0' }}
                  </div>
                </div>
                <div style="background:#fef2f2;border-radius:8px;padding:.6rem;text-align:center">
                  <div style="font-size:.7rem;color:#991b1b;font-weight:600">COSTO TOTAL</div>
                  <div style="font-size:1rem;font-weight:700;color:#991b1b">
                    {{ line.totalCost | number:'1.0-0' }}
                  </div>
                </div>
              </div>

              <!-- Margen -->
              <div style="background:#f8fafc;border-radius:8px;padding:.6rem;
                           margin-bottom:.75rem;display:flex;
                           justify-content:space-between;align-items:center">
                <span style="font-size:.8rem;font-weight:600">Margen mensual</span>
                <strong [style.color]="marginColor(line.marginPct)" style="font-size:1rem">
                  {{ line.margin | number:'1.0-0' }}
                </strong>
              </div>

              <!-- Barra de rentabilidad -->
              <div style="margin-bottom:.75rem">
                <div style="display:flex;justify-content:space-between;
                             font-size:.72rem;color:#64748b;margin-bottom:.25rem">
                  <span>Rentabilidad</span>
                  <span>{{ line.marginPct | number:'1.1-1' }}%</span>
                </div>
                <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                  <div [style.width]="clamp(line.marginPct) + '%'"
                       [style.background]="marginBg(line.marginPct)"
                       style="height:100%;border-radius:4px;transition:width .5s">
                  </div>
                </div>
              </div>

              <!-- Descuento vs tarifa base -->
              <div style="font-size:.78rem;color:#64748b;
                           border-top:1px solid #e2e8f0;padding-top:.6rem;
                           display:flex;justify-content:space-between">
                <span>Descuento vs tarifa base</span>
                <span style="font-weight:600;color:#d97706">
                  {{ line.discountPct | number:'1.1-1' }}%
                  (-{{ line.discountAmount | number:'1.0-0' }})
                </span>
              </div>

              <!-- Ver detalle -->
              <p-button label="Ver desglose de cargas" icon="pi pi-list"
                        severity="secondary" size="small" styleClass="w-full"
                        [style]="{'margin-top': '.75rem', 'display': 'block'}"
                        (click)="openDetail(line)"/>
            </div>
          </div>
        }
      </div>

      <!-- Tabla resumen -->
      <div class="bp-card">
        <h3 style="margin:0 0 1rem;color:var(--bp-primary)">
          Resumen Comparativo
        </h3>
        <p-table [value]="data()" dataKey="developerId" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Desarrollador</th>
              <th>Perfil</th>
              <th>Cliente</th>
              <th class="text-right">Salario</th>
              <th class="text-right">Cargas (51.83%)</th>
              <th class="text-right">Costo Total</th>
              <th class="text-right">Tarifa Base</th>
              <th class="text-right">Tarifa Cliente</th>
              <th class="text-right">Descuento</th>
              <th class="text-right">Margen</th>
              <th class="text-right">Rentab. %</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td><strong>{{ l.developerName }}</strong></td>
              <td>{{ l.profileName }}</td>
              <td>{{ l.clientName }}</td>
              <td class="text-right">{{ l.baseSalary | number:'1.0-0' }}</td>
              <td class="text-right" style="color:#dc2626">
                {{ l.socialCharges | number:'1.0-0' }}
              </td>
              <td class="text-right" style="color:#dc2626;font-weight:700">
                {{ l.totalCost | number:'1.0-0' }}
              </td>
              <td class="text-right">{{ l.baseRate | number:'1.0-0' }}</td>
              <td class="text-right" style="color:var(--bp-primary);font-weight:700">
                {{ l.clientRate | number:'1.0-0' }}
              </td>
              <td class="text-right" style="color:#d97706">
                {{ l.discountPct | number:'1.1-1' }}%
              </td>
              <td class="text-right" [style.color]="marginColor(l.marginPct)">
                {{ l.margin | number:'1.0-0' }}
              </td>
              <td class="text-right">
                <span [style.background]="marginBg(l.marginPct)"
                      style="color:#fff;padding:.2rem .6rem;border-radius:12px;
                             font-size:.78rem;font-weight:700">
                  {{ l.marginPct | number:'1.1-1' }}%
                </span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr style="font-weight:700;background:#f8fafc">
              <td colspan="3">TOTAL</td>
              <td class="text-right">{{ totalSalario() | number:'1.0-0' }}</td>
              <td class="text-right" style="color:#dc2626">
                {{ totalCargas() | number:'1.0-0' }}
              </td>
              <td class="text-right" style="color:#dc2626">
                {{ totalCosto() | number:'1.0-0' }}
              </td>
              <td colspan="2" class="text-right" style="color:var(--bp-primary)">
                {{ totalIngreso() | number:'1.0-0' }}
              </td>
              <td></td>
              <td class="text-right" [style.color]="marginColor(avgMarginPct())">
                {{ totalMargen() | number:'1.0-0' }}
              </td>
              <td class="text-right">
                <span [style.background]="marginBg(avgMarginPct())"
                      style="color:#fff;padding:.2rem .6rem;border-radius:12px;
                             font-size:.78rem;font-weight:700">
                  {{ avgMarginPct() | number:'1.1-1' }}%
                </span>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    @if (data().length === 0 && !loading()) {
      <div class="bp-card" style="text-align:center;padding:3rem;color:#94a3b8">
        <i class="pi pi-chart-pie" style="font-size:3rem;margin-bottom:1rem;display:block"></i>
        <p style="font-size:1rem;font-weight:600">Módulo de Rentabilidad</p>
        <p style="font-size:.875rem">
          Selecciona un cliente y haz clic en "Calcular Rentabilidad"<br>
          para ver el análisis de márgenes y cargas prestacionales
        </p>
        <p style="font-size:.78rem;margin-top:.5rem;color:#cbd5e1">
          Los desarrolladores deben tener su salario base registrado
        </p>
      </div>
    }

    <!-- Dialog desglose cargas -->
    <p-dialog [(visible)]="showDetail" [header]="'Desglose — ' + selectedLine()?.developerName"
              [modal]="true" [style]="{width:'520px'}">
      @if (selectedLine()) {
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">

          <div style="grid-column:1/-1;background:#f0fdf4;border-radius:8px;
                       padding:.75rem;margin-bottom:.5rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
              <span style="font-weight:600">Salario Base</span>
              <strong>{{ selectedLine()!.baseSalary | number:'1.0-0' }}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;color:#64748b;font-size:.85rem">
              <span>Total Cargas (51.83%)</span>
              <span style="color:#dc2626">{{ selectedLine()!.socialCharges | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;
                         border-top:1px solid #bbf7d0;margin-top:.5rem;padding-top:.5rem;
                         font-weight:700">
              <span>Costo Total Mensual</span>
              <strong style="color:#dc2626">{{ selectedLine()!.totalCost | number:'1.0-0' }}</strong>
            </div>
          </div>

          @for (item of chargesDetail(selectedLine()!); track item.label) {
            <div style="display:flex;justify-content:space-between;align-items:center;
                         padding:.4rem .6rem;background:#f8fafc;border-radius:6px;
                         font-size:.82rem">
              <span style="color:#475569">{{ item.label }}</span>
              <div style="text-align:right">
                <div style="font-weight:600;color:#dc2626">
                  {{ item.value | number:'1.0-0' }}
                </div>
                <div style="font-size:.7rem;color:#94a3b8">{{ item.pct }}</div>
              </div>
            </div>
          }

          <div style="grid-column:1/-1;background:#eff6ff;border-radius:8px;
                       padding:.75rem;margin-top:.5rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:.3rem">
              <span style="font-weight:600">Tarifa Cobrada al Cliente</span>
              <strong style="color:var(--bp-primary)">
                {{ selectedLine()!.clientRate | number:'1.0-0' }}
              </strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:.3rem;
                         font-size:.85rem;color:#64748b">
              <span>Tarifa Base (lista)</span>
              <span>{{ selectedLine()!.baseRate | number:'1.0-0' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;color:#d97706">
              <span>Descuento al cliente</span>
              <span>{{ selectedLine()!.discountPct | number:'1.1-1' }}%
                    (-{{ selectedLine()!.discountAmount | number:'1.0-0' }})</span>
            </div>
            <div style="display:flex;justify-content:space-between;
                         border-top:1px solid #bfdbfe;margin-top:.5rem;padding-top:.5rem;
                         font-weight:700">
              <span>Margen Neto</span>
              <strong [style.color]="marginColor(selectedLine()!.marginPct)">
                {{ selectedLine()!.margin | number:'1.0-0' }}
                ({{ selectedLine()!.marginPct | number:'1.1-1' }}%)
              </strong>
            </div>
          </div>

        </div>
      }
    </p-dialog>
  `
})
export class ProfitabilityComponent implements OnInit {

  data    = signal<ProfitabilityLine[]>([]);
  loading = signal(false);

  showDetail   = false;
  selectedLine = signal<ProfitabilityLine | null>(null);
  mode         = 'client';
  selectedClientId = '';

  clientOptions: { label: string; value: string }[] = [];

  constructor(private http: HttpClient,
              private clientService: ClientService,
              private messageService: MessageService) {}

  ngOnInit() {
    this.clientService.findAll({ size: 100, status: 'ACTIVE' }).subscribe(r => {
      this.clientOptions = r.content.map(c => ({
        label: c.companyName, value: c.id
      }));
    });
  }

  loadByClient() {
    if (!this.selectedClientId) return;
    this.loading.set(true);
    this.mode = 'client';
    this.http.get<ProfitabilityLine[]>(
      `${environment.apiUrl}/profitability/by-client`,
      { params: { clientId: this.selectedClientId } }
    ).subscribe({
      next: r => { this.data.set(r); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'warn', summary: 'Sin datos',
          detail: 'Verifica que los desarrolladores tengan salario y tarifa registrados'
        });
      }
    });
  }

  loadAll() {
    this.loading.set(true);
    this.mode = 'all';
    this.http.get<ProfitabilityLine[]>(`${environment.apiUrl}/profitability/all`)
      .subscribe({
        next: r => { this.data.set(r); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  openDetail(line: ProfitabilityLine) {
    this.selectedLine.set(line);
    this.showDetail = true;
  }

  chargesDetail(l: ProfitabilityLine) {
    return [
      { label: 'Prima de servicios',    value: l.prima,              pct: '8.33%' },
      { label: 'Cesantías',             value: l.cesantias,          pct: '8.33%' },
      { label: 'Intereses cesantías',   value: l.interesesCesantias, pct: '1.00%' },
      { label: 'Vacaciones',            value: l.vacaciones,         pct: '4.17%' },
      { label: 'Salud (empleador)',      value: l.saludEmpleador,     pct: '8.50%' },
      { label: 'Pensión (empleador)',    value: l.pensionEmpleador,   pct: '12.00%' },
      { label: 'ARL (riesgo I)',         value: l.arl,                pct: '0.52%' },
      { label: 'Caja de compensación',  value: l.cajaCompensacion,   pct: '4.00%' },
      { label: 'ICBF',                  value: l.icbf,               pct: '3.00%' },
      { label: 'SENA',                  value: l.sena,               pct: '2.00%' },
    ];
  }

  // Totales
  totalIngreso()  { return this.data().reduce((a, l) => a + l.clientRate,    0); }
  totalCosto()    { return this.data().reduce((a, l) => a + l.totalCost,     0); }
  totalMargen()   { return this.data().reduce((a, l) => a + l.margin,        0); }
  totalSalario()  { return this.data().reduce((a, l) => a + l.baseSalary,    0); }
  totalCargas()   { return this.data().reduce((a, l) => a + l.socialCharges, 0); }
  avgMarginPct()  {
    if (this.data().length === 0) return 0;
    const totalI = this.totalIngreso();
    return totalI > 0 ? (this.totalMargen() / totalI) * 100 : 0;
  }

  // Helpers visuales
  marginColor(pct: number): string {
    if (pct >= 30) return '#059669';
    if (pct >= 15) return '#d97706';
    if (pct >= 0)  return '#dc2626';
    return '#7c3aed';
  }

  marginBg(pct: number): string {
    if (pct >= 30) return 'linear-gradient(135deg,#059669,#10b981)';
    if (pct >= 15) return 'linear-gradient(135deg,#d97706,#f59e0b)';
    if (pct >= 0)  return 'linear-gradient(135deg,#dc2626,#ef4444)';
    return 'linear-gradient(135deg,#7c3aed,#a855f7)';
  }

  clamp(val: number): number {
    return Math.min(Math.max(val, 0), 100);
  }
}