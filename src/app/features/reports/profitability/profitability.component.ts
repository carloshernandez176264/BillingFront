import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { environment } from '@env/environment';
import { ClientService } from '@core/services/client.service';

interface ProfitabilityLine {
  developerId:        string;
  developerName:      string;
  profileName:        string;
  clientId:           string;
  clientName:         string;
  baseSalary:         number;
  socialCharges:      number;
  totalCost:          number;
  prima:              number;
  cesantias:          number;
  interesesCesantias: number;
  vacaciones:         number;
  saludEmpleador:     number;
  pensionEmpleador:   number;
  arl:                number;
  cajaCompensacion:   number;
  icbf:               number;
  sena:               number;
  clientRate:         number;
  baseRate:           number;
  discountAmount:     number;
  discountPct:        number;
  margin:             number;
  marginPct:          number;
}

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule,
            SelectModule, DialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Análisis de Rentabilidad</h1>
      <div style="display:flex;gap:.75rem">
        <p-button label="Por Cliente" icon="pi pi-building"
                  [outlined]="mode !== 'client'"
                  (click)="mode='client'; data.set([])"/>
        <p-button label="Todos los Clientes" icon="pi pi-users"
                  [outlined]="mode !== 'all'"
                  (click)="loadAll()"/>
      </div>
    </div>

    <!-- Filtro cliente -->
    @if (mode === 'client') {
      <div class="bp-card mb-3">
        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
          <div style="flex:1;min-width:250px">
            <label style="font-weight:600;font-size:.875rem;
                           display:block;margin-bottom:.4rem">
              Cliente
            </label>
            <p-select [(ngModel)]="selectedClientId"
                      [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el cliente" class="w-full">
            </p-select>
          </div>
          <p-button label="Calcular Rentabilidad" icon="pi pi-calculator"
                    [loading]="loading()"
                    [disabled]="!selectedClientId || loading()"
                    (click)="loadByClient()"/>
        </div>
      </div>
    }

    @if (data().length > 0) {

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);
                  gap:1rem;margin-bottom:1.5rem">

        <div class="bp-card" style="border-top:4px solid var(--bp-primary);
                                     text-align:center">
          <div style="font-size:.78rem;color:#64748b;font-weight:600;margin-bottom:.4rem">
            INGRESO MENSUAL
          </div>
          <div style="font-size:1.8rem;font-weight:800;color:var(--bp-primary)">
            {{ totalIngreso() | number:'1.0-0' }}
          </div>
          <div style="font-size:.72rem;color:#94a3b8">COP</div>
        </div>

        <div class="bp-card" style="border-top:4px solid #dc2626;text-align:center">
          <div style="font-size:.78rem;color:#64748b;font-weight:600;margin-bottom:.4rem">
            COSTO TOTAL
          </div>
          <div style="font-size:1.8rem;font-weight:800;color:#dc2626">
            {{ totalCosto() | number:'1.0-0' }}
          </div>
          <div style="font-size:.72rem;color:#94a3b8">
            Salario + Cargas (51.83%)
          </div>
        </div>

        <div class="bp-card" style="border-top:4px solid #059669;text-align:center">
          <div style="font-size:.78rem;color:#64748b;font-weight:600;margin-bottom:.4rem">
            MARGEN NETO
          </div>
          <div [style.color]="totalMargen() >= 0 ? '#059669' : '#dc2626'"
               style="font-size:1.8rem;font-weight:800">
            {{ totalMargen() | number:'1.0-0' }}
          </div>
          <div style="font-size:.72rem;color:#94a3b8">COP mensual</div>
        </div>

        <div class="bp-card" style="text-align:center"
             [style.border-top]="'4px solid ' + marginColor(avgMarginPct())">
          <div style="font-size:.78rem;color:#64748b;font-weight:600;margin-bottom:.4rem">
            RENTABILIDAD
          </div>
          <div [style.color]="marginColor(avgMarginPct())"
               style="font-size:1.8rem;font-weight:800">
            {{ avgMarginPct() | number:'1.1-1' }}%
          </div>
          <div style="font-size:.72rem;color:#94a3b8">sobre ingreso total</div>
        </div>

      </div>

      <!-- Indicador visual de rentabilidad global -->
      <div class="bp-card mb-3"
           style="background:linear-gradient(135deg,#1e3a5f,#1e4078);color:#fff">
        <div style="display:flex;justify-content:space-between;
                     align-items:center;margin-bottom:1rem">
          <div>
            <div style="font-weight:700;font-size:1rem">
              Indicador de Salud Financiera
            </div>
            <div style="font-size:.8rem;opacity:.75;margin-top:.2rem">
              Basado en margen sobre ingreso
            </div>
          </div>
          <div style="text-align:right">
            <div [style.color]="avgMarginPct() >= 30 ? '#86efac' :
                                 avgMarginPct() >= 15 ? '#fcd34d' : '#fca5a5'"
                 style="font-size:2rem;font-weight:800">
              {{ avgMarginPct() >= 30 ? '✓ Saludable' :
                 avgMarginPct() >= 15 ? '⚠ Moderado' : '✗ Bajo' }}
            </div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,.15);
                     border-radius:8px;height:12px;overflow:hidden">
          <div [style.width]="clamp(avgMarginPct()) + '%'"
               [style.background]="avgMarginPct() >= 30 ? '#86efac' :
                                    avgMarginPct() >= 15 ? '#fcd34d' : '#fca5a5'"
               style="height:100%;border-radius:8px;transition:width .8s ease">
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;
                     font-size:.7rem;opacity:.6;margin-top:.4rem">
          <span>0%</span>
          <span>15% Moderado</span>
          <span>30% Saludable</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Tarjetas por desarrollador -->
      <div style="display:grid;
                  grid-template-columns:repeat(auto-fill,minmax(360px,1fr));
                  gap:1rem;margin-bottom:1.5rem">

        @for (line of data(); track line.developerId + line.clientId) {
          <div style="border:1px solid #e2e8f0;border-radius:12px;
                       overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">

            <!-- Header tarjeta -->
            <div [style.background]="marginBg(line.marginPct)"
                 style="padding:1rem;color:#fff">
              <div style="display:flex;justify-content:space-between;
                           align-items:flex-start">
                <div>
                  <div style="font-weight:700;font-size:1rem">
                    {{ line.developerName }}
                  </div>
                  <div style="font-size:.78rem;opacity:.85;margin-top:.2rem">
                    {{ line.profileName }}
                  </div>
                  <div style="font-size:.75rem;opacity:.7;margin-top:.1rem">
                    <i class="pi pi-building" style="margin-right:.3rem"></i>
                    {{ line.clientName }}
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:.7rem;opacity:.75">RENTABILIDAD</div>
                  <div style="font-size:1.8rem;font-weight:800;line-height:1">
                    {{ line.marginPct | number:'1.1-1' }}%
                  </div>
                  <div style="font-size:.7rem;opacity:.75;margin-top:.2rem">
                    {{ line.marginPct >= 30 ? '✓ Saludable' :
                       line.marginPct >= 15 ? '⚠ Moderado' : '✗ Revisar' }}
                  </div>
                </div>
              </div>

              <!-- Mini barra rentabilidad -->
              <div style="margin-top:.75rem;background:rgba(255,255,255,.2);
                           border-radius:4px;height:4px;overflow:hidden">
                <div [style.width]="clamp(line.marginPct) + '%'"
                     style="background:rgba(255,255,255,.9);
                            height:100%;border-radius:4px;transition:width .5s">
                </div>
              </div>
            </div>

            <!-- Body tarjeta -->
            <div style="padding:1rem">

              <!-- Ingreso vs Costo -->
              <div style="display:grid;grid-template-columns:1fr 1fr;
                           gap:.5rem;margin-bottom:.75rem">
                <div style="background:#f0fdf4;border-radius:8px;
                             padding:.6rem;text-align:center">
                  <div style="font-size:.68rem;color:#166534;
                               font-weight:700;margin-bottom:.2rem">
                    INGRESO (TARIFA)
                  </div>
                  <div style="font-size:.95rem;font-weight:700;color:#166534">
                    {{ line.clientRate | number:'1.0-0' }}
                  </div>
                </div>
                <div style="background:#fef2f2;border-radius:8px;
                             padding:.6rem;text-align:center">
                  <div style="font-size:.68rem;color:#991b1b;
                               font-weight:700;margin-bottom:.2rem">
                    COSTO TOTAL
                  </div>
                  <div style="font-size:.95rem;font-weight:700;color:#991b1b">
                    {{ line.totalCost | number:'1.0-0' }}
                  </div>
                </div>
              </div>

              <!-- Margen -->
              <div style="background:#f8fafc;border-radius:8px;padding:.6rem;
                           display:flex;justify-content:space-between;
                           align-items:center;margin-bottom:.75rem">
                <span style="font-size:.82rem;font-weight:600;color:#475569">
                  Margen mensual
                </span>
                <strong [style.color]="marginColor(line.marginPct)"
                        style="font-size:1rem">
                  {{ line.margin | number:'1.0-0' }}
                </strong>
              </div>

              <!-- Salario y cargas -->
              <div style="font-size:.78rem;color:#64748b;margin-bottom:.5rem">
                <div style="display:flex;justify-content:space-between;
                             margin-bottom:.2rem">
                  <span>Salario base</span>
                  <span style="font-weight:600">
                    {{ line.baseSalary | number:'1.0-0' }}
                  </span>
                </div>
                <div style="display:flex;justify-content:space-between;
                             margin-bottom:.2rem">
                  <span>Cargas prestacionales (51.83%)</span>
                  <span style="color:#dc2626;font-weight:600">
                    +{{ line.socialCharges | number:'1.0-0' }}
                  </span>
                </div>
              </div>

              <!-- Descuento vs base -->
              <div style="border-top:1px solid #e2e8f0;padding-top:.6rem;
                           display:flex;justify-content:space-between;
                           font-size:.78rem;color:#64748b;margin-bottom:.75rem">
                <span>Descuento sobre tarifa base</span>
                <span style="font-weight:600;color:#d97706">
                  {{ line.discountPct | number:'1.1-1' }}%
                  (-{{ line.discountAmount | number:'1.0-0' }})
                </span>
              </div>

              <p-button label="Ver desglose de cargas" icon="pi pi-list"
                        severity="secondary" size="small" styleClass="w-full"
                        (click)="openDetail(line)"/>
            </div>
          </div>
        }
      </div>

      <!-- Tabla resumen comparativo -->
      <div class="bp-card">
        <h3 style="margin:0 0 1rem;color:var(--bp-primary)">
          <i class="pi pi-table" style="margin-right:.5rem"></i>
          Resumen Comparativo
        </h3>
        <p-table [value]="data()" dataKey="developerId"
                 styleClass="p-datatable-sm" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Desarrollador</th>
              <th>Perfil</th>
              <th>Cliente</th>
              <th class="text-right">Salario</th>
              <th class="text-right">Cargas</th>
              <th class="text-right">Costo Total</th>
              <th class="text-right">Tarifa Base</th>
              <th class="text-right">Tarifa Cliente</th>
              <th class="text-right">Desc. %</th>
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
              <td class="text-right" style="color:#64748b">
                {{ l.baseRate | number:'1.0-0' }}
              </td>
              <td class="text-right" style="color:var(--bp-primary);font-weight:700">
                {{ l.clientRate | number:'1.0-0' }}
              </td>
              <td class="text-right" style="color:#d97706">
                {{ l.discountPct | number:'1.1-1' }}%
              </td>
              <td class="text-right"
                  [style.color]="marginColor(l.marginPct)">
                {{ l.margin | number:'1.0-0' }}
              </td>
              <td class="text-right">
                <span [style.background]="marginBg(l.marginPct)"
                      style="color:#fff;padding:.25rem .65rem;
                             border-radius:20px;font-size:.78rem;font-weight:700;
                             white-space:nowrap">
                  {{ l.marginPct | number:'1.1-1' }}%
                </span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr style="font-weight:700;background:#f0f4f8">
              <td colspan="3">TOTALES</td>
              <td class="text-right">{{ totalSalario() | number:'1.0-0' }}</td>
              <td class="text-right" style="color:#dc2626">
                {{ totalCargas() | number:'1.0-0' }}
              </td>
              <td class="text-right" style="color:#dc2626">
                {{ totalCosto() | number:'1.0-0' }}
              </td>
              <td colspan="2" class="text-right"
                  style="color:var(--bp-primary)">
                {{ totalIngreso() | number:'1.0-0' }}
              </td>
              <td></td>
              <td class="text-right"
                  [style.color]="marginColor(avgMarginPct())">
                {{ totalMargen() | number:'1.0-0' }}
              </td>
              <td class="text-right">
                <span [style.background]="marginBg(avgMarginPct())"
                      style="color:#fff;padding:.25rem .65rem;
                             border-radius:20px;font-size:.78rem;font-weight:700">
                  {{ avgMarginPct() | number:'1.1-1' }}%
                </span>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

    } @else if (!loading()) {
      <div class="bp-card"
           style="text-align:center;padding:4rem;color:#94a3b8">
        <i class="pi pi-chart-pie"
           style="font-size:3.5rem;margin-bottom:1.5rem;
                  display:block;color:#cbd5e1"></i>
        <p style="font-size:1.1rem;font-weight:600;margin-bottom:.5rem">
          Análisis de Rentabilidad
        </p>
        <p style="font-size:.875rem">
          Selecciona un cliente y haz clic en
          <strong>"Calcular Rentabilidad"</strong>
        </p>
        <p style="font-size:.78rem;margin-top:.75rem;
                   background:#fef3c7;color:#92400e;
                   padding:.5rem 1rem;border-radius:6px;
                   display:inline-block">
          <i class="pi pi-info-circle" style="margin-right:.4rem"></i>
          Los desarrolladores deben tener salario base registrado
        </p>
      </div>
    }

    <!-- Dialog desglose cargas prestacionales -->
    <p-dialog [(visible)]="showDetail"
              [header]="'Desglose de Cargas — ' + selectedLine()?.developerName"
              [modal]="true" [style]="{width:'560px'}">
      @if (selectedLine()) {
        <div>
          <!-- Resumen salario -->
          <div style="background:#f0fdf4;border-radius:10px;
                       padding:1rem;margin-bottom:1rem">
            <div style="display:flex;justify-content:space-between;
                         margin-bottom:.4rem">
              <span style="font-weight:600">Salario Base Mensual</span>
              <strong style="font-size:1.05rem">
                {{ selectedLine()!.baseSalary | number:'1.0-0' }}
              </strong>
            </div>
            <div style="display:flex;justify-content:space-between;
                         font-size:.875rem;color:#64748b;margin-bottom:.4rem">
              <span>Total Cargas Prestacionales (51.83%)</span>
              <span style="color:#dc2626;font-weight:600">
                +{{ selectedLine()!.socialCharges | number:'1.0-0' }}
              </span>
            </div>
            <div style="border-top:1px solid #bbf7d0;padding-top:.6rem;
                         display:flex;justify-content:space-between;
                         font-weight:700">
              <span>Costo Total Mensual</span>
              <strong style="color:#dc2626;font-size:1.1rem">
                {{ selectedLine()!.totalCost | number:'1.0-0' }}
              </strong>
            </div>
          </div>

          <!-- Desglose cargas -->
          <h4 style="margin:0 0 .75rem;color:#475569;font-size:.875rem;
                      text-transform:uppercase;letter-spacing:.05em">
            Desglose de Cargas Prestacionales
          </h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;
                       margin-bottom:1rem">
            @for (item of chargesDetail(selectedLine()!); track item.label) {
              <div style="display:flex;justify-content:space-between;
                           align-items:center;padding:.5rem .75rem;
                           background:#f8fafc;border-radius:8px;
                           border:1px solid #e2e8f0;font-size:.82rem">
                <div>
                  <div style="font-weight:600;color:#374151">
                    {{ item.label }}
                  </div>
                  <div style="font-size:.7rem;color:#94a3b8">
                    {{ item.pct }}
                  </div>
                </div>
                <strong style="color:#dc2626">
                  {{ item.value | number:'1.0-0' }}
                </strong>
              </div>
            }
          </div>

          <!-- Análisis ingreso vs costo -->
          <div style="background:#eff6ff;border-radius:10px;padding:1rem">
            <h4 style="margin:0 0 .75rem;color:#1e40af;font-size:.875rem;
                        text-transform:uppercase;letter-spacing:.05em">
              Análisis de Ingreso
            </h4>
            <div style="font-size:.875rem">
              <div style="display:flex;justify-content:space-between;
                           margin-bottom:.3rem">
                <span style="color:#64748b">Tarifa base (precio de lista)</span>
                <span>{{ selectedLine()!.baseRate | number:'1.0-0' }}</span>
              </div>
              <div style="display:flex;justify-content:space-between;
                           margin-bottom:.3rem">
                <span style="color:#d97706">
                  Descuento al cliente
                  ({{ selectedLine()!.discountPct | number:'1.1-1' }}%)
                </span>
                <span style="color:#d97706">
                  -{{ selectedLine()!.discountAmount | number:'1.0-0' }}
                </span>
              </div>
              <div style="display:flex;justify-content:space-between;
                           margin-bottom:.75rem">
                <span style="font-weight:600">Tarifa cobrada al cliente</span>
                <strong style="color:var(--bp-primary)">
                  {{ selectedLine()!.clientRate | number:'1.0-0' }}
                </strong>
              </div>
              <div style="border-top:2px solid #bfdbfe;padding-top:.75rem;
                           display:flex;justify-content:space-between;
                           font-weight:700;font-size:1rem">
                <span>Margen Neto</span>
                <strong [style.color]="marginColor(selectedLine()!.marginPct)">
                  {{ selectedLine()!.margin | number:'1.0-0' }}
                  <span style="font-size:.8rem;font-weight:400">
                    ({{ selectedLine()!.marginPct | number:'1.1-1' }}%)
                  </span>
                </strong>
              </div>
            </div>
          </div>
        </div>
      }
    </p-dialog>
  `
})
export class ProfitabilityComponent implements OnInit {

  data         = signal<ProfitabilityLine[]>([]);
  loading      = signal(false);
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
      { label: 'Prima de servicios',   value: l.prima,              pct: '8.33%'  },
      { label: 'Cesantías',            value: l.cesantias,          pct: '8.33%'  },
      { label: 'Int. cesantías',       value: l.interesesCesantias, pct: '1.00%'  },
      { label: 'Vacaciones',           value: l.vacaciones,         pct: '4.17%'  },
      { label: 'Salud (empleador)',     value: l.saludEmpleador,     pct: '8.50%'  },
      { label: 'Pensión (empleador)',   value: l.pensionEmpleador,   pct: '12.00%' },
      { label: 'ARL (riesgo I)',        value: l.arl,                pct: '0.52%'  },
      { label: 'Caja compensación',    value: l.cajaCompensacion,   pct: '4.00%'  },
      { label: 'ICBF',                 value: l.icbf,               pct: '3.00%'  },
      { label: 'SENA',                 value: l.sena,               pct: '2.00%'  },
    ];
  }

  totalIngreso()  { return this.data().reduce((a, l) => a + l.clientRate,    0); }
  totalCosto()    { return this.data().reduce((a, l) => a + l.totalCost,     0); }
  totalMargen()   { return this.data().reduce((a, l) => a + l.margin,        0); }
  totalSalario()  { return this.data().reduce((a, l) => a + l.baseSalary,    0); }
  totalCargas()   { return this.data().reduce((a, l) => a + l.socialCharges, 0); }

  avgMarginPct() {
    const totalI = this.totalIngreso();
    return totalI > 0 ? (this.totalMargen() / totalI) * 100 : 0;
  }

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