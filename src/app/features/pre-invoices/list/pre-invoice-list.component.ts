import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { PreInvoiceService } from '@core/services/preinvoice.service';
import { ClientService } from '@core/services/client.service';
import { PreInvoice } from '@core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-pre-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule,
            SelectModule, DialogModule, TextareaModule, ConfirmDialogModule],
  template: `
    <div class="bp-page-header">
      <h1>Pre-Facturas</h1>
      <a routerLink="/pre-invoices/generate" style="text-decoration:none">
        <p-button label="Nueva Pre-Factura" icon="pi pi-plus"/>
      </a>
    </div>

    <!-- Filtros -->
    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <p-select [(ngModel)]="clientFilter" [options]="clientOptions"
                  optionLabel="label" optionValue="value"
                  placeholder="Todos los clientes" [showClear]="true"
                  [style]="{'min-width':'220px'}" (onChange)="load()">
        </p-select>
        <p-select [(ngModel)]="statusFilter" [options]="statusOptions"
                  placeholder="Estado" [style]="{'min-width':'160px'}"
                  (onChange)="load()">
        </p-select>
        <p-select [(ngModel)]="yearFilter" [options]="yearOptions"
                  placeholder="Año" (onChange)="load()">
        </p-select>
        <p-button icon="pi pi-refresh" severity="secondary" (click)="reset()"/>
      </div>
    </div>

    <div class="bp-card">
      <p-table [value]="invoices()" [loading]="loading()" dataKey="id"
               [paginator]="true" [rows]="20" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Período</th>
            <th class="text-right">Total</th>
            <th>Moneda</th>
            <th>Estado</th>
            <th style="width:200px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-inv>
          <tr>
            <td>
              <code style="color:var(--bp-primary);font-weight:600">
                {{ inv.invoiceNumber }}
              </code>
            </td>
            <td>{{ inv.clientName }}</td>
            <td>{{ inv.periodDescription }}</td>
            <td class="text-right">
              <strong>{{ inv.totalAmount | number:'1.0-0' }}</strong>
            </td>
            <td>{{ inv.currencyCode }}</td>
            <td>
              <span [class]="'bp-badge ' + inv.status.toLowerCase()">
                {{ traducirEstado(inv.status) }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:.3rem;flex-wrap:wrap">

                <!-- Ver detalle -->
                <a [routerLink]="['/pre-invoices', inv.id]"
                   style="text-decoration:none">
                  <p-button icon="pi pi-eye" severity="secondary"
                            size="small" title="Ver detalle"/>
                </a>

                <!-- Enviar al cliente -->
                @if (inv.status === 'GENERATED') {
                  <p-button icon="pi pi-send" severity="info" size="small"
                            (click)="send(inv)" title="Enviar al cliente"/>
                }

                <!-- Aprobar -->
                @if (inv.status === 'GENERATED' ||
                     inv.status === 'SENT_TO_CLIENT') {
                  <p-button icon="pi pi-check" severity="success" size="small"
                            (click)="approve(inv)" title="Aprobar"/>
                }

                <!-- Rechazar -->
                @if (inv.status === 'GENERATED' ||
                     inv.status === 'SENT_TO_CLIENT') {
                  <p-button icon="pi pi-times" severity="warn" size="small"
                            (click)="openReject(inv)" title="Rechazar"/>
                }

                <!-- Cancelar -->
                @if (inv.status !== 'CANCELLED' &&
                     inv.status !== 'INVOICED' &&
                     inv.status !== 'APPROVED') {
                  <p-button icon="pi pi-ban" severity="danger" size="small"
                            (click)="openCancel(inv)" title="Cancelar"/>
                }

                <!-- Eliminar (solo DRAFT o CANCELLED) -->
                @if (inv.status === 'DRAFT' || inv.status === 'CANCELLED') {
                  <p-button icon="pi pi-trash" severity="danger" size="small"
                            (click)="confirmDelete(inv)" title="Eliminar"/>
                }

              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7"
                style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron pre-facturas
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog/>

    <!-- Dialog rechazar -->
    <p-dialog [(visible)]="showRejectDialog"
              header="Rechazar Pre-Factura" [modal]="true"
              [style]="{width:'450px'}">
      <div class="field mb-3">
        <label style="font-weight:600;font-size:.875rem;
                       display:block;margin-bottom:.4rem">
          Motivo del rechazo *
        </label>
        <textarea pTextarea [(ngModel)]="rejectReason" rows="3"
                  class="w-full"
                  placeholder="Describe el motivo del rechazo...">
        </textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;
                   gap:.5rem;margin-top:1rem">
        <p-button label="Cancelar" severity="secondary"
                  (click)="showRejectDialog=false" type="button"/>
        <p-button label="Rechazar" icon="pi pi-times" severity="warn"
                  [loading]="saving()"
                  [disabled]="!rejectReason.trim() || saving()"
                  (click)="rejectConfirm()"/>
      </div>
    </p-dialog>

    <!-- Dialog cancelar -->
    <p-dialog [(visible)]="showCancelDialog"
              header="Cancelar Pre-Factura" [modal]="true"
              [style]="{width:'450px'}">
      <div style="margin-bottom:1rem;padding:.75rem;background:#fef3c7;
                   border:1px solid #fde68a;border-radius:8px;
                   font-size:.875rem">
        <i class="pi pi-exclamation-triangle"
           style="color:#d97706;margin-right:.5rem"></i>
        Esta acción cancelará la pre-factura
        <strong>{{ selectedInvoice?.invoiceNumber }}</strong>.
        No podrá ser reactivada.
      </div>
      <div class="field mb-3">
        <label style="font-weight:600;font-size:.875rem;
                       display:block;margin-bottom:.4rem">
          Motivo de cancelación *
        </label>
        <textarea pTextarea [(ngModel)]="cancelReason" rows="3"
                  class="w-full"
                  placeholder="Describe el motivo de la cancelación...">
        </textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;
                   gap:.5rem;margin-top:1rem">
        <p-button label="Volver" severity="secondary"
                  (click)="showCancelDialog=false" type="button"/>
        <p-button label="Cancelar Pre-Factura" icon="pi pi-ban"
                  severity="danger" [loading]="saving()"
                  [disabled]="!cancelReason.trim() || saving()"
                  (click)="cancelConfirm()"/>
      </div>
    </p-dialog>
  `
})
export class PreInvoiceListComponent implements OnInit {

  invoices = signal<PreInvoice[]>([]);
  loading  = signal(false);
  saving   = signal(false);

  clientFilter = '';
  statusFilter = '';
  yearFilter   = new Date().getFullYear();

  showRejectDialog = false;
  showCancelDialog = false;
  selectedInvoice: PreInvoice | null = null;
  rejectReason = '';
  cancelReason = '';

  clientOptions: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'Todos',     value: '' },
    { label: 'Borrador',  value: 'DRAFT' },
    { label: 'Generada',  value: 'GENERATED' },
    { label: 'Enviada',   value: 'SENT_TO_CLIENT' },
    { label: 'Aprobada',  value: 'APPROVED' },
    { label: 'Rechazada', value: 'REJECTED' },
    { label: 'Cancelada', value: 'CANCELLED' },
    { label: 'Facturada', value: 'INVOICED' }
  ];

  yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(private piService: PreInvoiceService,
              private clientService: ClientService,
              private messageService: MessageService,
              private confirmService: ConfirmationService,
              private http: HttpClient) {}

  ngOnInit() {
    this.load();
    this.clientService.findAll({ size: 100 }).subscribe(r =>
      this.clientOptions = r.content.map(c => ({
        label: c.companyName, value: c.id
      })));
  }

  load() {
    this.loading.set(true);
    this.piService.findAll({
      clientId: this.clientFilter || undefined,
      status:   this.statusFilter || undefined,
      year:     this.yearFilter
    }).subscribe({
      next: r => { this.invoices.set(r.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  reset() {
    this.clientFilter = '';
    this.statusFilter = '';
    this.load();
  }

  send(inv: PreInvoice) {
    this.piService.sendToClient(inv.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Enviada',
          detail: `Pre-factura ${inv.invoiceNumber} enviada al cliente`
        });
        this.load();
      }
    });
  }

  approve(inv: PreInvoice) {
    this.piService.approve(inv.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Aprobada',
          detail: `Pre-factura ${inv.invoiceNumber} aprobada exitosamente`
        });
        this.load();
      }
    });
  }

  openReject(inv: PreInvoice) {
    this.selectedInvoice = inv;
    this.rejectReason    = '';
    this.showRejectDialog = true;
  }

  rejectConfirm() {
    if (!this.selectedInvoice || !this.rejectReason.trim()) return;
    this.saving.set(true);
    this.http.post<any>(
      `${environment.apiUrl}/pre-invoices/${this.selectedInvoice.id}/reject`,
      {},
      { params: { reason: this.rejectReason } }
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showRejectDialog = false;
        this.messageService.add({
          severity: 'warn', summary: 'Rechazada',
          detail: `Pre-factura ${this.selectedInvoice!.invoiceNumber} rechazada`
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  openCancel(inv: PreInvoice) {
    this.selectedInvoice = inv;
    this.cancelReason    = '';
    this.showCancelDialog = true;
  }

  cancelConfirm() {
    if (!this.selectedInvoice || !this.cancelReason.trim()) return;
    this.saving.set(true);
    this.http.post<any>(
      `${environment.apiUrl}/pre-invoices/${this.selectedInvoice.id}/cancel`,
      {},
      { params: { reason: this.cancelReason } }
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCancelDialog = false;
        this.messageService.add({
          severity: 'warn', summary: 'Cancelada',
          detail: `Pre-factura ${this.selectedInvoice!.invoiceNumber} cancelada`
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(inv: PreInvoice) {
    this.confirmService.confirm({
      message: `¿Eliminar definitivamente la pre-factura
                <strong>${inv.invoiceNumber}</strong>?
                <br><small style="color:#dc2626">
                Esta acción no se puede deshacer.</small>`,
      header:      'Confirmar Eliminación',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(
          `${environment.apiUrl}/pre-invoices/${inv.id}`
        ).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success', summary: 'Eliminada',
              detail: `Pre-factura ${inv.invoiceNumber} eliminada`
            });
            this.load();
          }
        });
      }
    });
  }

  traducirEstado(status: string): string {
    const map: Record<string, string> = {
      DRAFT:          'Borrador',
      GENERATED:      'Generada',
      SENT_TO_CLIENT: 'Enviada al Cliente',
      APPROVED:       'Aprobada',
      REJECTED:       'Rechazada',
      CANCELLED:      'Cancelada',
      INVOICED:       'Facturada'
    };
    return map[status] ?? status;
  }
}