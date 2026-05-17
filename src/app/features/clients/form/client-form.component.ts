import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ClientService } from '@core/services/client.service';
import { CurrencyService } from '@core/services/currency.service';
import { ClientDevelopersComponent } from '../developers/client-developers.component';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule,
            InputTextModule, SelectModule, TextareaModule, TabsModule,
            ClientDevelopersComponent],
  template: `
    <div class="bp-page-header">
      <h1>{{ isEdit ? 'Editar Cliente' : 'Nuevo Cliente' }}</h1>
      <a routerLink="/clients" style="text-decoration:none">
        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary"/>
      </a>
    </div>

    <div style="max-width:900px">
      <p-tabs [value]="activeTab">
        <p-tablist>
          <p-tab value="0">Información General</p-tab>
          <p-tab value="1" [disabled]="!isEdit">
            Desarrolladores Asignados
            @if (!isEdit) {
              <small class="text-muted" style="margin-left:.4rem">(guarda primero)</small>
            }
          </p-tab>
        </p-tablist>

        <p-tabpanels>

          <!-- TAB 1: Formulario -->
          <p-tabpanel value="0">
            <div class="bp-card">
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">

                  <div class="field">
                    <label>NIT / Identificación Tributaria *</label>
                    <input pInputText formControlName="taxId"
                           class="w-full" placeholder="Ej: 900123456-7"/>
                    @if (form.get('taxId')?.invalid && form.get('taxId')?.touched) {
                      <small class="p-error">Campo obligatorio</small>
                    }
                  </div>

                  <div class="field">
                    <label>Razón Social *</label>
                    <input pInputText formControlName="companyName" class="w-full"/>
                    @if (form.get('companyName')?.invalid && form.get('companyName')?.touched) {
                      <small class="p-error">Campo obligatorio</small>
                    }
                  </div>

                  <div class="field">
                    <label>Nombre Comercial</label>
                    <input pInputText formControlName="tradeName" class="w-full"/>
                  </div>

                  <div class="field">
                    <label>País *</label>
                    <input pInputText formControlName="country" class="w-full"/>
                  </div>

                  <div class="field">
                    <label>Ciudad</label>
                    <input pInputText formControlName="city" class="w-full"/>
                  </div>

                  <div class="field">
                    <label>Correo de Facturación *</label>
                    <input pInputText formControlName="billingEmail"
                           class="w-full" type="email"/>
                    @if (form.get('billingEmail')?.invalid && form.get('billingEmail')?.touched) {
                      <small class="p-error">Correo válido requerido</small>
                    }
                  </div>

                  <div class="field">
                    <label>Nombre del Contacto</label>
                    <input pInputText formControlName="contactName" class="w-full"/>
                  </div>

                  <div class="field">
                    <label>Teléfono del Contacto</label>
                    <input pInputText formControlName="contactPhone" class="w-full"/>
                  </div>

                  <div class="field">
                    <label>Moneda Principal *</label>
                    <p-select formControlName="primaryCurrencyId"
                              [options]="currencyOptions"
                              optionLabel="label" optionValue="value"
                              placeholder="Selecciona la moneda" class="w-full"/>
                    @if (form.get('primaryCurrencyId')?.invalid && form.get('primaryCurrencyId')?.touched) {
                      <small class="p-error">Campo obligatorio</small>
                    }
                  </div>

                  <div class="field">
                    <label>Régimen Tributario</label>
                    <input pInputText formControlName="taxRegime" class="w-full"
                           placeholder="Ej: Régimen Simple, Responsable de IVA"/>
                  </div>

                  <div class="field" style="grid-column:1/-1">
                    <label>Dirección</label>
                    <input pInputText formControlName="address" class="w-full"/>
                  </div>

                  <div class="field" style="grid-column:1/-1">
                    <label>Observaciones</label>
                    <textarea pTextarea formControlName="notes"
                              rows="3" class="w-full"></textarea>
                  </div>

                </div>

                <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.5rem">
                  <a routerLink="/clients" style="text-decoration:none">
                    <p-button label="Cancelar" severity="secondary" type="button"/>
                  </a>
                  <p-button [label]="isEdit ? 'Guardar Cambios' : 'Crear Cliente'"
                            icon="pi pi-check" type="submit"
                            [loading]="saving()"
                            [disabled]="form.invalid || saving()"/>
                </div>
              </form>
            </div>
          </p-tabpanel>

          <!-- TAB 2: Desarrolladores asignados -->
          <p-tabpanel value="1">
            <div class="bp-card">
              @if (isEdit && clientId) {
                <app-client-developers [clientId]="clientId"/>
              }
            </div>
          </p-tabpanel>

        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: .4rem; }
    label  { font-weight: 600; font-size: .875rem; }
  `]
})
export class ClientFormComponent implements OnInit {

  form!: FormGroup;
  saving         = signal(false);
  isEdit         = false;
  clientId?: string;
  activeTab      = '0';
  currencyOptions: { label: string; value: string }[] = [];

  constructor(private fb: FormBuilder,
              private clientService: ClientService,
              private currencyService: CurrencyService,
              private messageService: MessageService,
              private router: Router,
              private route: ActivatedRoute) {}

  ngOnInit() {
    this.clientId = this.route.snapshot.params['id'];
    this.isEdit   = !!this.clientId;
    this.buildForm();
    this.loadCurrencies();
    if (this.isEdit) this.loadClient();
  }

  buildForm() {
    this.form = this.fb.group({
      taxId:             ['', [Validators.required, Validators.maxLength(30)]],
      companyName:       ['', [Validators.required, Validators.maxLength(200)]],
      tradeName:         [''],
      country:           ['', Validators.required],
      city:              [''],
      address:           [''],
      billingEmail:      ['', [Validators.required, Validators.email]],
      contactName:       [''],
      contactPhone:      [''],
      primaryCurrencyId: ['', Validators.required],
      taxRegime:         [''],
      notes:             ['']
    });
    if (this.isEdit) this.form.get('taxId')?.disable();
  }

  loadCurrencies() {
    this.currencyService.findAll().subscribe(list => {
      this.currencyOptions = list.map(c => ({
        label: `${c.code} — ${c.name}`,
        value: c.id
      }));
    });
  }

  loadClient() {
    this.clientService.findById(this.clientId!).subscribe(c => {
      this.form.patchValue(c);
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();

    const req$ = this.isEdit
      ? this.clientService.update(this.clientId!, value)
      : this.clientService.create(value);

    req$.subscribe({
      next: (client) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success', summary: 'Éxito',
          detail: `Cliente ${this.isEdit ? 'actualizado' : 'creado'} exitosamente`
        });
        if (!this.isEdit) {
          // Al crear, navega al edit para que pueda asignar desarrolladores
          this.router.navigate(['/clients', client.id, 'edit']);
        } else {
          // Al editar, cambia a la pestaña de desarrolladores
          this.activeTab = '1';
        }
      },
      error: () => this.saving.set(false)
    });
  }
}