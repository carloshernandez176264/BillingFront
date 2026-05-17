import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { environment } from '@env/environment';
import { ClientService } from '@core/services/client.service';

interface IpcRate {
  id: string;
  year: number;
  ipcPercentage: number;
  description: string;
  source: string;
}

interface DeveloperLine {
  developerId: string;
  developerName: string;
  profileName: string;
  currentRateId: string;
  currentMonthlyRate: number;
  currentDailyRate: number;
  currentHourlyRate: number;
  newMonthlyRate: number;
  newDailyRate: number;
  newHourlyRate: number;
  increment: number;
}

interface Simulation {
  clientId: string;
  clientName: string;
  applyYear: number;
  ipcPercentage: number;
  lines: DeveloperLine[];
  totalCurrentMonthly: number;
  totalNewMonthly: number;
  totalIncrement: number;
}

@Component({
  selector: 'app-tariff-increment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
            SelectModule, DialogModule, InputNumberModule, InputTextModule,
            TextareaModule, TagModule, CardModule, DividerModule],
  template: `
    <div class="bp-page-header">
      <h1>Incrementos Tarifarios IPC</h1>
      <p-button label="Registrar IPC" icon="pi pi-plus"
                severity="secondary" (click)="openIpcDialog()"/>
    </div>

    <!-- IPC Histórico -->
    <div class="bp-card mb-3">
      <h3 style="margin:0 0 1rem;color:var(--bp-primary)">
        <i class="pi pi-chart-line" style="margin-right:.5rem"></i>
        IPC Histórico Colombia
      </h3>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:stretch">
        @for (ipc of ipcRates(); track ipc.id) {
          <div [style]="cardStyle(ipc.ipcPercentage)"
               style="border-radius:12px;padding:1rem 1.25rem;min-width:140px;
                      text-align:center;cursor:pointer;transition:transform .15s"
               (click)="selectIpc(ipc)"
               [class.selected-ipc]="selectedIpc()?.id === ipc.id">
            <div style="font-size:.8rem;font-weight:600;opacity:.8;margin-bottom:.25rem">
              {{ ipc.year }}
            </div>
            <div style="font-size:1.8rem;font-weight:800">
              {{ ipc.ipcPercentage }}%
            </div>
            <div style="font-size:.7rem;opacity:.7;margin-top:.25rem">{{ ipc.source }}</div>
          </div>
        }
      </div>
    </div>

    <!-- Simulador -->
    <div style="display:grid;grid-template-columns:320px 1fr;gap:1.5rem;align-items:start">

      <!-- Panel izquierdo: parámetros -->
      <div class="bp-card">
        <h3 style="margin:0 0 1.25rem;color:var(--bp-primary)">
          <i class="pi pi-sliders-h" style="margin-right:.5rem"></i>
          Parámetros
        </h3>

        <div class="field mb-3">
          <label>Cliente *</label>
          <p-select [(ngModel)]="selectedClientId"
                    [options]="clientOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Selecciona el cliente"
                    class="w-full">
          </p-select>
        </div>

        <div class="field mb-3">
          <label>IPC a Aplicar *</label>
          <p-select [(ngModel)]="selectedIpcId"
                    [options]="ipcOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Selecciona el IPC"
                    class="w-full">
          </p-select>
          @if (selectedIpcId) {
            <small class="text-muted">
              Las nuevas tarifas serán vigentes desde el
              <strong>1 enero {{ applyYear() }}</strong>
            </small>
          }
        </div>

        <p-button label="Simular Incremento" icon="pi pi-calculator"
                  styleClass="w-full" [loading]="simulating()"
                  [disabled]="!selectedClientId || !selectedIpcId || simulating()"
                  (click)="simulate()"/>

        @if (simulation()) {
          <div style="margin-top:1rem;padding:1rem;background:#f0fdf4;
                      border:1px solid #bbf7d0;border-radius:8px">
            <div style="font-size:.8rem;color:#166534;font-weight:600;margin-bottom:.5rem">
              Resumen del incremento
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:.3rem">
              <span>Total actual:</span>
              <strong>{{ simulation()!.totalCurrentMonthly | number:'1.0-0' }}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:.3rem">
              <span>Total nuevo:</span>
              <strong style="color:#166534">{{ simulation()!.totalNewMonthly | number:'1.0-0' }}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;
                        border-top:1px solid #bbf7d0;padding-top:.5rem;margin-top:.3rem">
              <span>Incremento:</span>
              <strong style="color:#dc2626">+{{ simulation()!.totalIncrement | number:'1.0-0' }}</strong>
            </div>
          </div>

            <div style="margin-top:.75rem">
              <p-button label="Aprobar Incremento" icon="pi pi-check"
                styleClass="w-full" severity="success"
                [loading]="approving()"
                (click)="openApproveDialog()"/>
            </div>         
        }
      </div>

      <!-- Panel derecho: simulación -->
      @if (simulation()) {
        <div class="bp-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 style="margin:0;color:var(--bp-primary)">
              <i class="pi pi-eye" style="margin-right:.5rem"></i>
              Vista Previa — {{ simulation()!.clientName }} —
              IPC {{ simulation()!.ipcPercentage }}% → Año {{ simulation()!.applyYear }}
            </h3>
          </div>

          <!-- Tarjetas por desarrollador -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;margin-bottom:1.5rem">
            @for (line of simulation()!.lines; track line.developerId) {
              <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;
                          box-shadow:0 1px 4px rgba(0,0,0,.06)">

                <!-- Header tarjeta -->
                <div style="background:var(--bp-primary);color:#fff;
                             padding:.75rem 1rem;display:flex;align-items:center;gap:.75rem">
                  <div style="width:36px;height:36px;border-radius:50%;
                               background:rgba(255,255,255,.2);display:flex;
                               align-items:center;justify-content:center;font-weight:700">
                    {{ line.developerName.charAt(0) }}
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:.95rem">{{ line.developerName }}</div>
                    <div style="font-size:.75rem;opacity:.8">{{ line.profileName }}</div>
                  </div>
                  <div style="margin-left:auto;text-align:right">
                    <div style="font-size:.7rem;opacity:.8">Incremento</div>
                    <div style="font-weight:800;color:#86efac">
                      +{{ line.increment | number:'1.0-0' }}
                    </div>
                  </div>
                </div>

                <!-- Body tarjeta -->
                <div style="padding:1rem">
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;
                               gap:.5rem;text-align:center">

                    <!-- Mensual -->
                    <div>
                      <div style="font-size:.7rem;color:#64748b;margin-bottom:.25rem">
                        MENSUAL
                      </div>
                      <div style="font-size:.8rem;color:#64748b;text-decoration:line-through">
                        {{ line.currentMonthlyRate | number:'1.0-0' }}
                      </div>
                      <div style="font-size:1rem;font-weight:700;color:#166534">
                        {{ line.newMonthlyRate | number:'1.0-0' }}
                      </div>
                    </div>

                    <!-- Diario -->
                    <div style="border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
                      <div style="font-size:.7rem;color:#64748b;margin-bottom:.25rem">
                        DIARIO / 21
                      </div>
                      <div style="font-size:.8rem;color:#64748b;text-decoration:line-through">
                        {{ line.currentDailyRate | number:'1.0-0' }}
                      </div>
                      <div style="font-size:1rem;font-weight:700;color:#166534">
                        {{ line.newDailyRate | number:'1.0-0' }}
                      </div>
                    </div>

                    <!-- Por hora -->
                    <div>
                      <div style="font-size:.7rem;color:#64748b;margin-bottom:.25rem">
                        POR HORA / 168
                      </div>
                      <div style="font-size:.8rem;color:#64748b;text-decoration:line-through">
                        {{ line.currentHourlyRate | number:'1.0-0' }}
                      </div>
                      <div style="font-size:1rem;font-weight:700;color:#166534">
                        {{ line.newHourlyRate | number:'1.0-0' }}
                      </div>
                    </div>

                  </div>

                  <!-- Barra de incremento visual -->
                  <div style="margin-top:.75rem">
                    <div style="display:flex;justify-content:space-between;
                                font-size:.7rem;color:#64748b;margin-bottom:.25rem">
                      <span>Incremento porcentual</span>
                      <span style="font-weight:600;color:#166534">
                        {{ simulation()!.ipcPercentage }}%
                      </span>
                    </div>
                    <div style="background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden">
                      <div [style.width]="simulation()!.ipcPercentage + '%'"
                           style="background:linear-gradient(90deg,#1e4078,#22c55e);
                                  height:100%;border-radius:4px;transition:width .5s ease">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Tabla resumen -->
          <p-table [value]="simulation()!.lines" dataKey="developerId"
                   styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Desarrollador</th>
                <th>Perfil</th>
                <th class="text-right">Tarifa Actual</th>
                <th class="text-right">Tarifa Nueva</th>
                <th class="text-right">Día Actual</th>
                <th class="text-right">Día Nuevo</th>
                <th class="text-right">Hora Actual</th>
                <th class="text-right">Hora Nueva</th>
                <th class="text-right">Incremento</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-l>
              <tr>
                <td><strong>{{ l.developerName }}</strong></td>
                <td>{{ l.profileName }}</td>
                <td class="text-right">{{ l.currentMonthlyRate | number:'1.0-0' }}</td>
                <td class="text-right" style="color:#166534;font-weight:700">
                  {{ l.newMonthlyRate | number:'1.0-0' }}
                </td>
                <td class="text-right">{{ l.currentDailyRate | number:'1.0-0' }}</td>
                <td class="text-right" style="color:#166534">
                  {{ l.newDailyRate | number:'1.0-0' }}
                </td>
                <td class="text-right">{{ l.currentHourlyRate | number:'1.0-0' }}</td>
                <td class="text-right" style="color:#166534">
                  {{ l.newHourlyRate | number:'1.0-0' }}
                </td>
                <td class="text-right" style="color:#dc2626;font-weight:700">
                  +{{ l.increment | number:'1.0-0' }}
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr style="background:#f8fafc;font-weight:700">
                <td colspan="2">TOTAL</td>
                <td class="text-right">
                  {{ simulation()!.totalCurrentMonthly | number:'1.0-0' }}
                </td>
                <td class="text-right" style="color:#166534">
                  {{ simulation()!.totalNewMonthly | number:'1.0-0' }}
                </td>
                <td colspan="4"></td>
                <td class="text-right" style="color:#dc2626">
                  +{{ simulation()!.totalIncrement | number:'1.0-0' }}
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

      } @else {
        <div class="bp-card" style="display:flex;align-items:center;
                                     justify-content:center;min-height:300px">
          <div style="text-align:center;color:#94a3b8">
            <i class="pi pi-percentage" style="font-size:3rem;margin-bottom:1rem;display:block"></i>
            <p style="font-size:1rem;font-weight:600">Simulador de Incrementos IPC</p>
            <p style="font-size:.875rem">
              Selecciona un cliente y un IPC, luego haz clic en<br>
              <strong>"Simular Incremento"</strong> para ver la proyección
            </p>
          </div>
        </div>
      }
    </div>

    <!-- Historial -->
    @if (history().length > 0) {
      <div class="bp-card mt-3">
        <h3 style="margin:0 0 1rem;color:var(--bp-primary)">
          <i class="pi pi-history" style="margin-right:.5rem"></i>
          Historial de Incrementos Aprobados
        </h3>
        <p-table [value]="history()" dataKey="id" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Cliente</th>
              <th>Año</th>
              <th class="text-right">IPC %</th>
              <th>Vigente Desde</th>
              <th>Aprobado Por</th>
              <th>Estado</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-h>
            <tr>
              <td>{{ h.client?.companyName }}</td>
              <td>{{ h.applyYear }}</td>
              <td class="text-right"><strong>{{ h.ipcPercentage }}%</strong></td>
              <td>{{ h.effectiveDate | date:'mediumDate' }}</td>
              <td>{{ h.approvedBy }}</td>
              <td>
                <span [class]="'bp-badge ' + h.status.toLowerCase()">
                  {{ traducirEstado(h.status) }}
                </span>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- Dialog nuevo IPC -->
    <p-dialog [(visible)]="showIpcDialog" header="Registrar IPC"
              [modal]="true" [style]="{width:'450px'}">
      <form [formGroup]="ipcForm" (ngSubmit)="saveIpc()">
        <div class="field mb-3">
          <label>Año *</label>
          <p-inputnumber formControlName="year" [useGrouping]="false"
                         placeholder="Ej: 2025" class="w-full"/>
        </div>
        <div class="field mb-3">
          <label>IPC % *</label>
          <p-inputnumber formControlName="ipcPercentage" [minFractionDigits]="2"
                         suffix="%" placeholder="Ej: 9.28" class="w-full"/>
        </div>
        <div class="field mb-3">
          <label>Descripción</label>
          <input pInputText formControlName="description" class="w-full"
                 placeholder="Ej: IPC Colombia 2025"/>
        </div>
        <div class="field mb-3">
          <label>Fuente</label>
          <input pInputText formControlName="source" class="w-full"
                 placeholder="DANE - Colombia"/>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showIpcDialog=false" type="button"/>
          <p-button label="Guardar" icon="pi pi-check" type="submit"
                    [loading]="savingIpc()" [disabled]="ipcForm.invalid"/>
        </div>
      </form>
    </p-dialog>

    <!-- Dialog aprobar -->
    <p-dialog [(visible)]="showApproveDialog"
              header="Aprobar Incremento Tarifario"
              [modal]="true" [style]="{width:'500px'}">
      @if (simulation()) {
        <div style="margin-bottom:1rem;padding:1rem;background:#fefce8;
                    border:1px solid #fde68a;border-radius:8px;font-size:.875rem">
          <i class="pi pi-exclamation-triangle"
             style="color:#d97706;margin-right:.5rem"></i>
          Al aprobar, se crearán nuevas tarifas vigentes desde el
          <strong>1 enero {{ simulation()!.applyYear }}</strong> para todos los
          desarrolladores de <strong>{{ simulation()!.clientName }}</strong>.
          Las tarifas actuales quedarán vencidas el 31 diciembre {{ simulation()!.applyYear - 1 }}.
        </div>

        <div class="field mb-3">
          <label>Observaciones</label>
          <textarea pTextarea [(ngModel)]="approveObservations" rows="3"
                    class="w-full"
                    placeholder="Ej: Aprobado en reunión comercial del..."></textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showApproveDialog=false" type="button"/>
          <p-button label="Confirmar Aprobación" icon="pi pi-check"
                    severity="success" [loading]="approving()"
                    (click)="approve()"/>
        </div>
      }
    </p-dialog>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: .4rem; }
    label  { font-weight: 600; font-size: .875rem; }
    .selected-ipc { transform: scale(1.05); box-shadow: 0 4px 16px rgba(0,0,0,.2); }
  `]
})
export class TariffIncrementComponent implements OnInit {

  ipcRates   = signal<IpcRate[]>([]);
  simulation = signal<Simulation | null>(null);
  history    = signal<any[]>([]);
  simulating = signal(false);
  approving  = signal(false);
  savingIpc  = signal(false);

  showIpcDialog     = false;
  showApproveDialog = false;
  approveObservations = '';

  selectedClientId = '';
  selectedIpcId    = '';
  selectedIpc      = signal<IpcRate | null>(null);

  clientOptions: { label: string; value: string }[] = [];
  ipcOptions:    { label: string; value: string }[] = [];

  ipcForm = this.fb.group({
    year:          [null as number | null, [Validators.required, Validators.min(2000)]],
    ipcPercentage: [null as number | null, [Validators.required, Validators.min(0)]],
    description:   [''],
    source:        ['DANE - Colombia']
  });

  constructor(private http: HttpClient,
              private clientService: ClientService,
              private messageService: MessageService,
              private fb: FormBuilder) {}

  ngOnInit() {
    this.loadIpc();
    this.clientService.findAll({ size: 100, status: 'ACTIVE' }).subscribe(r => {
      this.clientOptions = r.content.map(c => ({
        label: c.companyName,
        value: c.id
      }));
    });
  }

  loadIpc() {
    this.http.get<IpcRate[]>(`${environment.apiUrl}/tariff-increments/ipc`)
      .subscribe(r => {
        this.ipcRates.set(r);
        this.ipcOptions = r.map(i => ({
          label: `${i.year} — ${i.ipcPercentage}% (aplica ${i.year + 1})`,
          value: i.id
        }));
      });
  }

  selectIpc(ipc: IpcRate) {
    this.selectedIpc.set(ipc);
    this.selectedIpcId = ipc.id;
  }

  applyYear(): number {
    const ipc = this.ipcRates().find(i => i.id === this.selectedIpcId);
    return ipc ? ipc.year + 1 : new Date().getFullYear() + 1;
  }

  simulate() {
    if (!this.selectedClientId || !this.selectedIpcId) return;
    this.simulating.set(true);
    this.simulation.set(null);

    this.http.get<Simulation>(
      `${environment.apiUrl}/tariff-increments/simulate`,
      { params: { clientId: this.selectedClientId, ipcRateId: this.selectedIpcId } }
    ).subscribe({
      next: r => {
        this.simulation.set(r);
        this.simulating.set(false);
        // Cargar historial del cliente
        this.loadHistory();
      },
      error: () => this.simulating.set(false)
    });
  }

  loadHistory() {
    if (!this.selectedClientId) return;
    this.http.get<any[]>(
      `${environment.apiUrl}/tariff-increments/history`,
      { params: { clientId: this.selectedClientId } }
    ).subscribe(r => this.history.set(r));
  }

  openIpcDialog() {
    this.ipcForm.reset({ source: 'DANE - Colombia' });
    this.showIpcDialog = true;
  }

  saveIpc() {
    if (this.ipcForm.invalid) return;
    this.savingIpc.set(true);
    this.http.post<IpcRate>(
      `${environment.apiUrl}/tariff-increments/ipc`,
      this.ipcForm.value
    ).subscribe({
      next: () => {
        this.savingIpc.set(false);
        this.showIpcDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Guardado',
          detail: 'IPC registrado exitosamente'
        });
        this.loadIpc();
      },
      error: () => this.savingIpc.set(false)
    });
  }

  openApproveDialog() {
    this.approveObservations = '';
    this.showApproveDialog = true;
  }

  approve() {
    if (!this.simulation()) return;
    this.approving.set(true);

    const body = {
      clientId:     this.selectedClientId,
      applyYear:    this.simulation()!.applyYear,
      ipcRateId:    this.selectedIpcId,
      observations: this.approveObservations
    };

    this.http.post<any>(
      `${environment.apiUrl}/tariff-increments/approve`, body
    ).subscribe({
      next: () => {
        this.approving.set(false);
        this.showApproveDialog = false;
        this.messageService.add({
          severity: 'success', summary: '¡Aprobado!',
          detail: `Incremento IPC ${this.simulation()!.ipcPercentage}% aprobado. ` +
                  `Nuevas tarifas vigentes desde 1 enero ${this.simulation()!.applyYear}`
        });
        this.simulation.set(null);
        this.loadHistory();
      },
      error: () => this.approving.set(false)
    });
  }

  cardStyle(ipc: number): string {
    if (ipc <= 3)  return 'background:linear-gradient(135deg,#059669,#10b981);color:#fff';
    if (ipc <= 6)  return 'background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff';
    if (ipc <= 10) return 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff';
    return 'background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff';
  }

  traducirEstado(s: string): string {
    return s === 'APPROVED' ? 'Aprobado' : s === 'PENDING' ? 'Pendiente' : 'Rechazado';
  }
}