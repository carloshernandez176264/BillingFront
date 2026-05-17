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
      <a routerLink="/pre-invoices" style="text-decoration:none">
        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary"/>
      </a>
    </div>

    <div style="display:grid;grid-template-columns:380px 1fr;gap:1.5rem;align-items:start;">

      <!-- Parámetros -->
      <div class="bp-card">
        <h3 style="margin:0 0 1.25rem;color:var(--bp-primary)">Parámetros</h3>
        <form [formGroup]="form" (ngSubmit)="calcularPrevia()">
          <div class="field mb-3">
            <label>Cliente *</label>
            <p-select formControlName="clientId" [options]="clientOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona el cliente" class="w-full">
            </p-select>
          </div>

          <div class="field mb-3">
            <label>Moneda *</label>
            <p-select formControlName="currencyId" [options]="currencyOptions"
                      optionLabel="label" optionValue="value"
                      placeholder="Selecciona la moneda" class="w-full">
            </p-select>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;" class="mb-3">
            <div class="field">
              <label>Año *</label>
              <p-select formControlName="billingYear" [options]="yearOptions"
                        class="w-full">
              </p-select>
            </div>
            <div class="field">
              <label>Mes *</label>
              <p-select formControlName="billingMonth" [options]="monthOptions"
                        optionLabel="label" optionValue="value" class="w-full">
              </p-select>
            </div>
          </div>

          <div class="field mb-3">
            <label>Observaciones</label>
            <textarea pTextarea formControlName="observations"
                      rows="3" class="w-full"></textarea>
          </div>

          <p-button label="Vista Previa del Cálculo" icon="pi pi-calculator"
                    type="submit" styleClass="w-full"
                    [loading]="previewing()" [disabled]="form.invalid"/>
        </form>
      </div>

      <!-- Vista Previa -->
      @if (resultado()) {
        <div class="bp-card">
          <div style="display:flex;justify-content:space-between;
                       align-items:center;margin-bottom:1rem">
            <h3 style="margin:0;color:var(--bp-primary)">Vista Previa de Facturación</h3>
            <p-button label="Generar Pre-Factura" icon="pi pi-file-pdf"
                      (click)="generar()" [loading]="generating()"/>
          </div>

          <p-table [value]="resultado()!.lines" dataKey="workLogId">
            <ng-template pTemplate="header">
              <tr>
                <th>Desarrollador</th>
                <th>Perfil</th>
                <th>Tipo</th>
                <th class="text-right">Horas</th>
                <th class="text-right">Valor Bruto</th>
                <th class="text-right">Desc. Novedad</th>
                <th class="text-right">Valor Neto</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-l>
              <tr>
                <td>{{ l.developerName }}</td>
                <td>{{ l.profileName }}</td>
                <td>{{ traducirTipo(l.rateType) }}</td>
                <td class="text-right">{{ l.billedHours | number:'1.0-0' }}</td>
                <td class="text-right">{{ l.grossAmount | number:'1.0-0' }}</td>
                <td class="text-right" style="color:#dc2626">
                  {{ l.noveltyDiscount | number:'1.0-0' }}
                </td>
                <td class="text-right">
                  <strong>{{ l.netAmount | number:'1.0-0' }}</strong>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr style="background:#f8fafc">
                <td colspan="4"></td>
                <td class="text-right">
                  <strong>{{ resultado()!.subtotal | number:'1.0-0' }}</strong>
                </td>
                <td class="text-right" style="color:#dc2626">
                  <strong>{{ resultado()!.totalNoveltyDiscounts | number:'1.0-0' }}</strong>
                </td>
                <td class="text-right" style="color:var(--bp-primary);font-size:1.05rem">
                  <strong>{{ resultado()!.totalAmount | number:'1.0-0' }}</strong>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <!-- Resumen -->
          <div style="display:flex;justify-content:flex-end;margin-top:1rem">
            <div style="min-width:280px;background:#f8fafc;
                         border-radius:8px;padding:1rem">
              <table style="width:100%;font-size:.9rem;border-collapse:collapse">
                <tr style="margin-bottom:.3rem">
                  <td style="padding:.3rem 0">Subtotal</td>
                  <td class="text-right">
                    {{ resultado()!.subtotal | number:'1.0-0' }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:.3rem 0;color:#dc2626">
                    Descuentos por Novedad
                  </td>
                  <td class="text-right" style="color:#dc2626">
                    -{{ resultado()!.totalNoveltyDiscounts | number:'1.0-0' }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:.3rem 0">Base Gravable</td>
                  <td class="text-right">
                    {{ resultado()!.taxableAmount | number:'1.0-0' }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:.3rem 0">IVA</td>
                  <td class="text-right">
                    {{ resultado()!.taxAmount | number:'1.0-0' }}
                  </td>
                </tr>
                <tr style="font-size:1.1rem;font-weight:700;
                            border-top:2px solid #e2e8f0">
                  <td style="padding-top:.75rem">TOTAL</td>
                  <td class="text-right" style="padding-top:.75rem;
                              color:var(--bp-primary)">
                    {{ resultado()!.totalAmount | number:'1.0-0' }}
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>

      } @else {
        <div class="bp-card" style="display:flex;align-items:center;
                                     justify-content:center;min-height:300px">
          <div style="text-align:center;color:#94a3b8">
            <i class="pi pi-calculator"
               style="font-size:3rem;margin-bottom:1rem;display:block"></i>
            <p style="font-size:1rem;font-weight:600">Vista Previa de Facturación</p>
            <p style="font-size:.875rem">
              Selecciona los parámetros y haz clic en<br>
              <strong>"Vista Previa del Cálculo"</strong>
              para ver el desglose de facturación.
            </p>
            <p style="font-size:.78rem;margin-top:.5rem">
              Todos los valores son calculados en el servidor.
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: ['.field{display:flex;flex-direction:column;gap:.4rem} label{font-weight:600;font-size:.875rem}']
})
export class GeneratePreInvoiceComponent implements OnInit {

  form!: FormGroup;
  resultado  = signal<BillingCalculationResult | null>(null);
  previewing = signal(false);
  generating = signal(false);

  clientOptions:   { label: string; value: string }[] = [];
  currencyOptions: { label: string; value: string }[] = [];

  yearOptions  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { label: 'Enero',      value: 1  }, { label: 'Febrero',   value: 2  },
    { label: 'Marzo',      value: 3  }, { label: 'Abril',     value: 4  },
    { label: 'Mayo',       value: 5  }, { label: 'Junio',     value: 6  },
    { label: 'Julio',      value: 7  }, { label: 'Agosto',    value: 8  },
    { label: 'Septiembre', value: 9  }, { label: 'Octubre',   value: 10 },
    { label: 'Noviembre',  value: 11 }, { label: 'Diciembre', value: 12 }
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
      this.currencyOptions = c.map(x => ({
        label: `${x.code} — ${x.name}`, value: x.id
      })));
  }

  calcularPrevia() {
    if (this.form.invalid) return;
    const { clientId, billingYear, billingMonth } = this.form.value;
    this.previewing.set(true);
    this.piService.calculate(clientId, billingYear, billingMonth).subscribe({
      next: r => { this.resultado.set(r); this.previewing.set(false); },
      error: () => this.previewing.set(false)
    });
  }

  generar() {
    if (this.form.invalid) return;
    this.generating.set(true);
    this.piService.generate(this.form.value).subscribe({
      next: inv => {
        this.generating.set(false);
        this.messageService.add({
          severity: 'success', summary: 'Generada',
          detail: `Pre-factura ${inv.invoiceNumber} creada exitosamente`
        });
        this.router.navigate(['/pre-invoices', inv.id]);
      },
      error: () => this.generating.set(false)
    });
  }

  traducirTipo(t: string): string {
    const m: Record<string, string> = {
      MONTHLY: 'Mensual',
      DAILY:   'Diaria',
      HOURLY:  'Por Hora'
    };
    return m[t] ?? t;
  }
}