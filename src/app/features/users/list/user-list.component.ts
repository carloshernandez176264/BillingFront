import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { User, PageResponse } from '@core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            InputTextModule, PasswordModule, SelectModule, DialogModule,
            TagModule, ConfirmDialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Usuarios de la Plataforma</h1>
      <p-button label="Nuevo Usuario" icon="pi pi-plus" (click)="openDialog()"/>
    </div>

    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <input pInputText [(ngModel)]="search" placeholder="Buscar por nombre o correo..."
               style="flex:1;min-width:200px" (input)="onSearch()"/>
        <p-select [(ngModel)]="statusFilter" [options]="statusOptions"
                  placeholder="Estado" [style]="{'min-width': '160px'}" (onChange)="load()"></p-select>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()"/>
      </div>
    </div>

    <div class="bp-card">
      <p-table [value]="users()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" [totalRecords]="total()"
               [lazy]="true" (onLazyLoad)="onLazyLoad($event)"
               responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Correo</th>
            <th>Nombre Completo</th>
            <th>Roles</th>
            <th>Estado</th>
            <th>Bloqueado</th>
            <th style="width:140px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-u>
          <tr>
            <td>{{ u.email }}</td>
            <td>{{ u.fullName }}</td>
            <td>
              @for (role of u.roles; track role) {
                <p-tag [value]="role" severity="info" styleClass="mr-1"/>
              }
            </td>
            <td>
              <span [class]="'bp-badge ' + u.status.toLowerCase()">{{ u.status }}</span>
            </td>
            <td>
              @if (u.locked) {
                <span class="bp-badge" style="background:#fee2e2;color:#b91c1c">
                  <i class="pi pi-lock" style="margin-right:.3rem"></i>Locked
                </span>
              } @else {
                <span style="color:#94a3b8;font-size:.85rem">—</span>
              }
            </td>
            <td>
              <div style="display:flex;gap:.4rem">
                @if (u.locked) {
                  <p-button icon="pi pi-lock-open" severity="warn" size="small"
                            (click)="unlock(u)" title="Unlock account"/>
                }
                <p-button icon="pi pi-trash" severity="danger" size="small"
                          (click)="confirmDeactivate(u)"/>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron usuarios
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Nuevo Usuario Dialog -->
    <p-dialog [(visible)]="showDialog" header="Nuevo Usuario de Plataforma"
              [modal]="true" [style]="{width:'520px'}">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="field mb-3">
          <label>Correo Electrónico *</label>
          <input pInputText formControlName="email" type="email" class="w-full"
                 placeholder="user@company.com"/>
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <small class="p-error">Ingresa un correo electrónico válido</small>
          }
        </div>

        <div class="field mb-3">
          <label>Nombre Completo *</label>
          <input pInputText formControlName="fullName" class="w-full"/>
        </div>

        <div class="field mb-3">
          <label>Password *</label>
          <p-password formControlName="password" styleClass="w-full"
                      [toggleMask]="true" [feedback]="true"
                      placeholder="Mín. 8 caracteres, mayúscula+minúscula+número+especial"/>
          @if (form.get('password')?.invalid && form.get('password')?.touched) {
            <small class="p-error">La contraseña debe tener mínimo 8 caracteres</small>
          }
        </div>

        <div class="field mb-3">
          <label>Roles *</label>
          <p-select formControlName="roleId" [options]="roleOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Selecciona un rol" class="w-full"/>
          <small class="text-muted">El usuario tendrá este rol asignado</small>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1.25rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showDialog=false" type="button"/>
          <p-button label="Create User" icon="pi pi-check" type="submit"
                    [loading]="saving()"
                    [disabled]="form.invalid || saving()"/>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: .4rem; }
    label  { font-weight: 600; font-size: .875rem; }
  `]
})
export class UserListComponent implements OnInit {

  users   = signal<User[]>([]);
  loading = signal(false);
  saving  = signal(false);
  total   = signal(0);

  search       = '';
  statusFilter = '';
  page         = 0;
  pageSize     = 20;
  showDialog   = false;

  statusOptions = [
    { label: 'Todos',       value: '' },
    { label: 'Activo',    value: 'ACTIVE' },
    { label: 'Inactivo',  value: 'INACTIVE' },
    { label: 'Bloqueado',   value: 'BLOCKED' },
    { label: 'Suspendido', value: 'SUSPENDED' }
  ];

  roleOptions: { label: string; value: string }[] = [];

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    fullName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleId:   ['', Validators.required]
  });

  constructor(private http: HttpClient,
              private confirmService: ConfirmationService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    this.loadRoles();
  }

  load() {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', this.page)
      .set('size', this.pageSize);
    if (this.search)       params = params.set('search', this.search);
    if (this.statusFilter) params = params.set('status', this.statusFilter);

    this.http.get<PageResponse<User>>(`${environment.apiUrl}/users`, { params })
      .subscribe({
        next: r => {
          this.users.set(r.content);
          this.total.set(r.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  loadRoles() {
    this.http.get<any[]>(`${environment.apiUrl}/roles`).subscribe({
      next: roles => {
        this.roleOptions = roles.map(r => ({ label: r.name, value: r.id }));
      },
      error: () => {
        // fallback if roles endpoint not exposed
        this.roleOptions = [
          { label: 'ADMIN',         value: 'admin' },
          { label: 'FINANCE',       value: 'finance' },
          { label: 'MANAGER',       value: 'manager' },
          { label: 'CLIENT_VIEWER', value: 'viewer' },
          { label: 'AUDITOR',       value: 'auditor' }
        ];
      }
    });
  }

  onSearch() {
    clearTimeout(this._t);
    this._t = setTimeout(() => { this.page = 0; this.load(); }, 400);
  }
  private _t: any;

  onLazyLoad(event: any) {
    this.page     = event.first / event.rows;
    this.pageSize = event.rows;
    this.load();
  }

  reset() { this.search = ''; this.statusFilter = ''; this.page = 0; this.load(); }

  openDialog() {
    this.form.reset();
    this.showDialog = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { email, fullName, password, roleId } = this.form.value;
    const body = { email, fullName, password, roleIds: [roleId] };

    this.http.post<User>(`${environment.apiUrl}/users`, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Usuario Creado',
          detail: `Usuario ${email} creado. Debe cambiar la contraseña en el primer ingreso.`
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  unlock(user: User) {
    this.http.post<void>(`${environment.apiUrl}/users/${user.id}/unlock`, {})
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success', summary: 'Desbloqueado',
            detail: `Cuenta ${user.email} desbloqueada`
          });
          this.load();
        }
      });
  }

  confirmDeactivate(user: User) {
    this.confirmService.confirm({
      message: `¿Desactivar usuario "${user.email}"?`,
      header: 'Confirmar Desactivación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete<void>(`${environment.apiUrl}/users/${user.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success', summary: 'Desactivado',
              detail: 'Usuario desactivado'
            });
            this.load();
          }
        });
      }
    });
  }
}
