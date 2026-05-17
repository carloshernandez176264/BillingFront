import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientService } from '@core/services/client.service';
import { Client } from '@core/models';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
            InputTextModule, SelectModule, TagModule, ConfirmDialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Clientes</h1>
      <p-button label="Nuevo Cliente" icon="pi pi-plus" routerLink="/clients/new"/>
    </div>

    <!-- Filters -->
    <div class="bp-card mb-3">
      <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:1; min-width:200px;">
          <label>Buscar</label>
          <input pInputText [(ngModel)]="search" placeholder="Nombre o NIT..."
                 class="w-full" (input)="onSearch()"/>
        </div>
        <div style="min-width:180px;">
          <label>Estado</label>
          <p-select [(ngModel)]="statusFilter" [options]="statusOptions"
                    placeholder="Todos" class="w-full" (onChange)="load()"/>
        </div>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()" label="Limpiar"/>
      </div>
    </div>

    <!-- Table -->
    <div class="bp-card">
      <p-table [value]="clients()" [loading]="loading()" dataKey="id"
               [rows]="pageSize" [totalRecords]="totalElements()"
               [lazy]="true" (onLazyLoad)="onLazyLoad($event)"
               [paginator]="true" [rowsPerPageOptions]="[10,20,50]"
               responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>NIT</th>
            <th>Razón Social</th>
            <th>País</th>
            <th>Moneda</th>
            <th>Estado</th>
            <th style="width:120px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-c>
          <tr>
            <td><code>{{ c.taxId }}</code></td>
            <td>
              <strong>{{ c.companyName }}</strong>
              <div *ngIf="c.tradeName" class="text-muted" style="font-size:.8rem">{{ c.tradeName }}</div>
            </td>
            <td>{{ c.country }}</td>
            <td><p-tag [value]="c.primaryCurrencyCode" severity="info"/></td>
            <td><span [class]="'bp-badge ' + c.status.toLowerCase()">{{ estadoCliente(c.status) }}</span></td>
            <td>
              <div style="display:flex;gap:.4rem">
                <p-button icon="pi pi-pencil" severity="secondary" size="small"
                          [routerLink]="['/clients', c.id, 'edit']"/>
                <p-button icon="pi pi-trash"  severity="danger"    size="small"
                          (click)="confirmDelete(c)"/>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b">No se encontraron clientes</td></tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class ClientListComponent implements OnInit {

  clients       = signal<Client[]>([]);
  loading       = signal(false);
  totalElements = signal(0);

  search       = '';
  statusFilter = '';
  pageSize     = 20;
  currentPage  = 0;

  statusOptions = [
    { label: 'Todos',      value: '' },
    { label: 'Activo',     value: 'ACTIVE' },
    { label: 'Inactivo',   value: 'INACTIVE' },
    { label: 'Suspendido', value: 'SUSPENDED' }
  ];

  constructor(private clientService: ClientService,
              private confirmService: ConfirmationService,
              private messageService: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.clientService.findAll({
      search: this.search || undefined,
      status: this.statusFilter || undefined,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: res => {
        this.clients.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => { this.currentPage = 0; this.load(); }, 400);
  }
  private _searchTimer: any;

  onLazyLoad(event: any) {
    this.currentPage = event.first / event.rows;
    this.pageSize    = event.rows;
    this.load();
  }

  reset() { this.search = ''; this.statusFilter = ''; this.currentPage = 0; this.load(); }

  estadoCliente(status: string): string {
    const map: any = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' };
    return map[status] ?? status;
  }

  confirmDelete(client: Client) {
    this.confirmService.confirm({
      message: `¿Desactivar el cliente "${client.companyName}"?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.clientService.deactivate(client.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Cliente desactivado' });
            this.load();
          }
        });
      }
    });
  }
}
