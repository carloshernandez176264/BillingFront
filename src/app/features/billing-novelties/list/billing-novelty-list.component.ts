import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { environment } from '@env/environment';
import { BillingNovelty } from '@core/models';
import { ClientService } from '@core/services/client.service';

interface DeveloperOption {
  label: string;
  value: string;
  profileName: string;
}

@Component({
  selector: 'app-billing-novelty-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            SelectModule, InputNumberModule, DialogModule, TextareaModule],
  template: `
    <div class="bp-page-header">
      <h1>Novedades de Nómina</h1>
      <p-button label="Nueva Novedad" icon="pi pi-plus" (click)="openDialog()"/>
    </div>

    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <p-select [(ngModel)]="statusFilter" [options]="statusOptions"
                  placeholder="Estado de aprobación" (onChange)="load()"
                  [style]="{'min-width':'200px'}">
        </p-select>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()"/>
      </div>
    </div>

    <div class="bp-card">
      <p-table [value]="novelties()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Desarrollador</th><th>Cliente</th><th>Tipo</th><th>Unidad</th>
            <th class="text-right">Días</th><th class="text-right">Horas</th>
            <th class="text-right">Descuento</th><th>Período</th>
            <th>Estado</th><th style="width:100px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-n>
          <tr>
            <td>{{ n.developerName }}</td>
            <td>{{ n.clientName }}</td>
            <td>{{ traducirTipo(n.noveltyType) }}</td>
            <td>{{ traducirUnidad(n.unitType) }}</td>
            <td class="text-right">{{ n.affectedDays }}</td>
            <td class="text-right">{{ n.affectedHours }}</td>
            <td class="text-right">
              <strong>{{ n.calculatedDiscount | number:'1.2-2' }}</strong>
            </td>
            <td>{{ mesNombre(n.billingMonth) }} {{ n.billingYear }}</td>
            <td>
              <span [class]="'bp-badge ' + n.approvalStatus.toLowerCase()">
                {{ traducirEstado(n.approvalStatus) }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:.3rem">
                @if (n.approvalStatus === 'PENDING') {
                  <p-button icon="pi pi-check" severity="success" size="small"
                            (click)="approve(n)" title="Aprobar"/>
                  <p-button icon="pi pi-times" severity="danger" size="small"
                            (click)="reject(n)" title="Rechazar"/>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="10" style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron novedades
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Dialog Nueva Novedad -->
    <p-dialog [(visible)]="showDialog" header="Nueva Novedad de Nómina"
              [modal]="true" [style]="{width:'700px'}">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">

          <!-- 1. Cliente -->
          <div class="field" style="grid-column:1/-1">
            <label>Cliente *</label>
            <p-select formControlName="clientId" [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el cliente" class="w-full"
                      (onChange)="onClientChange()">
            </p-select>
          </div>

          <!-- 2. Desarrollador (filtrado por cliente vía asignaciones) -->
          <div class="field" style="grid-column:1/-1">
            <label>
              Desarrollador *
              <small class="text-muted" *ngIf="!form.value.clientId">
                — Selecciona un cliente primero
              </small>
              <small class="text-muted"
                     *ngIf="form.value.clientId && developerOptions.length === 0 && !loadingDevelopers">
                — Sin desarrolladores asignados a este cliente
              </small>
              <small class="text-muted" *ngIf="loadingDevelopers">
                — Cargando...
              </small>
            </label>
            <p-select formControlName="developerId" [options]="developerOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el desarrollador"
                      class="w-full">
            </p-select>
          </div>

          <!-- 3. Año y Mes -->
          <div class="field">
            <label>Año *</label>
            <p-select formControlName="billingYear" [options]="yearOptions"
                      class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Mes *</label>
            <p-select formControlName="billingMonth" [options]="monthOptions"
                      optionLabel="label" optionValue="value"
                      class="w-full">
            </p-select>
          </div>

          <!-- 4. Tipo de Novedad -->
          <div class="field">
            <label>Tipo de Novedad *</label>
            <p-select formControlName="noveltyType" [options]="noveltyTypes"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <!-- 5. Unidad -->
          <div class="field">
            <label>Unidad *</label>
            <p-select formControlName="unitType" [options]="unitTypes"
                      optionLabel="label" optionValue="value"
                      class="w-full" (onChange)="onUnitTypeChange()">
            </p-select>
          </div>

          <!-- 6. Días afectados -->
          @if (form.value.unitType === 'DAYS' || form.value.unitType === 'BOTH') {
            <div class="field">
              <label>Días Afectados</label>
              <p-inputnumber formControlName="affectedDays"
                            [minFractionDigits]="1" [min]="0" class="w-full"/>
            </div>
          }

          <!-- 7. Horas afectadas -->
          @if (form.value.unitType === 'HOURS' || form.value.unitType === 'BOTH') {
            <div class="field">
              <label>Horas Afectadas</label>
              <p-inputnumber formControlName="affectedHours"
                            [minFractionDigits]="2" [min]="0" class="w-full"/>
            </div>
          }

          <!-- 8. Descuento manual -->
          <div class="field">
            <label>Descuento Manual (opcional)</label>
            <p-inputnumber formControlName="manualDiscountValue"
                          [minFractionDigits]="2" [min]="0"
                          placeholder="Se calcula automáticamente" class="w-full"/>
            <small class="text-muted">
              Si no ingresa, el servidor calcula con la tarifa vigente
            </small>
          </div>

          <!-- Info -->
          <div style="grid-column:1/-1;padding:.75rem 1rem;background:#f0f7ff;
                      border:1px solid #bfdbfe;border-radius:6px;font-size:.875rem">
            <i class="pi pi-info-circle" style="color:#1e4078;margin-right:.5rem"></i>
            El descuento se calcula automáticamente con la tarifa vigente del desarrollador
            para el período seleccionado. Solo use el campo manual si requiere un valor diferente.
          </div>

          <!-- 9. Observaciones -->
          <div class="field" style="grid-column:1/-1">
            <label>Observaciones</label>
            <textarea pTextarea formControlName="observations" rows="2"
                      class="w-full"
                      placeholder="Descripción de la novedad..."></textarea>
          </div>

        </div>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.25rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showDialog=false" type="button"/>
          <p-button label="Crear Novedad" icon="pi pi-check" type="submit"
                    [loading]="saving()"
                    [disabled]="form.invalid || saving()"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class BillingNoveltyListComponent implements OnInit {

  novelties         = signal<BillingNovelty[]>([]);
  loading           = signal(false);
  saving            = signal(false);
  showDialog        = false;
  statusFilter      = '';
  loadingDevelopers = false;

  clientOptions:    { label: string; value: string }[]  = [];
  developerOptions: DeveloperOption[]                   = [];

  statusOptions = [
    { label: 'Todas',     value: '' },
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Aprobada',  value: 'APPROVED' },
    { label: 'Rechazada', value: 'REJECTED' }
  ];

  noveltyTypes = [
    { label: 'Incapacidad',            value: 'SICK_LEAVE' },
    { label: 'Vacaciones',             value: 'VACATION' },
    { label: 'Calamidad Doméstica',    value: 'FAMILY_CALAMITY' },
    { label: 'Permiso',                value: 'PERMISSION' },
    { label: 'Ausencia Justificada',   value: 'JUSTIFIED_ABSENCE' },
    { label: 'Ausencia Injustificada', value: 'UNJUSTIFIED_ABSENCE' },
    { label: 'Licencia',               value: 'LICENSE' },
    { label: 'Suspensión',             value: 'SUSPENSION' },
    { label: 'Descuento Manual',       value: 'MANUAL_DISCOUNT' },
    { label: 'Otro Ajuste',            value: 'OTHER_ADJUSTMENT' }
  ];

  unitTypes = [
    { label: 'Días',  value: 'DAYS' },
    { label: 'Horas', value: 'HOURS' },
    { label: 'Ambos', value: 'BOTH' }
  ];

  yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { label: 'Enero',      value: 1  }, { label: 'Febrero',   value: 2  },
    { label: 'Marzo',      value: 3  }, { label: 'Abril',     value: 4  },
    { label: 'Mayo',       value: 5  }, { label: 'Junio',     value: 6  },
    { label: 'Julio',      value: 7  }, { label: 'Agosto',    value: 8  },
    { label: 'Septiembre', value: 9  }, { label: 'Octubre',   value: 10 },
    { label: 'Noviembre',  value: 11 }, { label: 'Diciembre', value: 12 }
  ];

  form = this.fb.group({
    clientId:            ['', Validators.required],
    developerId:         ['', Validators.required],
    billingYear:         [new Date().getFullYear(), Validators.required],
    billingMonth:        [new Date().getMonth() + 1, Validators.required],
    noveltyType:         ['SICK_LEAVE', Validators.required],
    unitType:            ['DAYS', Validators.required],
    affectedDays:        [0],
    affectedHours:       [0],
    manualDiscountValue: [null as number | null],
    observations:        ['']
  });

  constructor(private http: HttpClient,
              private clientService: ClientService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    this.clientService.findAll({ size: 100, status: 'ACTIVE' }).subscribe(r => {
      this.clientOptions = r.content.map(c => ({
        label: `${c.taxId} — ${c.companyName}`,
        value: c.id
      }));
    });
  }

  load() {
    this.loading.set(true);
    const params: any = { page: 0, size: 50 };
    if (this.statusFilter) params.approvalStatus = this.statusFilter;
    this.http.get<any>(`${environment.apiUrl}/billing-novelties`, { params }).subscribe({
      next: r => { this.novelties.set(r.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  reset() { this.statusFilter = ''; this.load(); }

  openDialog() {
    this.form.reset({
      noveltyType:  'SICK_LEAVE',
      unitType:     'DAYS',
      billingYear:  new Date().getFullYear(),
      billingMonth: new Date().getMonth() + 1,
      affectedDays:  0,
      affectedHours: 0
    });
    this.developerOptions = [];
    this.showDialog = true;
  }

  onClientChange() {
    this.form.patchValue({ developerId: '' });
    this.developerOptions = [];
    const clientId = this.form.value.clientId;
    if (!clientId) return;

    this.loadingDevelopers = true;
    this.http.get<any[]>(`${environment.apiUrl}/clients/${clientId}/developers`)
      .subscribe({
        next: r => {
          this.loadingDevelopers = false;
          this.developerOptions  = r.map(a => ({
            label:       `${a.developerName} — ${a.profileName}`,
            value:       a.developerId,
            profileName: a.profileName
          }));
        },
        error: () => { this.loadingDevelopers = false; }
      });
  }

  onUnitTypeChange() {
    const ut = this.form.value.unitType;
    if (ut === 'DAYS')  this.form.patchValue({ affectedHours: 0 });
    if (ut === 'HOURS') this.form.patchValue({ affectedDays:  0 });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;

    const body = {
      workLogId:           null,
      developerId:         v.developerId,
      clientId:            v.clientId,
      noveltyType:         v.noveltyType,
      unitType:            v.unitType,
      affectedDays:        v.affectedDays  ?? 0,
      affectedHours:       v.affectedHours ?? 0,
      manualDiscountValue: v.manualDiscountValue ?? null,
      billingYear:         v.billingYear,
      billingMonth:        v.billingMonth,
      observations:        v.observations
    };

    this.http.post<BillingNovelty>(`${environment.apiUrl}/billing-novelties`, body)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showDialog = false;
          this.messageService.add({
            severity: 'success', summary: 'Creada',
            detail: 'Novedad creada. El descuento fue calculado automáticamente con la tarifa vigente.'
          });
          this.load();
        },
        error: () => this.saving.set(false)
      });
  }

  approve(n: BillingNovelty) {
    this.http.post<any>(
      `${environment.apiUrl}/billing-novelties/${n.id}/approve`, {}
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Aprobada',
          detail: 'Novedad aprobada — se descontará en la próxima pre-factura'
        });
        this.load();
      }
    });
  }

  reject(n: BillingNovelty) {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    this.http.post<any>(
      `${environment.apiUrl}/billing-novelties/${n.id}/reject`, {},
      { params: { reason } }
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'warn', summary: 'Rechazada',
          detail: 'Novedad rechazada'
        });
        this.load();
      }
    });
  }

  traducirTipo(t: string): string {
    const m: Record<string, string> = {
      SICK_LEAVE: 'Incapacidad', VACATION: 'Vacaciones',
      FAMILY_CALAMITY: 'Calamidad Dom.', PERMISSION: 'Permiso',
      JUSTIFIED_ABSENCE: 'Aus. Justificada', UNJUSTIFIED_ABSENCE: 'Aus. Injustificada',
      LICENSE: 'Licencia', SUSPENSION: 'Suspensión',
      MANUAL_DISCOUNT: 'Desc. Manual', OTHER_ADJUSTMENT: 'Otro Ajuste'
    };
    return m[t] ?? t;
  }

  traducirUnidad(u: string): string {
    return u === 'DAYS' ? 'Días' : u === 'HOURS' ? 'Horas' : 'Ambos';
  }

  traducirEstado(s: string): string {
    return s === 'PENDING' ? 'Pendiente' : s === 'APPROVED' ? 'Aprobada' : 'Rechazada';
  }

  mesNombre(m: number): string {
    return this.monthOptions[m - 1]?.label ?? '';
  }
}