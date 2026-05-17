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

    <!-- Filters -->
    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
        <div style="min-width:200px">
          <label>Cliente</label>
          <p-select [(ngModel)]="clientFilter" [options]="clientOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Todos los clientes" [showClear]="true" class="w-full"
                    (onChange)="load()"/>
        </div>
        <div>
          <label>Año</label>
          <p-select [(ngModel)]="yearFilter" [options]="yearOptions"
                    placeholder="Year" class="w-full" (onChange)="load()"/>
        </div>
        <div>
          <label>Mes</label>
          <p-select [(ngModel)]="monthFilter" [options]="monthOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Month" class="w-full" (onChange)="load()"/>
        </div>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()"/>
      </div>
    </div>

    <div class="bp-card">
      <p-table [value]="workLogs()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Cliente</th><th>Desarrollador</th><th>Profile</th>
            <th>Período</th><th class="text-right">Expected h</th>
            <th class="text-right">Actual h</th><th class="text-right">Amount</th>
            <th>Estado</th><th style="width:120px">Acciones</th>
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
            <td class="text-right"><strong>{{ wl.billableAmount | number:'1.2-2' }}</strong></td>
            <td><span [class]="'bp-badge ' + wl.status.toLowerCase()">{{ wl.status }}</span></td>
            <td>
              <div style="display:flex;gap:.4rem">
                @if (wl.status === 'DRAFT') {
                  <p-button icon="pi pi-check" severity="success" size="small"
                            (click)="confirm(wl)" title="Confirm"/>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" style="text-align:center;padding:2rem;color:#64748b">No se encontraron registros</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="showDialog" header="Registrar Horas"
              [modal]="true" [style]="{width:'600px'}">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div class="field">
            <label>Cliente *</label>
            <p-select formControlName="clientId" [options]="clientOptions"
                      optionLabel="label" optionValue="value" class="w-full"/>
          </div>
          <div class="field">
            <label>Desarrollador *</label>
            <p-select formControlName="developerId" [options]="developerOptions"
                      optionLabel="label" optionValue="value" class="w-full"/>
          </div>
          <div class="field">
            <label>Perfil *</label>
            <p-select formControlName="developerProfileId" [options]="profileOptions"
                      optionLabel="label" optionValue="value" class="w-full"/>
          </div>
          <div class="field">
            <label>Año *</label>
            <p-select formControlName="billingYear" [options]="yearOptions" class="w-full"/>
          </div>
          <div class="field">
            <label>Mes *</label>
            <p-select formControlName="billingMonth" [options]="monthOptions"
                      optionLabel="label" optionValue="value" class="w-full"/>
          </div>
          <div class="field">
            <label>Días Hábiles *</label>
            <p-inputnumber formControlName="expectedWorkingDays" [min]="1" [max]="31" class="w-full"/>
          </div>
          <div class="field">
            <label>Horas Esperadas *</label>
            <p-inputnumber formControlName="expectedWorkingHours" [minFractionDigits]="2" class="w-full"/>
          </div>
          <div class="field">
            <label>Horas Trabajadas *</label>
            <p-inputnumber formControlName="actualWorkedHours" [minFractionDigits]="2" class="w-full"/>
          </div>
          <div class="field" style="grid-column:1/-1">
            <label>Observaciones</label>
            <textarea pTextarea formControlName="observations" rows="2" class="w-full"></textarea>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <p-button label="Cancelar" severity="secondary" (click)="showDialog=false" type="button"/>
          <p-button label="Registrar" icon="pi pi-check" type="submit"
                    [loading]="saving()" [disabled]="form.invalid"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class WorkLogListComponent implements OnInit {

  workLogs = signal<WorkLog[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  showDialog = false;

  clientFilter  = '';
  yearFilter    = new Date().getFullYear();
  monthFilter   = '';

  clientOptions:   { label: string; value: string }[] = [];
  developerOptions:{ label: string; value: string }[] = [];
  profileOptions:  { label: string; value: string }[] = [];

  yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },   { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },     { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },{ label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },{ label: 'Diciembre', value: 12 }
  ];

  form = this.fb.group({
    clientId:              ['', Validators.required],
    developerId:           ['', Validators.required],
    developerProfileId:    ['', Validators.required],
    billingYear:           [new Date().getFullYear(), Validators.required],
    billingMonth:          [new Date().getMonth() + 1, Validators.required],
    expectedWorkingDays:   [22, Validators.required],
    expectedWorkingHours:  [176, Validators.required],
    actualWorkedHours:     [null, Validators.required],
    observations:          ['']
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
    this.devService.findAll({ size: 100 }).subscribe(r =>
      this.developerOptions = r.content.map(d => ({ label: d.fullName, value: d.id })));
    this.devService.findAllProfiles().subscribe(p =>
      this.profileOptions = p.map(x => ({ label: x.name, value: x.id })));
  }

  load() {
    this.loading.set(true);
    this.wlService.findAll({
      clientId: this.clientFilter || undefined,
      year:     this.yearFilter || undefined,
      month:    this.monthFilter ? Number(this.monthFilter) : undefined
    }).subscribe({
      next: r => { this.workLogs.set(r.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  reset() { this.clientFilter = ''; this.monthFilter = ''; this.load(); }
  openDialog() { this.form.reset({ billingYear: new Date().getFullYear(), billingMonth: new Date().getMonth() + 1, expectedWorkingDays: 22, expectedWorkingHours: 176 }); this.showDialog = true; }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.wlService.create(this.form.value as any).subscribe({
      next: () => {
        this.saving.set(false); this.showDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Registrado', detail: 'Registro creado. El valor es calculado por el servidor.' });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirm(wl: WorkLog) {
    this.wlService.confirm(wl.id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Confirmado', detail: 'Registro confirmado exitosamente' }); this.load(); }
    });
  }

  monthName(m: number) { return this.monthOptions[m - 1]?.label ?? ''; }
}
