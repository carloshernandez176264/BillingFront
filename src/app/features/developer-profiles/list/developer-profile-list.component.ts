import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DeveloperService } from '@core/services/developer.service';
import { DeveloperProfile } from '@core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-developer-profile-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, InputNumberModule, ConfirmDialogModule, DialogModule,
            TextareaModule, SelectModule],
  template: `
    <div class="bp-page-header">
      <h1>Perfiles de Desarrollador</h1>
      <p-button label="Nuevo Perfil" icon="pi pi-plus" (click)="openDialog()"/>
    </div>

    <!-- Tabla perfiles con tarifas base -->
    <div class="bp-card mb-3">
      <p-table [value]="profiles()" [loading]="loading()" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Nombre</th>
            <th>Nivel</th>
            <th>Descripción</th>
            <th class="text-right">Tarifa Base/Mes</th>
            <th class="text-right">Valor Día (÷21)</th>
            <th class="text-right">Valor Hora (÷168)</th>
            <th style="width:120px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td><strong>{{ p.name }}</strong></td>
            <td>
              <span [class]="'bp-badge ' + nivelClass(p.level)">{{ p.level }}</span>
            </td>
            <td>{{ p.description }}</td>
            <td class="text-right">
              @if (p.baseMonthlyRate) {
                <strong style="color:var(--bp-primary)">
                  {{ p.baseMonthlyRate | number:'1.0-0' }}
                </strong>
              } @else {
                <span class="text-muted">Sin definir</span>
              }
            </td>
            <td class="text-right">
              @if (p.baseMonthlyRate) {
                {{ (p.baseMonthlyRate / 21) | number:'1.0-0' }}
              } @else { — }
            </td>
            <td class="text-right">
              @if (p.baseMonthlyRate) {
                {{ (p.baseMonthlyRate / 168) | number:'1.0-0' }}
              } @else { — }
            </td>
            <td>
              <div style="display:flex;gap:.4rem">
                <p-button icon="pi pi-pencil" severity="secondary" size="small"
                          (click)="openEdit(p)"/>
                <p-button icon="pi pi-trash" severity="danger" size="small"
                          (click)="confirmDelete(p)"/>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron perfiles
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Comparativo tarifas base vs cliente -->
    @if (rateComparison().length > 0) {
      <div class="bp-card">
        <h3 style="margin:0 0 1rem;color:var(--bp-primary)">
          <i class="pi pi-chart-bar" style="margin-right:.5rem"></i>
          Comparativo Tarifas Base vs Cliente
        </h3>
        <p-table [value]="rateComparison()" dataKey="profileId">
          <ng-template pTemplate="header">
            <tr>
              <th>Perfil</th>
              <th>Cliente</th>
              <th class="text-right">Tarifa Base</th>
              <th class="text-right">Tarifa Cliente</th>
              <th class="text-right">Descuento $</th>
              <th class="text-right">Descuento %</th>
              <th>Indicador</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td><strong>{{ r.profileName }}</strong></td>
              <td>{{ r.clientName }}</td>
              <td class="text-right">{{ r.baseRate | number:'1.0-0' }}</td>
              <td class="text-right">{{ r.clientRate | number:'1.0-0' }}</td>
              <td class="text-right" style="color:#dc2626">
                -{{ r.discountAmount | number:'1.0-0' }}
              </td>
              <td class="text-right">
                <strong [style.color]="discountColor(r.discountPct)">
                  {{ r.discountPct | number:'1.1-1' }}%
                </strong>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:.5rem">
                  <div style="flex:1;background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                    <div [style.width]="r.discountPct + '%'"
                         [style.background]="discountColor(r.discountPct)"
                         style="height:100%;border-radius:4px;transition:width .3s">
                    </div>
                  </div>
                  <span style="font-size:.75rem;min-width:35px">
                    {{ r.discountPct | number:'1.0-0' }}%
                  </span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <p-confirmDialog/>

    <!-- Dialog crear/editar perfil -->
    <p-dialog [(visible)]="showDialog"
              [header]="editingId ? 'Editar Perfil' : 'Nuevo Perfil de Desarrollador'"
              [modal]="true" [style]="{width:'560px'}">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">

          <div class="field" style="grid-column:1/-1">
            <label>Nombre *</label>
            <input pInputText formControlName="name" class="w-full"
                   placeholder="Ej: Desarrollador Senior"/>
          </div>

          <div class="field">
            <label>Nivel</label>
            <p-select formControlName="level" [options]="levelOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona nivel" class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Tarifa Base Mensual (COP)</label>
            <p-inputnumber formControlName="baseMonthlyRate"
                          [useGrouping]="true" mode="decimal"
                          placeholder="Ej: 18000000" class="w-full"/>
            @if (form.value.baseMonthlyRate) {
              <small class="text-muted">
                Día: {{ (form.value.baseMonthlyRate / 21) | number:'1.0-0' }} —
                Hora: {{ (form.value.baseMonthlyRate / 168) | number:'1.0-0' }}
              </small>
            }
          </div>

          <div class="field" style="grid-column:1/-1">
            <label>Descripción</label>
            <textarea pTextarea formControlName="description"
                      rows="2" class="w-full"></textarea>
          </div>

          <div class="field" style="grid-column:1/-1">
            <label>Habilidades Base</label>
            <textarea pTextarea formControlName="baseSkills"
                      rows="2" class="w-full"
                      placeholder="Ej: Java, Spring Boot, SQL..."></textarea>
          </div>

        </div>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.25rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showDialog=false" type="button"/>
          <p-button [label]="editingId ? 'Guardar Cambios' : 'Crear Perfil'"
                    icon="pi pi-check" type="submit"
                    [loading]="saving()" [disabled]="form.invalid"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class DeveloperProfileListComponent implements OnInit {

  profiles       = signal<any[]>([]);
  rateComparison = signal<any[]>([]);
  loading        = signal(false);
  saving         = signal(false);
  showDialog     = false;
  editingId: string | null = null;

  levelOptions = [
    { label: 'Junior',    value: 'JUNIOR' },
    { label: 'Mid',       value: 'MID' },
    { label: 'Senior',    value: 'SENIOR' },
    { label: 'Lead',      value: 'LEAD' },
    { label: 'Principal', value: 'PRINCIPAL' }
  ];

  form = this.fb.group({
    name:            ['', Validators.required],
    level:           [''],
    description:     [''],
    baseSkills:      [''],
    baseMonthlyRate: [null as number | null]
  });

  constructor(private devService: DeveloperService,
              private http: HttpClient,
              private confirmService: ConfirmationService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    this.loadRateComparison();
  }

  load() {
    this.loading.set(true);
    this.devService.findAllProfiles().subscribe({
      next: r => { this.profiles.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadRateComparison() {
    // Carga tarifas y calcula descuento vs base del perfil
    this.http.get<any>(`${environment.apiUrl}/rates?size=100`).subscribe({
      next: r => {
        const rates = r.content.filter((rate: any) => rate.clientId && rate.monthlyRate);
        const comparison = rates.map((rate: any) => {
          const profile = this.profiles().find(p => p.id === rate.developerProfileId);
          const baseRate = profile?.baseMonthlyRate ?? 0;
          const clientRate = rate.monthlyRate ?? 0;
          const discountAmount = baseRate - clientRate;
          const discountPct = baseRate > 0
            ? (discountAmount / baseRate) * 100 : 0;
          return {
            profileId:      rate.developerProfileId,
            profileName:    rate.developerProfileName,
            clientName:     rate.clientName,
            baseRate,
            clientRate,
            discountAmount,
            discountPct
          };
        }).filter((r: any) => r.baseRate > 0);
        this.rateComparison.set(comparison);
      }
    });
  }

  openDialog() {
    this.editingId = null;
    this.form.reset();
    this.showDialog = true;
  }

  openEdit(p: any) {
    this.editingId = p.id;
    this.form.patchValue({
      name:            p.name,
      level:           p.level,
      description:     p.description,
      baseSkills:      p.baseSkills,
      baseMonthlyRate: p.baseMonthlyRate
    });
    this.showDialog = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const req$ = this.editingId
      ? this.http.put<any>(
          `${environment.apiUrl}/developer-profiles/${this.editingId}`,
          this.form.value)
      : this.http.post<any>(
          `${environment.apiUrl}/developer-profiles`,
          this.form.value);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Éxito',
          detail: `Perfil ${this.editingId ? 'actualizado' : 'creado'} exitosamente`
        });
        this.load();
        this.loadRateComparison();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(p: DeveloperProfile) {
    this.confirmService.confirm({
      message: `¿Desactivar el perfil "${p.name}"?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/developer-profiles/${p.id}`)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success', summary: 'Listo',
                detail: 'Perfil desactivado'
              });
              this.load();
            }
          });
      }
    });
  }

  nivelClass(level: string): string {
    const map: Record<string, string> = {
      JUNIOR: 'pending', MID: 'generated',
      SENIOR: 'approved', LEAD: 'invoiced', PRINCIPAL: 'sent'
    };
    return map[level] ?? 'draft';
  }

  discountColor(pct: number): string {
    if (pct <= 10) return '#059669';  // verde — descuento bajo
    if (pct <= 20) return '#d97706';  // naranja — descuento medio
    return '#dc2626';                  // rojo — descuento alto
  }
}