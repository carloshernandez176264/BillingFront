import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DeveloperService } from '@core/services/developer.service';
import { AuthService } from '@core/services/auth.service';
import { Developer } from '@core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-developer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule,
            ButtonModule, InputTextModule, InputNumberModule, SelectModule,
            TagModule, ConfirmDialogModule, DialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Desarrolladores</h1>
      <p-button label="Nuevo Desarrollador" icon="pi pi-plus" (click)="openDialog()"/>
    </div>

    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <input pInputText [(ngModel)]="search"
               placeholder="Buscar nombre o documento..."
               style="flex:1;min-width:200px" (input)="onSearch()"/>
        <p-select [(ngModel)]="statusFilter" [options]="statusOptions"
                  placeholder="Estado" [style]="{'min-width':'160px'}"
                  (onChange)="load()">
        </p-select>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()"/>
      </div>
    </div>

    <div class="bp-card">
      <p-table [value]="developers()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" [totalRecords]="total()"
               [lazy]="true" (onLazyLoad)="onLazyLoad($event)"
               responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Documento</th>
            <th>Nombre Completo</th>
            <th>Perfil</th>
            <th>Fecha Ingreso</th>
            <th>Estado</th>
            @if (canSeeSalary()) {
              <th class="text-right">Salario Base</th>
            }
            <th style="width:120px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-d>
          <tr>
            <td><code>{{ d.documentId }}</code></td>
            <td>
              <strong>{{ d.fullName }}</strong>
              <div class="text-muted" style="font-size:.8rem">{{ d.email }}</div>
            </td>
            <td>{{ d.profileName }}</td>
            <td>{{ d.hireDate | date:'mediumDate' }}</td>
            <td>
              <span [class]="'bp-badge ' + d.status.toLowerCase()">
                {{ traducirEstado(d.status) }}
              </span>
            </td>
            @if (canSeeSalary()) {
              <td class="text-right">
                @if (d.baseSalary) {
                  <span style="font-weight:600;color:var(--bp-primary)">
                    {{ d.baseSalary | number:'1.0-0' }}
                  </span>
                } @else {
                  <span class="text-muted" style="font-size:.8rem">Sin registrar</span>
                }
              </td>
            }
            <td>
              <div style="display:flex;gap:.4rem">
                <p-button icon="pi pi-pencil" severity="secondary" size="small"
                          (click)="openEdit(d)" title="Editar"/>
                <p-button icon="pi pi-trash" severity="danger" size="small"
                          (click)="confirmDelete(d)" title="Desactivar"/>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron desarrolladores
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog/>

    <!-- Dialog crear / editar -->
    <p-dialog [(visible)]="showDialog"
              [header]="editingId ? 'Editar Desarrollador' : 'Nuevo Desarrollador'"
              [modal]="true" [style]="{width:'640px'}">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">

          <div class="field">
            <label>Número de Documento *</label>
            <input pInputText formControlName="documentId" class="w-full"/>
          </div>

          <div class="field">
            <label>Tipo de Documento *</label>
            <p-select formControlName="documentType" [options]="docTypes"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <div class="field" style="grid-column:1/-1">
            <label>Nombre Completo *</label>
            <input pInputText formControlName="fullName" class="w-full"/>
          </div>

          <div class="field">
            <label>Correo Electrónico</label>
            <input pInputText formControlName="email" type="email" class="w-full"/>
          </div>

          <div class="field">
            <label>Perfil *</label>
            <p-select formControlName="profileId" [options]="profileOptions"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <div class="field">
            <label>Fecha de Ingreso *</label>
            <input pInputText formControlName="hireDate" type="date" class="w-full"/>
          </div>

          <div class="field">
            <label>Estado</label>
            <p-select formControlName="status" [options]="statusFormOptions"
                      optionLabel="label" optionValue="value" class="w-full">
            </p-select>
          </div>

          <!-- Salario — solo visible para ADMIN y FINANCE -->
          @if (canSeeSalary()) {
            <div class="field">
              <label>
                Salario Base (COP)
                <span style="background:#fef3c7;color:#92400e;font-size:.7rem;
                             padding:.1rem .4rem;border-radius:4px;margin-left:.4rem">
                  CONFIDENCIAL
                </span>
              </label>
              <p-inputnumber formControlName="baseSalary"
                            [useGrouping]="true" mode="decimal"
                            placeholder="Ej: 5000000" class="w-full"/>
              @if (form.value.baseSalary) {
                <small class="text-muted">
                  Costo total c/cargas:
                  {{ (form.value.baseSalary * 1.5183) | number:'1.0-0' }} COP
                </small>
              }
            </div>
          }

        </div>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.25rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showDialog=false" type="button"/>
          <p-button [label]="editingId ? 'Guardar Cambios' : 'Crear'"
                    icon="pi pi-check" type="submit"
                    [loading]="saving()" [disabled]="form.invalid"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class DeveloperListComponent implements OnInit {

  developers = signal<Developer[]>([]);
  loading    = signal(false);
  saving     = signal(false);
  total      = signal(0);
  showDialog = false;
  editingId: string | null = null;
  search       = '';
  statusFilter = '';
  page         = 0;

  statusOptions = [
    { label: 'Todos',       value: '' },
    { label: 'Activo',      value: 'ACTIVE' },
    { label: 'Inactivo',    value: 'INACTIVE' },
    { label: 'En Licencia', value: 'ON_LEAVE' }
  ];

  statusFormOptions = [
    { label: 'Activo',      value: 'ACTIVE' },
    { label: 'Inactivo',    value: 'INACTIVE' },
    { label: 'En Licencia', value: 'ON_LEAVE' }
  ];

  docTypes = [
    { label: 'CC — Cédula de Ciudadanía', value: 'CC' },
    { label: 'CE — Cédula de Extranjería', value: 'CE' },
    { label: 'Pasaporte',                  value: 'PASSPORT' }
  ];

  profileOptions: { label: string; value: string }[] = [];

  form = this.fb.group({
    documentId:   ['', Validators.required],
    documentType: ['CC', Validators.required],
    fullName:     ['', Validators.required],
    email:        [''],
    profileId:    ['', Validators.required],
    hireDate:     ['', Validators.required],
    status:       ['ACTIVE'],
    baseSalary:   [null as number | null]
  });

  constructor(private devService: DeveloperService,
              private authService: AuthService,
              private http: HttpClient,
              private confirmService: ConfirmationService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    this.devService.findAllProfiles().subscribe(p => {
      this.profileOptions = p.map(x => ({ label: x.name, value: x.id }));
    });
  }

  canSeeSalary(): boolean {
    return this.authService.hasAnyRole('ADMIN', 'FINANCE');
  }

  load() {
    this.loading.set(true);
    this.devService.findAll({
      search: this.search || undefined,
      status: this.statusFilter || undefined,
      page:   this.page
    }).subscribe({
      next: r => {
        this.developers.set(r.content);
        this.total.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this._t);
    this._t = setTimeout(() => { this.page = 0; this.load(); }, 400);
  }
  private _t: any;

  onLazyLoad(e: any) { this.page = e.first / e.rows; this.load(); }
  reset() { this.search = ''; this.statusFilter = ''; this.load(); }

  openDialog() {
    this.editingId = null;
    this.form.reset({ documentType: 'CC', status: 'ACTIVE' });
    this.showDialog = true;
  }

  openEdit(d: any) {
    this.editingId = d.id;
    this.form.patchValue({
      documentId:   d.documentId,
      documentType: d.documentType,
      fullName:     d.fullName,
      email:        d.email,
      profileId:    d.profileId,
      hireDate:     d.hireDate,
      status:       d.status,
      baseSalary:   d.baseSalary ?? null
    });
    this.showDialog = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const req$ = this.editingId
      ? this.http.put<any>(
          `${environment.apiUrl}/developers/${this.editingId}`,
          this.form.value)
      : this.devService.create(this.form.value as any);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Éxito',
          detail: `Desarrollador ${this.editingId ? 'actualizado' : 'creado'} exitosamente`
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(d: Developer) {
    this.confirmService.confirm({
      message:      `¿Desactivar al desarrollador "${d.fullName}"?`,
      header:       'Confirmar desactivación',
      icon:         'pi pi-exclamation-triangle',
      acceptLabel:  'Sí, desactivar',
      rejectLabel:  'Cancelar',
      accept: () => {
        this.devService.deactivate(d.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success', summary: 'Listo',
              detail: 'Desarrollador desactivado'
            });
            this.load();
          }
        });
      }
    });
  }

  traducirEstado(s: string): string {
    const map: Record<string, string> = {
      ACTIVE:   'Activo',
      INACTIVE: 'Inactivo',
      ON_LEAVE: 'En Licencia'
    };
    return map[s] ?? s;
  }
}