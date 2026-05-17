import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { PreInvoiceService } from '@core/services/preinvoice.service';
import { PreInvoice } from '@core/models';

@Component({
  selector: 'app-pre-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule],
  template: `
    <div class="bp-page-header">
      <h1>Pre-Invoice {{ invoice()?.invoiceNumber }}</h1>
      <div style="display:flex;gap:.5rem">
        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" routerLink="/pre-invoices"/>
        <p-button label="Exportar PDF"   icon="pi pi-file-pdf"   severity="danger"  (click)="exportPdf()"/>
        <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (click)="exportExcel()"/>
      </div>
    </div>

    <ng-container *ngIf="invoice() as inv">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
        <div class="bp-card">
          <h4 style="color:var(--bp-primary);margin:0 0 1rem">Cliente</h4>
          <p><strong>{{ inv.clientName }}</strong></p>
          <p class="text-muted">Tax ID: {{ inv.clientTaxId }}</p>
          <p class="text-muted">{{ inv.clientBillingEmail }}</p>
        </div>
        <div class="bp-card">
          <h4 style="color:var(--bp-primary);margin:0 0 1rem">Detalle de Factura</h4>
          <p>Período: <strong>{{ inv.periodDescription }}</strong></p>
          <p>Moneda: <strong>{{ inv.currencyCode }}</strong></p>
          <p>Estado: <span [class]="'bp-badge ' + inv.status.toLowerCase()">{{ inv.status }}</span></p>
          <p>Generada: {{ inv.generationDate | date:'mediumDate' }}</p>
        </div>
      </div>

      <div class="bp-card mb-3">
        <p-table [value]="inv.items" dataKey="id">
          <ng-template pTemplate="header">
            <tr>
              <th>Desarrollador</th><th>Perfil</th><th>Rate</th>
              <th class="text-right">Horas</th><th class="text-right">Bruto</th>
              <th class="text-right">Descuento</th><th class="text-right">Neto</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.developerName }}</td>
              <td>{{ item.developerProfileName }}</td>
              <td>{{ item.rateType }} — {{ item.rateValue | number:'1.2-2' }}</td>
              <td class="text-right">{{ item.billedHours | number:'1.2-2' }}</td>
              <td class="text-right">{{ item.grossAmount | number:'1.2-2' }}</td>
              <td class="text-right" style="color:#dc2626">{{ item.noveltyDiscount | number:'1.2-2' }}</td>
              <td class="text-right"><strong>{{ item.netAmount | number:'1.2-2' }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <div class="bp-card" style="min-width:300px;background:#f8fafc">
          <table style="width:100%">
            <tr><td>Subtotal</td><td class="text-right">{{ inv.currencySymbol }} {{ inv.subtotal | number:'1.2-2' }}</td></tr>
            <tr><td>Novedades</td><td class="text-right" style="color:#dc2626">-{{ inv.totalNoveltyDiscounts | number:'1.2-2' }}</td></tr>
            <tr><td>Base Gravable</td><td class="text-right">{{ inv.taxableAmount | number:'1.2-2' }}</td></tr>
            <tr><td>Tax</td><td class="text-right">{{ inv.taxAmount | number:'1.2-2' }}</td></tr>
            <tr style="font-size:1.15rem;font-weight:700;border-top:2px solid var(--bp-border)">
              <td style="padding-top:.75rem">TOTAL</td>
              <td class="text-right" style="padding-top:.75rem;color:var(--bp-primary)">
                {{ inv.currencySymbol }} {{ inv.totalAmount | number:'1.2-2' }}
              </td>
            </tr>
          </table>
        </div>
      </div>
    </ng-container>
  `
})
export class PreInvoiceDetailComponent implements OnInit {

  @Input() id!: string;
  invoice = signal<PreInvoice | null>(null);

  constructor(private piService: PreInvoiceService,
              private messageService: MessageService) {}

  ngOnInit() {
    this.piService.findById(this.id).subscribe(inv => this.invoice.set(inv));
  }

  exportPdf() {
    const inv = this.invoice();
    if (!inv) return;
    this.piService.exportPdf(inv.id).subscribe(blob => this.download(blob, `${inv.invoiceNumber}.pdf`));
  }

  exportExcel() {
    const inv = this.invoice();
    if (!inv) return;
    this.piService.exportExcel(inv.id).subscribe(blob => this.download(blob, `${inv.invoiceNumber}.xlsx`));
  }

  private download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
