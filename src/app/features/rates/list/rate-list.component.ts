import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RateService } from '@core/services/rate.service';
import { ClientService } from '@core/services/client.service';
import { DeveloperService } from '@core/services/developer.service';
import { CurrencyService } from '@core/services/currency.service';
import { Rate } from '@core/models';

@Component({
  selector: 'app-rate-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, InputNumberModule, SelectModule, TagModule,
            DialogModule, ToggleSwitchModule, ConfirmDialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Tarifas de Facturación</h1>
      <p-button label="Nueva Tarifa" icon="pi pi-plus" (click)="openDialog()"/>
    </div>

    <div class="bp-card">
      <p-table [value]="rates()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Cliente</th><th>Perfil</th><th>Type</th><th>Valor</th>
            <th>Moneda</th><th>Vigente Desde</th><th>Vigente Hasta</th>
            <th>Estado</th><th style="width:80px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-r>
          <tr>
            <td>{{ r.clientName ?? '(Base rate)' }}</td>
            <td>{{ r.developerProfileName }}</td>
            <td><p-tag [value]="r.rateType" severity="info"/></td>
            <td class="text-right"><strong>{{ getRateValue(r) | number:'1.2-2' }}</strong></td>
            <td>{{ r.currencyCode }}</td>
            <td>{{ r.validFrom | date:'mediumDate' }}</td>
            <td>{{ r.validUntil ? (r.validUntil | date:'mediumDate') : '—' }}</td>
            <td><span [class]="'bp-badge ' + r.status.toLowerCase()">{{ r.status }}</span></td>
            <td>
              <p-button icon="pi pi-trash" severity="danger" size="small"
                        (click)="confirmDelete(r)"/>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" style="text-align:center;padding:2rem;color:#64748b">No se encontraron tarifas</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Nueva Tarifa Dialog -->
    <p-dialog [(visible)]="showDialog" header="Nueva Tarifa de Facturación"
              [modal]="true" [style]="{width:'650px'}">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">

          <div class="field">
            <label>Cliente (opcional — blank = base rate)</label>
            <p-select formControlName="clientId" [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Todos los clientes" [showClear]="true" class="w-full"/>
          </div>

          <div class="field">
            <label>Perfil de Desarrollador *</label>
            <p-select formControlName="developerProfileId" [options]="profileOptions"
                      optionLabel="label" optionValue="value" class="w-full"/>
          </div>

          <div class="field">
            <label>Moneda *</label>
            <p-select formControlName="currencyId" [options]="currencyOptions"
                      optionLabel="label" optionValue="value" class="w-full"/>
          </div>

          <div class="field">
            <label>Tipo de Tarifa *</label>
            <p-select formControlName="rateType" [options]="rateTypeOptions"
                      optionLabel="label" optionValue="value" class="w-full" (onChange)="onRateTypeChange()"/>
          </div>

          @if (form.value.rateType === 'MONTHLY') {
            <div class="field" style="grid-column:1/-1">
              <label>Tarifa Mensual *</label>
              <p-inputnumber formControlName="monthlyRate" mode="decimal"
                            [minFractionDigits]="2" class="w-full"/>
            </div>
          }
          @if (form.value.rateType === 'DAILY') {
            <div class="field" style="grid-column:1/-1">
              <label>Tarifa Diaria *</label>
              <p-inputnumber formControlName="dailyRate" mode="decimal"
                            [minFractionDigits]="2" class="w-full"/>
            </div>
          }
          @if (form.value.rateType === 'HOURLY') {
            <div class="field" style="grid-column:1/-1">
              <label>Tarifa por Hora *</label>
              <p-inputnumber formControlName="hourlyRate" mode="decimal"
                            [minFractionDigits]="2" class="w-full"/>
            </div>
          }

          <div class="field">
            <label>Vigente Desde *</label>
            <input pInputText formControlName="validFrom" type="date" class="w-full"/>
          </div>

          <div class="field">
            <label>Vigente Hasta (opcional)</label>
            <input pInputText formControlName="validUntil" type="date" class="w-full"/>
          </div>

          <div class="field">
            <label>Horas Laborales/Día</label>
            <p-inputnumber formControlName="workingHoursPerDay" [min]="1" [max]="24"
                          [minFractionDigits]="1" class="w-full"/>
          </div>

          <div class="field">
            <label>Descuento %</label>
            <p-inputnumber formControlName="discountPercentage" [min]="0" [max]="100"
                          suffix="%" class="w-full"/>
          </div>

        </div>
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <p-button label="Cancelar" severity="secondary" (click)="showDialog=false" type="button"/>
          <p-button label="Crear Tarifa" icon="pi pi-check" type="submit"
                    [loading]="saving()" [disabled]="form.invalid"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class RateListComponent implements OnInit {

  rates   = signal<Rate[]>([]);
  loading = signal(false);
  saving  = signal(false);
  showDialog = false;

  clientOptions:  { label: string; value: string }[] = [];
  profileOptions: { label: string; value: string }[] = [];
  currencyOptions:{ label: string; value: string }[] = [];

  rateTypeOptions = [
    { label: 'Mensual', value: 'MONTHLY' },
    { label: 'Diaria',   value: 'DAILY' },
    { label: 'Por Hora',  value: 'HOURLY' }
  ];

  form = this.fb.group({
    clientId:           [null],
    developerProfileId: ['', Validators.required],
    currencyId:         ['', Validators.required],
    rateType:           ['MONTHLY', Validators.required],
    monthlyRate:        [null],
    dailyRate:          [null],
    hourlyRate:         [null],
    validFrom:          ['', Validators.required],
    validUntil:         [null],
    workingHoursPerDay: [8],
    discountPercentage: [0],
    includesTax:        [false]
  });

  constructor(private rateService: RateService,
              private clientService: ClientService,
              private devService: DeveloperService,
              private currencyService: CurrencyService,
              private confirmService: ConfirmationService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    this.clientService.findAll({ size: 100 }).subscribe(r =>
      this.clientOptions = r.content.map(c => ({ label: c.companyName, value: c.id })));
    this.devService.findAllProfiles().subscribe(p =>
      this.profileOptions = p.map(x => ({ label: x.name, value: x.id })));
    this.currencyService.findAll().subscribe(c =>
      this.currencyOptions = c.map(x => ({ label: `${x.code} — ${x.name}`, value: x.id })));
  }

  load() {
    this.loading.set(true);
    this.rateService.findAll({}).subscribe({
      next: r => { this.rates.set(r.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openDialog() { this.form.reset({ rateType: 'MONTHLY', workingHoursPerDay: 8, discountPercentage: 0, includesTax: false }); this.showDialog = true; }

  onRateTypeChange() {
    this.form.patchValue({ monthlyRate: null, dailyRate: null, hourlyRate: null });
  }

  getRateValue(r: Rate) {
    return r.monthlyRate ?? r.dailyRate ?? r.hourlyRate ?? 0;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.rateService.create(this.form.value as any).subscribe({
      next: () => {
        this.saving.set(false); this.showDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Tarifa creada' });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(r: Rate) {
    this.confirmService.confirm({
      message: `Deactivate this rate for "${r.developerProfileName}"?`,
      accept: () => {
        this.rateService.deactivate(r.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Tarifa desactivada' }); this.load(); }
        });
      }
    });
  }
}
