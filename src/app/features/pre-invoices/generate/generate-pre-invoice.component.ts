import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { PreInvoiceService } from '@core/services/preinvoice.service';
import { ClientService } from '@core/services/client.service';
import { CurrencyService } from '@core/services/currency.service';
import { BillingCalculationResult } from '@core/models';

@Component({
  selector: 'app-generate-pre-invoice',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonModule,
            SelectModule, TextareaModule, TableModule],
  template: `
    <div class="bp-page-header">
      <h1>Generar Pre-Factura</h1>
      <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" routerLink="/pre-invoices"/>
    </div>

    <div style="display:grid;grid-template-columns:380px 1fr;gap:1.5rem;align-items:start;">

      <!-- Left: Form -->
      <div class="bp-card">
        <h3 style="margin:0 0 1.25rem;color:var(--bp-primary)">Parámetros</h3>
        <form [formGroup]="form" (ngSubmit)="preview()">
          <div class="field mb-3">
            <label>Cliente *</label>
            <p-select formControlName="clientId" [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el cliente" class="w-full"/>
          </div>
          <div class="field mb-3">
            <label>Moneda *</label>
            <p-select formControlName="currencyId" [options]="currencyOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona la moneda" class="w-full"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;" class="mb-3">
            <div class="field">
              <label>Año *</label>
              <p-select formControlName="billingYear" [options]="yearOptions" class="w-full"/>
            </div>
            <div class="field">
              <label>Mes *</label>
              <p-select formControlName="billingMonth" [options]="monthOptions"
                        optionLabel="label" optionValue="value" class="w-full"/>
            </div>
          </div>
          <div class="field mb-3">
            <label>Observaciones</label>
            <textarea pTextarea formControlName="observations" rows="3" class="w-full"></textarea>
          </div>
          <p-button label="Vista Previa del Cálculo" icon="pi pi-calculator" type="submit"
                    styleClass="w-full" [loading]="previewing()" [disabled]="form.invalid"/>
        </form>
      </div>

      <!-- Right: Preview -->
      <div class="bp-card" *ngIf="preview$()">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h3 style="margin:0;color:var(--bp-primary)">Vista Previa de Facturación</h3>
          <p-button label="Generar Pre-Factura" icon="pi pi-file-pdf"
                    (click)="generate()" [loading]="generating()"/>
        </div>

        <p-table [value]="preview$()!.lines" dataKey="workLogId">
          <ng-template pTemplate="header">
            <tr>
              <th>Desarrollador</th><th>Perfil</th><th>Type</th>
              <th class="text-right">Horas</th><th class="text-right">Bruto</th>
              <th class="text-right">Descuento</th><th class="text-right">Neto</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td>{{ l.developerName }}</td>
              <td>{{ l.profileName }}</td>
              <td>{{ l.rateType }}</td>
              <td class="text-right">{{ l.billedHours | number:'1.2-2' }}</td>
              <td class="text-right">{{ l.grossAmount | number:'1.2-2' }}</td>
              <td class="text-right" style="color:#dc2626">{{ l.noveltyDiscount | number:'1.2-2' }}</td>
              <td class="text-right"><strong>{{ l.netAmount | number:'1.2-2' }}</strong></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr style="background:#f8fafc">
              <td colspan="4"></td>
              <td class="text-right"><strong>{{ preview$()!.subtotal | number:'1.2-2' }}</strong></td>
              <td class="text-right" style="color:#dc2626"><strong>{{ preview$()!.totalNoveltyDiscounts | number:'1.2-2' }}</strong></td>
              <td class="text-right" style="color:var(--bp-primary);font-size:1.05rem"><strong>{{ preview$()!.totalAmount | number:'1.2-2' }}</strong></td>
            </tr>
          </ng-template>
        </p-table>

        <div style="display:flex;justify-content:flex-end;margin-top:1rem">
          <div class="bp-card" style="min-width:260px;background:#f8fafc;">
            <table style="width:100%;font-size:.9rem">
              <tr><td>Subtotal</td><td class="text-right">{{ preview$()!.subtotal | number:'1.2-2' }}</td></tr>
              <tr><td>Descuentos por Novedad</td><td class="text-right" style="color:#dc2626">-{{ preview$()!.totalNoveltyDiscounts | number:'1.2-2' }}</td></tr>
              <tr><td>Base Gravable</td><td class="text-right">{{ preview$()!.taxableAmount | number:'1.2-2' }}</td></tr>
              <tr><td>Tax</td><td class="text-right">{{ preview$()!.taxAmount | number:'1.2-2' }}</td></tr>
              <tr style="font-size:1.1rem;font-weight:700;border-top:2px solid var(--bp-border)">
                <td style="padding-top:.5rem">TOTAL</td>
                <td class="text-right" style="padding-top:.5rem;color:var(--bp-primary)">{{ preview$()!.totalAmount | number:'1.2-2' }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <div class="bp-card" *ngIf="!preview$()">
        <div style="text-align:center;padding:3rem;color:#94a3b8">
          <i class="pi pi-calculator" style="font-size:3rem;margin-bottom:1rem;display:block"></i>
          <p>Select parameters and click "Vista Previa del Cálculo" to see the billing breakdown.</p>
          <p style="font-size:.85rem">Todos los valores son calculados en el servidor.</p>
        </div>
      </div>
    </div>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class GeneratePreInvoiceComponent implements OnInit {

  form!: FormGroup;
  preview$   = signal<BillingCalculationResult | null>(null);
  previewing = signal(false);
  generating = signal(false);

  clientOptions:  { label: string; value: string }[] = [];
  currencyOptions:{ label: string; value: string }[] = [];
  yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 },
    { label: 'March', value: 3 },   { label: 'April', value: 4 },
    { label: 'Mayo', value: 5 },     { label: 'June', value: 6 },
    { label: 'July', value: 7 },    { label: 'August', value: 8 },
    { label: 'September', value: 9 },{ label: 'October', value: 10 },
    { label: 'November', value: 11 },{ label: 'December', value: 12 }
  ];

  constructor(private fb: FormBuilder,
              private piService: PreInvoiceService,
              private clientService: ClientService,
              private currencyService: CurrencyService,
              private messageService: MessageService,
              private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      clientId:     ['', Validators.required],
      currencyId:   ['', Validators.required],
      billingYear:  [new Date().getFullYear(), Validators.required],
      billingMonth: [new Date().getMonth() + 1, Validators.required],
      observations: ['']
    });
    this.clientService.findAll({ size: 100 }).subscribe(r =>
      this.clientOptions = r.content.map(c => ({ label: c.companyName, value: c.id })));
    this.currencyService.findAll().subscribe(c =>
      this.currencyOptions = c.map(x => ({ label: `${x.code} — ${x.name}`, value: x.id })));
  }

  preview() {
    if (this.form.invalid) return;
    const { clientId, billingYear, billingMonth } = this.form.value;
    this.previewing.set(true);
    this.piService.calculate(clientId, billingYear, billingMonth).subscribe({
      next: r => { this.preview$.set(r); this.previewing.set(false); },
      error: () => this.previewing.set(false)
    });
  }

  generate() {
    if (this.form.invalid) return;
    this.generating.set(true);
    this.piService.generate(this.form.value).subscribe({
      next: inv => {
        this.generating.set(false);
        this.messageService.add({ severity: 'success', summary: 'Generada', detail: `Pre-factura ${inv.invoiceNumber} creada` });
        this.router.navigate(['/pre-invoices', inv.id]);
      },
      error: () => this.generating.set(false)
    });
  }
}
