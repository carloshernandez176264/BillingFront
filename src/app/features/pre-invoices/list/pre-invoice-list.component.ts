import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { PreInvoiceService } from '@core/services/preinvoice.service';
import { ClientService } from '@core/services/client.service';
import { PreInvoice } from '@core/models';

@Component({
  selector: 'app-pre-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, SelectModule],
  template: `
    <div class="bp-page-header">
      <h1>Pre-Facturas</h1>
      <a routerLink="/pre-invoices/generate" style="text-decoration:none">
        <p-button label="Generar" icon="pi pi-plus"/>
      </a>
    </div>

    <div class="bp-card mb-3">
      <div style="display:flex;gap:1rem;flex-wrap:wrap;">
        <p-select [(ngModel)]="clientFilter" [options]="clientOptions"
                  optionLabel="label" optionValue="value"
                  placeholder="Todos los clientes" [showClear]="true"
                  [style]="{'min-width': '220px'}" (onChange)="load()">
        </p-select>
        <p-select [(ngModel)]="statusFilter" [options]="statusOptions"
                  placeholder="Estado" [style]="{'min-width': '160px'}" (onChange)="load()">
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
            <th>Número</th><th>Cliente</th><th>Período</th>
            <th class="text-right">Total</th><th>Moneda</th>
            <th>Estado</th><th style="width:180px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-inv>
          <tr>
            <td><code>{{ inv.invoiceNumber }}</code></td>
            <td>{{ inv.clientName }}</td>
            <td>{{ inv.periodDescription }}</td>
            <td class="text-right"><strong>{{ inv.totalAmount | number:'1.2-2' }}</strong></td>
            <td>{{ inv.currencyCode }}</td>
            <td><span [class]="'bp-badge ' + inv.status.toLowerCase()">{{ traducirEstado(inv.status) }}</span></td>
            <td>
              <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                <a [routerLink]="['/pre-invoices', inv.id]" style="text-decoration:none">
                  <p-button icon="pi pi-eye" severity="secondary" size="small" title="Ver detalle"/>
                </a>
                <p-button icon="pi pi-file-pdf" severity="danger" size="small"
                          (click)="exportPdf(inv)" title="Exportar PDF"/>
                <p-button icon="pi pi-file-excel" severity="success" size="small"
                          (click)="exportExcel(inv)" title="Exportar Excel"/>
                @if (inv.status === 'GENERATED') {
                  <p-button icon="pi pi-send" severity="info" size="small"
                            (click)="send(inv)" title="Enviar al cliente"/>
                }
                @if (inv.status === 'GENERATED' || inv.status === 'SENT_TO_CLIENT') {
                  <p-button icon="pi pi-check" severity="success" size="small"
                            (click)="approve(inv)" title="Aprobar"/>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" style="text-align:center;padding:2rem;color:#64748b">
              No se encontraron pre-facturas
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class PreInvoiceListComponent implements OnInit {

  invoices = signal<PreInvoice[]>([]);
  loading  = signal(false);
  clientFilter = '';
  statusFilter = '';
  yearFilter   = new Date().getFullYear();

  clientOptions: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'Todos',    value: '' },
    { label: 'Borrador', value: 'DRAFT' },
    { label: 'Generada', value: 'GENERATED' },
    { label: 'Enviada',  value: 'SENT_TO_CLIENT' },
    { label: 'Aprobada', value: 'APPROVED' },
    { label: 'Rechazada',value: 'REJECTED' },
    { label: 'Cancelada',value: 'CANCELLED' }
  ];

  yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(private piService: PreInvoiceService,
              private clientService: ClientService,
              private messageService: MessageService) {}

  ngOnInit() {
    this.load();
    this.clientService.findAll({ size: 100 }).subscribe(r =>
      this.clientOptions = r.content.map(c => ({ label: c.companyName, value: c.id })));
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

  reset() { this.clientFilter = ''; this.statusFilter = ''; this.load(); }

  traducirEstado(status: string): string {
    const map: Record<string, string> = {
      DRAFT:          'Borrador',
      GENERATED:      'Generada',
      SENT_TO_CLIENT: 'Enviada',
      APPROVED:       'Aprobada',
      REJECTED:       'Rechazada',
      CANCELLED:      'Cancelada',
      INVOICED:       'Facturada'
    };
    return map[status] ?? status;
  }

  exportPdf(inv: PreInvoice) {
    this.piService.exportPdf(inv.id).subscribe(
      blob => this.download(blob, `${inv.invoiceNumber}.pdf`));
  }

  exportExcel(inv: PreInvoice) {
    this.piService.exportExcel(inv.id).subscribe(
      blob => this.download(blob, `${inv.invoiceNumber}.xlsx`));
  }

  send(inv: PreInvoice) {
    this.piService.sendToClient(inv.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Enviada',
          detail: 'Pre-factura enviada al cliente'
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
          detail: 'Pre-factura aprobada exitosamente'
        });
        this.load();
      }
    });
  }

  private download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}