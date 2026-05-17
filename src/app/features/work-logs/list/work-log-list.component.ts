import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WorkLogService } from '@core/services/worklog.service';
import { ClientService } from '@core/services/client.service';
import { DeveloperService } from '@core/services/developer.service';
import { WorkLog } from '@core/models';

@Component({
  selector: 'app-work-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, InputNumberModule, SelectModule, DialogModule,
            TextareaModule, ConfirmDialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Registros de Horas</h1>
      <p-button label="Registrar Horas" icon="pi pi-plus" (click)="openDialog()"/>
    </div>

    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
        <div style="min-width:200px">
          <label>Cliente</label>
          <p-select [(ngModel)]="clientFilter" [options]="clientOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Todos los clientes" [showClear]="true"
                    class="w-full" (onChange)="load()">
          </p-select>
        </div>
        <div>
          <label>Año</label>
          <p-select [(ngModel)]="yearFilter" [options]="yearOptions"
                    placeholder="Año" class="w-full" (onChange)="load()">
          </p-select>
        </div>
        <div>
          <label>Mes</label>
          <p-select [(ngModel)]="monthFilter" [options]="monthOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Mes" class="w-full" (onChange)="load()">
          </p-select>
        </div>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()"/>
      </div>
    </div>

    <div class="bp-card">
      <p-table [value]="workLogs()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Cliente</th>
            <th>Desarrollador</th>
            <th>Perfil</th>
            <th>Período</th>
            <th class="text-right">Horas Esperadas</th>
            <th class="text-right">Horas Trabajadas</th>
            <th class="text-right">Valor</th>
            <th>Estado</th>
            <th style="width:120px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-wl>
          <tr>
            <td>{{ wl.clientName }}</td>
            <td>{{ wl.developerName }}</td>
            <td>{{ wl.developerProfileName }}</td>
            <td>{{ monthName(wl.billingMonth) }} {{ wl.billingYear }}</td>
            <td class="text-right">{{ wl.expectedWorkingHours }}</td>
            <td class="text-right">{{ wl.actualWorkedHours }}</td>
            <td class="text-right">
              <strong>{{ wl.billableAmount | number:'1.0-0' }}</strong>
            </td>
            <td>
              <span [class]="'bp-badge ' + wl.status.toLowerCase()">
                {{ traducirEstado(wl.status) }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:.4rem">
                @if (wl.status === 'DRAFT') {
                  <p-button icon="pi pi-check" severity="success" size="small"
                            (click)="confirm(wl)" title="Confirmar registro"/>
                }
                @if (wl.status === 'DRAFT') {
                  <p-button icon="pi pi-pencil" severity="secondary" size="small"
                            (click)="openEdit(wl)" title="Editar"/>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron registros de horas
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog/>

    <p-dialog [(visible)]="showDialog"
              [header]="editingId ? 'Editar Registro de Horas' : 'Registrar Horas'"
              [modal]="true" [style]="{width:'620px'}">

      <!-- Aviso informativo -->
      <div style="margin-bottom:1rem;padding:.75rem 1rem;background:#f0f7ff;
                  border:1px solid #bfdbfe;border-radius:8px;font-size:.85rem">
        <i class="pi pi-info-circle" style="color:#1e4078;margin-right:.5rem"></i>
        Base estándar colombiana: <strong>168 horas / 21 días</strong> por mes.
        Solo registra si las horas acordadas con el cliente difieren del estándar.
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">

          <div class="field">
            <label>Cliente *</label>
            <p-select formControlName="clientId" [options]="clientOptions"
                      optionLabel="label" optionValue="value" class="w-full"
                      (onChange)="onClientChange()">
            </p-select>
          </div>

          <div class="field">
            <label>
              Desarrollador *
              <small class="text-muted" *ngIf="!form.value.clientId">
                — Selecciona un cliente primero
              </small>
            </label>
            <p-select formControlName="developerId" [options]="developerOptions"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Perfil *</label>
            <p-select formControlName="developerProfileId" [options]="profileOptions"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Año *</label>
            <p-select formControlName="billingYear" [options]="yearOptions"
                      class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Mes *</label>
            <p-select formControlName="billingMonth" [options]="monthOptions"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Días Hábiles *</label>
            <p-inputnumber formControlName="expectedWorkingDays"
                          [min]="1" [max]="31" class="w-full"/>
            <small class="text-muted">Estándar: 21 días</small>
          </div>

          <div class="field">
            <label>Horas Esperadas *</label>
            <p-inputnumber formControlName="expectedWorkingHours"
                          [minFractionDigits]="2" class="w-full"/>
            <small class="text-muted">Estándar: 168 horas</small>
          </div>

          <div class="field">
            <label>Horas Trabajadas *</label>
            <p-inputnumber formControlName="actualWorkedHours"
                          [minFractionDigits]="2" class="w-full"/>
          </div>

          <div class="field" style="grid-column:1/-1">
            <label>Observaciones</label>
            <textarea pTextarea formControlName="observations"
                      rows="2" class="w-full"
                      placeholder="Ej: Acuerdo especial con cliente por proyecto X"></textarea>
          </div>

        </div>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.25rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showDialog=false" type="button"/>
          <p-button [label]="editingId ? 'Guardar Cambios' : 'Registrar'"
                    icon="pi pi-check" type="submit"
                    [loading]="saving()" [disabled]="form.invalid"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class WorkLogListComponent implements OnInit {

  workLogs   = signal<WorkLog[]>([]);
  loading    = signal(false);
  saving     = signal(false);
  showDialog = false;
  editingId: string | null = null;

  clientFilter = '';
  yearFilter   = new Date().getFullYear();
  monthFilter  = '';

  clientOptions:    { label: string; value: string }[] = [];
  developerOptions: { label: string; value: string }[] = [];
  profileOptions:   { label: string; value: string }[] = [];

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
    clientId:             ['', Validators.required],
    developerId:          ['', Validators.required],
    developerProfileId:   ['', Validators.required],
    billingYear:          [new Date().getFullYear(), Validators.required],
    billingMonth:         [new Date().getMonth() + 1, Validators.required],
    expectedWorkingDays:  [21, Validators.required],
    expectedWorkingHours: [168, Validators.required],
    actualWorkedHours:    [168, Validators.required],
    observations:         ['']
  });

  constructor(private wlService: WorkLogService,
              private clientService: ClientService,
              private devService: DeveloperService,
              private confirmService: ConfirmationService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    this.clientService.findAll({ size: 100 }).subscribe(r =>
      this.clientOptions = r.content.map(c => ({ label: c.companyName, value: c.id })));
    this.devService.findAllProfiles().subscribe(p =>
      this.profileOptions = p.map(x => ({ label: x.name, value: x.id })));
  }

  load() {
    this.loading.set(true);
    this.wlService.findAll({
      clientId: this.clientFilter || undefined,
      year:     this.yearFilter   || undefined,
      month:    this.monthFilter  ? Number(this.monthFilter) : undefined
    }).subscribe({
      next: r => { this.workLogs.set(r.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onClientChange() {
    // Filtra developers por cliente seleccionado
    const clientId = this.form.value.clientId;
    this.form.patchValue({ developerId: '', developerProfileId: '' });
    this.developerOptions = [];

    if (!clientId) return;

    // Carga developers asignados al cliente
    this.devService.findAll({ size: 100 }).subscribe(r => {
      this.developerOptions = r.content.map(d => ({
        label: `${d.fullName} — ${d.profileName}`,
        value: d.id
      }));
    });
  }

  reset() { this.clientFilter = ''; this.monthFilter = ''; this.load(); }

  openDialog() {
    this.editingId = null;
    this.form.reset({
      billingYear:          new Date().getFullYear(),
      billingMonth:         new Date().getMonth() + 1,
      expectedWorkingDays:  21,
      expectedWorkingHours: 168,
      actualWorkedHours:    168
    });
    this.developerOptions = [];
    this.showDialog = true;
  }

  openEdit(wl: WorkLog) {
    this.editingId = wl.id;
    this.form.patchValue({
      clientId:             wl.clientId,
      developerId:          wl.developerId,
      developerProfileId:   wl.developerProfileId,
      billingYear:          wl.billingYear,
      billingMonth:         wl.billingMonth,
      expectedWorkingDays:  wl.expectedWorkingDays,
      expectedWorkingHours: wl.expectedWorkingHours,
      actualWorkedHours:    wl.actualWorkedHours,
      observations:         wl.observations
    });
    this.showDialog = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.wlService.create(this.form.value as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Registrado',
          detail: 'Registro creado. El valor es calculado por el servidor.'
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirm(wl: WorkLog) {
    this.confirmService.confirm({
      message: `¿Confirmar el registro de horas de "${wl.developerName}" para ${this.monthName(wl.billingMonth)} ${wl.billingYear}?`,
      header:  'Confirmar Registro',
      icon:    'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.wlService.confirm(wl.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success', summary: 'Confirmado',
              detail: 'Registro de horas confirmado exitosamente'
            });
            this.load();
          }
        });
      }
    });
  }

  traducirEstado(s: string): string {
    const map: Record<string, string> = {
      DRAFT:     'Borrador',
      CONFIRMED: 'Confirmado',
      BILLED:    'Facturado'
    };
    return map[s] ?? s;
  }

  monthName(m: number): string {
    return this.monthOptions[m - 1]?.label ?? '';
  }
}