import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { ClientService } from '@core/services/client.service';

interface BillingLine {
  developerName:   string;
  profileName:     string;
  rateType:        string;
  billedHours:     number;
  grossAmount:     number;
  noveltyDiscount: number;
  netAmount:       number;
}

interface ClientResult {
  clientId:              string;
  clientName:            string;
  lines:                 BillingLine[];
  subtotal:              number;
  totalNoveltyDiscounts: number;
  taxableAmount:         number;
  taxAmount:             number;
  totalAmount:           number;
}

interface PeriodSummary {
  billingYear:   number;
  billingMonth:  number;
  clientCount:   number;
  grandTotal:    number;
  clientResults: ClientResult[];
}

interface ClientMonthDetail {
  month:            number;
  monthName:        string;
  invoiceNumber:    string;
  subtotal:         number;
  noveltyDiscounts: number;
  taxAmount:        number;
  total:            number;
}

interface ClientAnnualReport {
  clientId:              string;
  clientName:            string;
  year:                  number;
  monthsWithInvoices:    number;
  annualSubtotal:        number;
  annualNoveltyDiscounts:number;
  annualTaxAmount:       number;
  annualTotal:           number;
  monthlyAverage:        number;
  annualCost:            number;
  annualMargin:          number;
  marginPct:             number;
  months:                ClientMonthDetail[];
}

interface MonthSummary {
  month:            number;
  monthName:        string;
  clientCount:      number;
  subtotal:         number;
  noveltyDiscounts: number;
  taxAmount:        number;
  total:            number;
}

interface GeneralAnnualReport {
  year:                  number;
  totalClients:          number;
  totalInvoices:         number;
  grandTotal:            number;
  grandNoveltyDiscounts: number;
  grandTaxAmount:        number;
  clientSummaries:       ClientAnnualReport[];
  monthlyTotals:         MonthSummary[];
}

@Component({
  selector: 'app-billing-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectModule],
  template: `
    <div class="bp-page-header">
      <h1>Reportes de Facturación</h1>
      <div style="display:flex;gap:.5rem">
        <p-button label="Mensual" icon="pi pi-calendar"
                  size="small" [outlined]="vista !== 'mensual'"
                  (click)="cambiarVista('mensual')"/>
        <p-button label="Cliente / Año" icon="pi pi-building"
                  size="small" [outlined]="vista !== 'cliente'"
                  (click)="cambiarVista('cliente')"/>
        <p-button label="General / Año" icon="pi pi-chart-bar"
                  size="small" [outlined]="vista !== 'general'"
                  (click)="cambiarVista('general')"/>
      </div>
    </div>

    <!-- ========== VISTA MENSUAL ========== -->
    @if (vista === 'mensual') {
      <div class="bp-card mb-3">
        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
          <div class="field">
            <label>Año</label>
            <p-select [(ngModel)]="year" [options]="yearOptions"
                      [style]="{'min-width':'120px'}"/>
          </div>
          <div class="field">
            <label>Mes</label>
            <p-select [(ngModel)]="month" [options]="monthOptions"
                      optionLabel="label" optionValue="value"
                      [style]="{'min-width':'150px'}"/>
          </div>
          <p-button label="Generar" icon="pi pi-search"
                    (click)="loadMensual()" [loading]="loading()"/>
        </div>
      </div>

      @if (periodSummary()) {
        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);
                    gap:1rem;margin-bottom:1.5rem">
          <div class="bp-card"
               style="text-align:center;border-top:4px solid var(--bp-primary)">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">CLIENTES</div>
            <div style="font-size:2.2rem;font-weight:800;color:var(--bp-primary)">
              {{ periodSummary()!.clientCount }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">
              {{ mesNombre(periodSummary()!.billingMonth) }}
              {{ periodSummary()!.billingYear }}
            </div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #0891b2">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">DESARROLLADORES</div>
            <div style="font-size:2.2rem;font-weight:800;color:#0891b2">
              {{ totalDevsMensual() }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">en facturación</div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #dc2626">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">DESCUENTOS NOVEDAD</div>
            <div style="font-size:1.6rem;font-weight:800;color:#dc2626">
              {{ totalDescMensual() | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP</div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #059669">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">TOTAL FACTURADO</div>
            <div style="font-size:1.6rem;font-weight:800;color:#059669">
              {{ periodSummary()!.grandTotal | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP</div>
          </div>
        </div>

        <!-- Detalle por cliente -->
        @for (r of periodSummary()!.clientResults; track r.clientId) {
          <div class="bp-card mb-3">
            <div style="display:flex;justify-content:space-between;
                         align-items:center;padding-bottom:.75rem;
                         margin-bottom:.75rem;border-bottom:2px solid #e2e8f0">
              <div>
                <h3 style="margin:0;color:var(--bp-primary);font-size:1rem">
                  <i class="pi pi-building" style="margin-right:.4rem"></i>
                  {{ r.clientName }}
                </h3>
                <div style="font-size:.78rem;color:#64748b;margin-top:.15rem">
                  {{ r.lines.length }} desarrollador(es) —
                  {{ mesNombre(periodSummary()!.billingMonth) }}
                  {{ periodSummary()!.billingYear }}
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-size:.7rem;color:#64748b">TOTAL</div>
                <div style="font-size:1.4rem;font-weight:800;
                             color:var(--bp-primary)">
                  {{ r.totalAmount | number:'1.0-0' }}
                  <span style="font-size:.72rem;font-weight:400">COP</span>
                </div>
              </div>
            </div>

            <p-table [value]="r.lines" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Desarrollador</th><th>Perfil</th><th>Tipo</th>
                  <th class="text-right">Horas</th>
                  <th class="text-right">Bruto</th>
                  <th class="text-right">Desc. Novedad</th>
                  <th class="text-right">Neto</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-l>
                <tr>
                  <td><strong>{{ l.developerName }}</strong></td>
                  <td>{{ l.profileName }}</td>
                  <td>
                    <span class="bp-badge active">
                      {{ traducirTipo(l.rateType) }}
                    </span>
                  </td>
                  <td class="text-right">{{ l.billedHours | number:'1.0-0' }}</td>
                  <td class="text-right">{{ l.grossAmount | number:'1.0-0' }}</td>
                  <td class="text-right" style="color:#dc2626">
                    @if (l.noveltyDiscount > 0) {
                      -{{ l.noveltyDiscount | number:'1.0-0' }}
                    } @else { <span style="color:#94a3b8">—</span> }
                  </td>
                  <td class="text-right">
                    <strong>{{ l.netAmount | number:'1.0-0' }}</strong>
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <div style="display:flex;justify-content:flex-end;margin-top:.75rem">
              <div style="min-width:260px;background:#f8fafc;
                           border-radius:8px;padding:.75rem 1rem;
                           border:1px solid #e2e8f0;font-size:.85rem">
                <div style="display:flex;justify-content:space-between;
                             margin-bottom:.3rem">
                  <span style="color:#64748b">Subtotal bruto</span>
                  <span>{{ r.subtotal | number:'1.0-0' }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;
                             margin-bottom:.3rem">
                  <span style="color:#dc2626">Desc. novedad</span>
                  <span style="color:#dc2626">
                    -{{ r.totalNoveltyDiscounts | number:'1.0-0' }}
                  </span>
                </div>
                <div style="display:flex;justify-content:space-between;
                             margin-bottom:.3rem">
                  <span style="color:#64748b">Base gravable</span>
                  <span>{{ r.taxableAmount | number:'1.0-0' }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;
                             margin-bottom:.5rem">
                  <span style="color:#64748b">IVA</span>
                  <span>{{ r.taxAmount | number:'1.0-0' }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;
                             border-top:2px solid #e2e8f0;padding-top:.5rem;
                             font-weight:700;font-size:.95rem">
                  <span>TOTAL</span>
                  <span style="color:var(--bp-primary)">
                    {{ r.totalAmount | number:'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Banda total general -->
        <div class="bp-card"
             style="background:linear-gradient(135deg,#1e3a5f,#1e4078);color:#fff">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
            <div style="text-align:center">
              <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                SUBTOTAL BRUTO
              </div>
              <div style="font-size:1.2rem;font-weight:700">
                {{ totalSubMensual() | number:'1.0-0' }}
              </div>
            </div>
            <div style="text-align:center">
              <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                DESCUENTOS
              </div>
              <div style="font-size:1.2rem;font-weight:700;color:#fca5a5">
                -{{ totalDescMensual() | number:'1.0-0' }}
              </div>
            </div>
            <div style="text-align:center">
              <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">IVA</div>
              <div style="font-size:1.2rem;font-weight:700">
                {{ totalIvaMensual() | number:'1.0-0' }}
              </div>
            </div>
            <div style="text-align:center;background:rgba(255,255,255,.12);
                         border-radius:8px;padding:.6rem">
              <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                TOTAL GENERAL
              </div>
              <div style="font-size:1.7rem;font-weight:800;color:#86efac">
                {{ periodSummary()!.grandTotal | number:'1.0-0' }}
              </div>
              <div style="font-size:.65rem;opacity:.6">COP</div>
            </div>
          </div>
        </div>

      } @else if (!loading()) {
        <div class="bp-card" style="text-align:center;padding:3rem;color:#94a3b8">
          <i class="pi pi-calendar"
             style="font-size:3rem;margin-bottom:1rem;display:block"></i>
          <p style="font-size:1rem;font-weight:600">Reporte de Facturación Mensual</p>
          <p style="font-size:.875rem">Selecciona año y mes para generar el reporte</p>
        </div>
      }
    }

    <!-- ========== VISTA CLIENTE / AÑO ========== -->
    @if (vista === 'cliente') {
      <div class="bp-card mb-3">
        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
          <div class="field" style="min-width:250px">
            <label>Cliente</label>
            <p-select [(ngModel)]="selectedClientId"
                      [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el cliente" class="w-full"/>
          </div>
          <div class="field">
            <label>Año</label>
            <p-select [(ngModel)]="year" [options]="yearOptions"
                      [style]="{'min-width':'120px'}"/>
          </div>
          <p-button label="Generar Reporte" icon="pi pi-search"
                    (click)="loadClienteAnual()"
                    [loading]="loading()"
                    [disabled]="!selectedClientId"/>
        </div>
      </div>

      @if (clientAnnual()) {
        <!-- KPIs cliente -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);
                    gap:1rem;margin-bottom:1.5rem">
          <div class="bp-card"
               style="text-align:center;border-top:4px solid var(--bp-primary)">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">MESES FACTURADOS</div>
            <div style="font-size:2.2rem;font-weight:800;color:var(--bp-primary)">
              {{ clientAnnual()!.monthsWithInvoices }}
              <span style="font-size:1rem;font-weight:400">/12</span>
            </div>
            <div style="font-size:.7rem;color:#94a3b8">
              {{ clientAnnual()!.clientName }} — {{ clientAnnual()!.year }}
            </div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #d97706">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">PROMEDIO MENSUAL</div>
            <div style="font-size:1.5rem;font-weight:800;color:#d97706">
              {{ clientAnnual()!.monthlyAverage | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP / mes</div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #dc2626">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">DESC. NOVEDADES</div>
            <div style="font-size:1.5rem;font-weight:800;color:#dc2626">
              {{ clientAnnual()!.annualNoveltyDiscounts | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP en el año</div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #059669">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">TOTAL ANUAL</div>
            <div style="font-size:1.5rem;font-weight:800;color:#059669">
              {{ clientAnnual()!.annualTotal | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP</div>
          </div>
        </div>

        <!-- Rentabilidad cliente -->
        @if (clientAnnual()!.annualCost > 0) {
          <div class="bp-card mb-3"
               style="background:linear-gradient(135deg,#1e3a5f,#1e4078);color:#fff">
            <h3 style="margin:0 0 1rem;color:#fff;font-size:.95rem">
              <i class="pi pi-chart-pie" style="margin-right:.5rem"></i>
              Rentabilidad del Cliente — {{ clientAnnual()!.clientName }}
              {{ clientAnnual()!.year }}
            </h3>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1rem">
              <div style="text-align:center">
                <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                  INGRESO TOTAL
                </div>
                <div style="font-size:1.2rem;font-weight:700;color:#86efac">
                  {{ clientAnnual()!.annualTotal | number:'1.0-0' }}
                </div>
              </div>
              <div style="text-align:center">
                <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                  COSTO ESTIMADO
                </div>
                <div style="font-size:1.2rem;font-weight:700;color:#fca5a5">
                  {{ clientAnnual()!.annualCost | number:'1.0-0' }}
                </div>
              </div>
              <div style="text-align:center">
                <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                  MARGEN NETO
                </div>
                <div style="font-size:1.2rem;font-weight:700"
                     [style.color]="clientAnnual()!.annualMargin >= 0
                       ? '#86efac' : '#fca5a5'">
                  {{ clientAnnual()!.annualMargin | number:'1.0-0' }}
                </div>
              </div>
              <div style="text-align:center;background:rgba(255,255,255,.12);
                           border-radius:8px;padding:.6rem">
                <div style="font-size:.7rem;opacity:.7;margin-bottom:.3rem">
                  RENTABILIDAD
                </div>
                <div style="font-size:1.6rem;font-weight:800"
                     [style.color]="clientAnnual()!.marginPct >= 30
                       ? '#86efac' : clientAnnual()!.marginPct >= 15
                       ? '#fcd34d' : '#fca5a5'">
                  {{ clientAnnual()!.marginPct | number:'1.1-1' }}%
                </div>
              </div>
            </div>
            <!-- Barra rentabilidad -->
            <div style="margin-top:1rem;background:rgba(255,255,255,.15);
                         border-radius:4px;height:8px;overflow:hidden">
              <div [style.width]="clamp(clientAnnual()!.marginPct) + '%'"
                   [style.background]="clientAnnual()!.marginPct >= 30
                     ? '#86efac' : clientAnnual()!.marginPct >= 15
                     ? '#fcd34d' : '#fca5a5'"
                   style="height:100%;border-radius:4px;transition:width .8s">
              </div>
            </div>
          </div>
        }

        <!-- Tabla meses -->
        <div class="bp-card mb-3">
          <h3 style="margin:0 0 1rem;color:var(--bp-primary);font-size:.95rem">
            <i class="pi pi-table" style="margin-right:.4rem"></i>
            Detalle Mensual — {{ clientAnnual()!.clientName }}
            {{ clientAnnual()!.year }}
          </h3>
          <p-table [value]="clientAnnual()!.months" dataKey="month"
                   styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Mes</th>
                <th>N° Pre-Factura</th>
                <th class="text-right">Subtotal</th>
                <th class="text-right">Desc. Novedad</th>
                <th class="text-right">IVA</th>
                <th class="text-right">Total</th>
                <th>Distribución</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-m>
              <tr>
                <td><strong>{{ m.monthName }}</strong></td>
                <td>
                  <code style="font-size:.82rem;color:var(--bp-primary)">
                    {{ m.invoiceNumber }}
                  </code>
                </td>
                <td class="text-right">{{ m.subtotal | number:'1.0-0' }}</td>
                <td class="text-right" style="color:#dc2626">
                  @if (m.noveltyDiscounts > 0) {
                    -{{ m.noveltyDiscounts | number:'1.0-0' }}
                  } @else { <span style="color:#94a3b8">—</span> }
                </td>
                <td class="text-right">{{ m.taxAmount | number:'1.0-0' }}</td>
                <td class="text-right">
                  <strong style="color:var(--bp-primary)">
                    {{ m.total | number:'1.0-0' }}
                  </strong>
                </td>
                <td style="min-width:100px">
                  <div style="background:#e2e8f0;border-radius:4px;
                               height:6px;overflow:hidden">
                    <div [style.width]="barWidthCliente(m.total) + '%'"
                         style="background:var(--bp-primary);height:100%;
                                border-radius:4px">
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr style="font-weight:700;background:#f0f4f8">
                <td colspan="2">TOTAL {{ clientAnnual()!.year }}</td>
                <td class="text-right">
                  {{ clientAnnual()!.annualSubtotal | number:'1.0-0' }}
                </td>
                <td class="text-right" style="color:#dc2626">
                  -{{ clientAnnual()!.annualNoveltyDiscounts | number:'1.0-0' }}
                </td>
                <td class="text-right">
                  {{ clientAnnual()!.annualTaxAmount | number:'1.0-0' }}
                </td>
                <td class="text-right" style="color:var(--bp-primary)">
                  {{ clientAnnual()!.annualTotal | number:'1.0-0' }}
                </td>
                <td></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Gráfico barras cliente -->
        <div class="bp-card">
          <h3 style="margin:0 0 1.25rem;color:var(--bp-primary);font-size:.95rem">
            <i class="pi pi-chart-bar" style="margin-right:.4rem"></i>
            Evolución Mensual — {{ clientAnnual()!.clientName }}
          </h3>
          <div style="display:flex;align-items:flex-end;gap:.4rem;height:160px">
            @for (m of clientAnnual()!.months; track m.month) {
              <div style="flex:1;display:flex;flex-direction:column;
                           align-items:center;gap:.3rem">
                <div style="font-size:.62rem;color:#64748b;font-weight:600">
                  {{ m.total > 0 ? ((m.total/1000000) | number:'1.0-1') + 'M' : '' }}
                </div>
                <div [style.height]="barHeightCliente(m.total) + 'px'"
                     style="width:100%;border-radius:6px 6px 0 0;
                            transition:height .5s ease;min-height:3px"
                     [style.background]="m.total > 0
                       ? 'linear-gradient(180deg,#3b82f6,#1e4078)'
                       : '#e2e8f0'">
                </div>
                <div style="font-size:.65rem;color:#64748b;text-align:center;
                             writing-mode:vertical-rl;transform:rotate(180deg);
                             height:45px">
                  {{ m.monthName.substring(0,3) }}
                </div>
              </div>
            }
          </div>
        </div>

      } @else if (!loading()) {
        <div class="bp-card" style="text-align:center;padding:3rem;color:#94a3b8">
          <i class="pi pi-building"
             style="font-size:3rem;margin-bottom:1rem;display:block"></i>
          <p style="font-size:1rem;font-weight:600">
            Reporte Individual por Cliente
          </p>
          <p style="font-size:.875rem">
            Selecciona un cliente y el año para ver su historial de facturación
          </p>
          <p style="font-size:.78rem;margin-top:.5rem;color:#cbd5e1">
            Solo muestra pre-facturas en estado APROBADO
          </p>
        </div>
      }
    }

    <!-- ========== VISTA GENERAL / AÑO ========== -->
    @if (vista === 'general') {
      <div class="bp-card mb-3">
        <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
          <div class="field">
            <label>Año</label>
            <p-select [(ngModel)]="year" [options]="yearOptions"
                      [style]="{'min-width':'120px'}"/>
          </div>
          <p-button label="Generar Reporte General" icon="pi pi-search"
                    (click)="loadGeneral()" [loading]="loading()"/>
        </div>
      </div>

      @if (generalAnnual()) {

        <!-- KPIs generales -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);
                    gap:1rem;margin-bottom:1.5rem">
          <div class="bp-card"
               style="text-align:center;border-top:4px solid var(--bp-primary)">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">CLIENTES ACTIVOS</div>
            <div style="font-size:2.2rem;font-weight:800;color:var(--bp-primary)">
              {{ generalAnnual()!.totalClients }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">
              año {{ generalAnnual()!.year }}
            </div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #0891b2">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">PRE-FACTURAS APROBADAS</div>
            <div style="font-size:2.2rem;font-weight:800;color:#0891b2">
              {{ generalAnnual()!.totalInvoices }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">en el año</div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #dc2626">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">DESCUENTOS TOTALES</div>
            <div style="font-size:1.5rem;font-weight:800;color:#dc2626">
              {{ generalAnnual()!.grandNoveltyDiscounts | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP</div>
          </div>
          <div class="bp-card"
               style="text-align:center;border-top:4px solid #059669">
            <div style="font-size:.75rem;color:#64748b;font-weight:600;
                         margin-bottom:.4rem">TOTAL FACTURADO</div>
            <div style="font-size:1.5rem;font-weight:800;color:#059669">
              {{ generalAnnual()!.grandTotal | number:'1.0-0' }}
            </div>
            <div style="font-size:.7rem;color:#94a3b8">COP</div>
          </div>
        </div>

        <!-- Tabla consolidada por cliente -->
        <div class="bp-card mb-3">
          <h3 style="margin:0 0 1rem;color:var(--bp-primary);font-size:.95rem">
            <i class="pi pi-users" style="margin-right:.4rem"></i>
            Consolidado por Cliente — {{ generalAnnual()!.year }}
          </h3>
          <p-table [value]="generalAnnual()!.clientSummaries"
                   dataKey="clientId" styleClass="p-datatable-sm"
                   responsiveLayout="scroll">
            <ng-template pTemplate="header">
              <tr>
                <th>Cliente</th>
                <th class="text-right">Meses</th>
                <th class="text-right">Subtotal Bruto</th>
                <th class="text-right">Desc. Novedad</th>
                <th class="text-right">IVA</th>
                <th class="text-right">Total Anual</th>
                <th class="text-right">Promedio/Mes</th>
                <th>Participación</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-c>
              <tr>
                <td>
                  <strong>{{ c.clientName }}</strong>
                </td>
                <td class="text-right">{{ c.monthsWithInvoices }}</td>
                <td class="text-right">
                  {{ c.annualSubtotal | number:'1.0-0' }}
                </td>
                <td class="text-right" style="color:#dc2626">
                  @if (c.annualNoveltyDiscounts > 0) {
                    -{{ c.annualNoveltyDiscounts | number:'1.0-0' }}
                  } @else { <span style="color:#94a3b8">—</span> }
                </td>
                <td class="text-right">
                  {{ c.annualTaxAmount | number:'1.0-0' }}
                </td>
                <td class="text-right">
                  <strong style="color:var(--bp-primary)">
                    {{ c.annualTotal | number:'1.0-0' }}
                  </strong>
                </td>
                <td class="text-right" style="color:#64748b">
                  {{ c.monthlyAverage | number:'1.0-0' }}
                </td>
                <td style="min-width:120px">
                  <div style="display:flex;align-items:center;gap:.4rem">
                    <div style="flex:1;background:#e2e8f0;border-radius:4px;
                                 height:8px;overflow:hidden">
                      <div [style.width]="participacion(c.annualTotal) + '%'"
                           style="background:var(--bp-primary);height:100%;
                                  border-radius:4px">
                      </div>
                    </div>
                    <span style="font-size:.72rem;color:#64748b;min-width:32px">
                      {{ participacion(c.annualTotal) | number:'1.0-0' }}%
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr style="font-weight:700;background:#f0f4f8">
                <td>TOTAL {{ generalAnnual()!.year }}</td>
                <td class="text-right">
                  {{ generalAnnual()!.totalInvoices }}
                </td>
                <td></td>
                <td class="text-right" style="color:#dc2626">
                  -{{ generalAnnual()!.grandNoveltyDiscounts | number:'1.0-0' }}
                </td>
                <td class="text-right">
                  {{ generalAnnual()!.grandTaxAmount | number:'1.0-0' }}
                </td>
                <td class="text-right" style="color:var(--bp-primary)">
                  {{ generalAnnual()!.grandTotal | number:'1.0-0' }}
                </td>
                <td colspan="2"></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Evolución mensual general -->
        <div class="bp-card mb-3">
          <h3 style="margin:0 0 1rem;color:var(--bp-primary);font-size:.95rem">
            <i class="pi pi-chart-bar" style="margin-right:.4rem"></i>
            Evolución Mensual Consolidada — {{ generalAnnual()!.year }}
          </h3>
          <p-table [value]="mesesConDatos()"
                   styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Mes</th>
                <th class="text-right">Clientes</th>
                <th class="text-right">Subtotal</th>
                <th class="text-right">Desc. Novedad</th>
                <th class="text-right">IVA</th>
                <th class="text-right">Total</th>
                <th>Distribución</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-m>
              <tr>
                <td><strong>{{ m.monthName }}</strong></td>
                <td class="text-right">{{ m.clientCount }}</td>
                <td class="text-right">{{ m.subtotal | number:'1.0-0' }}</td>
                <td class="text-right" style="color:#dc2626">
                  @if (m.noveltyDiscounts > 0) {
                    -{{ m.noveltyDiscounts | number:'1.0-0' }}
                  } @else { <span style="color:#94a3b8">—</span> }
                </td>
                <td class="text-right">{{ m.taxAmount | number:'1.0-0' }}</td>
                <td class="text-right">
                  <strong style="color:var(--bp-primary)">
                    {{ m.total | number:'1.0-0' }}
                  </strong>
                </td>
                <td style="min-width:120px">
                  <div style="background:#e2e8f0;border-radius:4px;
                               height:6px;overflow:hidden">
                    <div [style.width]="barWidthGeneral(m.total) + '%'"
                         style="background:var(--bp-primary);height:100%;
                                border-radius:4px">
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Gráfico barras general -->
        <div class="bp-card">
          <h3 style="margin:0 0 1.25rem;color:var(--bp-primary);font-size:.95rem">
            <i class="pi pi-chart-bar" style="margin-right:.4rem"></i>
            Distribución Mensual {{ generalAnnual()!.year }}
          </h3>
          <div style="display:flex;align-items:flex-end;gap:.4rem;height:160px">
            @for (m of generalAnnual()!.monthlyTotals; track m.month) {
              <div style="flex:1;display:flex;flex-direction:column;
                           align-items:center;gap:.3rem">
                <div style="font-size:.62rem;color:#64748b;font-weight:600">
                  {{ m.total > 0
                    ? ((m.total/1000000) | number:'1.0-1') + 'M' : '' }}
                </div>
                <div [style.height]="barHeightGeneral(m.total) + 'px'"
                     style="width:100%;border-radius:6px 6px 0 0;
                            transition:height .5s ease;min-height:3px"
                     [style.background]="m.total > 0
                       ? 'linear-gradient(180deg,#3b82f6,#1e4078)'
                       : '#e2e8f0'">
                </div>
                <div style="font-size:.65rem;color:#64748b;text-align:center;
                             writing-mode:vertical-rl;transform:rotate(180deg);
                             height:45px">
                  {{ m.monthName.substring(0,3) }}
                </div>
              </div>
            }
          </div>
        </div>

      } @else if (!loading()) {
        <div class="bp-card" style="text-align:center;padding:3rem;color:#94a3b8">
          <i class="pi pi-chart-bar"
             style="font-size:3rem;margin-bottom:1rem;display:block"></i>
          <p style="font-size:1rem;font-weight:600">
            Reporte General Anual
          </p>
          <p style="font-size:.875rem">
            Selecciona el año para ver el consolidado de todos los clientes
          </p>
          <p style="font-size:.78rem;margin-top:.5rem;color:#cbd5e1">
            Solo incluye pre-facturas en estado APROBADO
          </p>
        </div>
      }
    }
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class BillingReportComponent implements OnInit {

  periodSummary = signal<PeriodSummary | null>(null);
  clientAnnual  = signal<ClientAnnualReport | null>(null);
  generalAnnual = signal<GeneralAnnualReport | null>(null);
  loading       = signal(false);

  vista            = 'mensual';
  year             = new Date().getFullYear();
  month            = new Date().getMonth() + 1;
  selectedClientId = '';

  clientOptions: { label: string; value: string }[] = [];

  yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { label: 'Enero',      value: 1  }, { label: 'Febrero',   value: 2  },
    { label: 'Marzo',      value: 3  }, { label: 'Abril',     value: 4  },
    { label: 'Mayo',       value: 5  }, { label: 'Junio',     value: 6  },
    { label: 'Julio',      value: 7  }, { label: 'Agosto',    value: 8  },
    { label: 'Septiembre', value: 9  }, { label: 'Octubre',   value: 10 },
    { label: 'Noviembre',  value: 11 }, { label: 'Diciembre', value: 12 }
  ];

  constructor(private http: HttpClient,
              private clientService: ClientService) {}

  ngOnInit() {
    this.clientService.findAll({ size: 100, status: 'ACTIVE' }).subscribe(r => {
      this.clientOptions = r.content.map(c => ({
        label: c.companyName, value: c.id
      }));
    });
  }

  cambiarVista(v: string) {
    this.vista = v;
    this.periodSummary.set(null);
    this.clientAnnual.set(null);
    this.generalAnnual.set(null);
  }

  loadMensual() {
    this.loading.set(true);
    const params = new HttpParams()
      .set('year', this.year).set('month', this.month);
    this.http.get<PeriodSummary>(
      `${environment.apiUrl}/reports/billing/period-summary`, { params }
    ).subscribe({
      next: r => { this.periodSummary.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadClienteAnual() {
    if (!this.selectedClientId) return;
    this.loading.set(true);
    const params = new HttpParams()
      .set('clientId', this.selectedClientId).set('year', this.year);
    this.http.get<ClientAnnualReport>(
      `${environment.apiUrl}/reports/billing/client-annual`, { params }
    ).subscribe({
      next: r => { this.clientAnnual.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadGeneral() {
    this.loading.set(true);
    const params = new HttpParams().set('year', this.year);
    this.http.get<GeneralAnnualReport>(
      `${environment.apiUrl}/reports/billing/general-annual`, { params }
    ).subscribe({
      next: r => { this.generalAnnual.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // Solo meses con datos reales
  mesesConDatos(): MonthSummary[] {
    return this.generalAnnual()?.monthlyTotals.filter(m => m.total > 0) ?? [];
  }

  // Totales mensual
  totalDevsMensual() {
    return this.periodSummary()?.clientResults
      .reduce((a, r) => a + r.lines.length, 0) ?? 0;
  }
  totalSubMensual() {
    return this.periodSummary()?.clientResults
      .reduce((a, r) => a + r.subtotal, 0) ?? 0;
  }
  totalDescMensual() {
    return this.periodSummary()?.clientResults
      .reduce((a, r) => a + r.totalNoveltyDiscounts, 0) ?? 0;
  }
  totalIvaMensual() {
    return this.periodSummary()?.clientResults
      .reduce((a, r) => a + r.taxAmount, 0) ?? 0;
  }

  // Barras cliente anual
  barWidthCliente(total: number): number {
    const max = Math.max(...(this.clientAnnual()?.months.map(m => m.total) ?? [1]));
    return max > 0 ? (total / max) * 100 : 0;
  }
  barHeightCliente(total: number): number {
    const max = Math.max(...(this.clientAnnual()?.months.map(m => m.total) ?? [1]));
    return max > 0 ? Math.max((total / max) * 130, total > 0 ? 4 : 2) : 2;
  }

  // Barras general
  barWidthGeneral(total: number): number {
    const max = Math.max(...(this.generalAnnual()?.monthlyTotals.map(m => m.total) ?? [1]));
    return max > 0 ? (total / max) * 100 : 0;
  }
  barHeightGeneral(total: number): number {
    const max = Math.max(...(this.generalAnnual()?.monthlyTotals.map(m => m.total) ?? [1]));
    return max > 0 ? Math.max((total / max) * 130, total > 0 ? 4 : 2) : 2;
  }

  // Participación % por cliente
  participacion(total: number): number {
    const grand = this.generalAnnual()?.grandTotal ?? 0;
    return grand > 0 ? (total / grand) * 100 : 0;
  }

  clamp(val: number): number {
    return Math.min(Math.max(val, 0), 100);
  }

  traducirTipo(t: string): string {
    const m: Record<string, string> = {
      MONTHLY: 'Mensual', DAILY: 'Diaria', HOURLY: 'Por Hora'
    };
    return m[t] ?? t;
  }

  mesNombre(m: number): string {
    return this.monthOptions[m - 1]?.label ?? '';
  }
}