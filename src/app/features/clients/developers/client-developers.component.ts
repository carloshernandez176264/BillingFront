import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '@env/environment';
import { DeveloperService } from '@core/services/developer.service';

@Component({
  selector: 'app-client-developers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule,
            SelectModule, DialogModule, InputTextModule, DatePickerModule,
            ConfirmDialogModule],
  template: `
    <div style="display:flex;justify-content:space-between;
                align-items:center;margin-bottom:1rem">
      <h3 style="margin:0;color:var(--bp-primary)">Desarrolladores Asignados</h3>
      <p-button label="Asignar Desarrollador" icon="pi pi-plus"
                size="small" (click)="openDialog()"/>
    </div>

    <p-confirmDialog/>

    <p-table [value]="assignments()" [loading]="loading()" dataKey="id">
      <ng-template pTemplate="header">
        <tr>
          <th>Desarrollador</th>
          <th>Documento</th>
          <th>Perfil</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
          <th>Notas</th>
          <th style="width:100px">Acciones</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-a>
        <tr>
          <td><strong>{{ a.developerName }}</strong></td>
          <td><code>{{ a.developerDocument }}</code></td>
          <td>{{ a.profileName }}</td>
          <td>
            {{ a.startDate ? (a.startDate | date:'dd/MM/yyyy') : '—' }}
          </td>
          <td>
            @if (a.endDate) {
              <span style="color:#dc2626">
                {{ a.endDate | date:'dd/MM/yyyy' }}
              </span>
            } @else {
              <span style="color:#059669;font-size:.8rem">Activo</span>
            }
          </td>
          <td>{{ a.notes ?? '—' }}</td>
          <td>
            <div style="display:flex;gap:.3rem">
              <p-button icon="pi pi-pencil" severity="secondary"
                        size="small" title="Editar fechas"
                        (click)="openEdit(a)"/>
              <p-button icon="pi pi-trash" severity="danger"
                        size="small" (click)="confirmRemove(a)"/>
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7"
              style="text-align:center;padding:1.5rem;color:#64748b">
            No hay desarrolladores asignados a este cliente
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- Dialog asignar -->
    <p-dialog [(visible)]="showDialog" header="Asignar Desarrollador"
              [modal]="true" [style]="{width:'520px'}">
      <div class="field mb-3">
        <label style="font-weight:600;font-size:.875rem;
                       display:block;margin-bottom:.4rem">
          Desarrollador *
        </label>
        <p-select [(ngModel)]="selectedDeveloperId"
                  [options]="availableDevelopers"
                  optionLabel="label" optionValue="value"
                  placeholder="Selecciona el desarrollador"
                  [filter]="true" filterPlaceholder="Buscar por nombre..."
                  class="w-full"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
        <div class="field">
          <label style="font-weight:600;font-size:.875rem;
                         display:block;margin-bottom:.4rem">
            Fecha Inicio *
          </label>
          <p-datepicker [(ngModel)]="startDate"
                        dateFormat="dd/mm/yy"
                        [showIcon]="true"
                        placeholder="dd/mm/aaaa"
                        class="w-full"/>
        </div>
        <div class="field">
          <label style="font-weight:600;font-size:.875rem;
                         display:block;margin-bottom:.4rem">
            Fecha Fin (opcional)
          </label>
          <p-datepicker [(ngModel)]="endDate"
                        dateFormat="dd/mm/yy"
                        [showIcon]="true"
                        placeholder="dd/mm/aaaa"
                        class="w-full"/>
        </div>
      </div>
      <div class="field mb-3">
        <label style="font-weight:600;font-size:.875rem;
                       display:block;margin-bottom:.4rem">
          Notas (opcional)
        </label>
        <input pInputText [(ngModel)]="assignmentNotes"
               placeholder="Ej: Desarrollador principal del proyecto X"
               class="w-full"/>
      </div>
      <div style="display:flex;justify-content:flex-end;
                   gap:.5rem;margin-top:1rem">
        <p-button label="Cancelar" severity="secondary"
                  (click)="showDialog=false" type="button"/>
        <p-button label="Asignar" icon="pi pi-check"
                  [loading]="saving()"
                  [disabled]="!selectedDeveloperId || !startDate || saving()"
                  (click)="assign()"/>
      </div>
    </p-dialog>

    <!-- Dialog editar fechas -->
    <p-dialog [(visible)]="showEditDialog" header="Editar Fechas de Asignación"
              [modal]="true" [style]="{width:'480px'}">
      @if (editingAssignment) {
        <div style="margin-bottom:1rem;padding:.75rem;background:#f0f4f8;
                     border-radius:8px;font-size:.875rem">
          <strong>{{ editingAssignment.developerName }}</strong>
          — {{ editingAssignment.profileName }}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;
                     gap:1rem;margin-bottom:1rem">
          <div class="field">
            <label style="font-weight:600;font-size:.875rem;
                           display:block;margin-bottom:.4rem">
              Fecha Inicio *
            </label>
            <p-datepicker [(ngModel)]="editStartDate"
                          dateFormat="dd/mm/yy"
                          [showIcon]="true"
                          class="w-full"/>
          </div>
          <div class="field">
            <label style="font-weight:600;font-size:.875rem;
                           display:block;margin-bottom:.4rem">
              Fecha Fin (opcional)
            </label>
            <p-datepicker [(ngModel)]="editEndDate"
                          dateFormat="dd/mm/yy"
                          [showIcon]="true"
                          placeholder="Sin fecha fin"
                          class="w-full"/>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;
                     gap:.5rem;margin-top:1rem">
          <p-button label="Cancelar" severity="secondary"
                    (click)="showEditDialog=false" type="button"/>
          <p-button label="Guardar" icon="pi pi-check"
                    [loading]="saving()"
                    [disabled]="!editStartDate || saving()"
                    (click)="saveEdit()"/>
        </div>
      }
    </p-dialog>
  `
})
export class ClientDevelopersComponent implements OnInit {

  @Input() clientId!: string;

  assignments      = signal<any[]>([]);
  loading          = signal(false);
  saving           = signal(false);
  showDialog       = false;
  showEditDialog   = false;
  editingAssignment: any = null;

  selectedDeveloperId = '';
  assignmentNotes     = '';
  startDate: Date | null = null;
  endDate:   Date | null = null;
  editStartDate: Date | null = null;
  editEndDate:   Date | null = null;

  availableDevelopers: { label: string; value: string }[] = [];

  constructor(private http: HttpClient,
              private devService: DeveloperService,
              private messageService: MessageService,
              private confirmService: ConfirmationService) {}

  ngOnInit() {
    this.load();
    this.loadAllDevelopers();
  }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(
      `${environment.apiUrl}/clients/${this.clientId}/developers`
    ).subscribe({
      next: r => { this.assignments.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadAllDevelopers() {
    this.devService.findAll({ size: 200, status: 'ACTIVE' }).subscribe(r => {
      this.availableDevelopers = r.content.map(d => ({
        label: `${d.fullName} (${d.documentId}) — ${d.profileName}`,
        value: d.id
      }));
    });
  }

  openDialog() {
    this.selectedDeveloperId = '';
    this.assignmentNotes     = '';
    this.startDate           = new Date();
    this.endDate             = null;
    this.showDialog          = true;
  }

  openEdit(a: any) {
    this.editingAssignment = a;
    this.editStartDate = a.startDate ? new Date(a.startDate) : null;
    this.editEndDate   = a.endDate   ? new Date(a.endDate)   : null;
    this.showEditDialog = true;
  }

  assign() {
    if (!this.selectedDeveloperId || !this.startDate) return;
    this.saving.set(true);
    this.http.post<any>(
      `${environment.apiUrl}/clients/${this.clientId}/developers`,
      {
        developerId: this.selectedDeveloperId,
        notes:       this.assignmentNotes || null,
        startDate:   this.formatDate(this.startDate),
        endDate:     this.endDate ? this.formatDate(this.endDate) : null
      }
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Asignado',
          detail: 'Desarrollador asignado exitosamente'
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  saveEdit() {
    if (!this.editingAssignment || !this.editStartDate) return;
    this.saving.set(true);
    this.http.patch<any>(
      `${environment.apiUrl}/clients/${this.clientId}/developers/${this.editingAssignment.developerId}`,
      {
        startDate: this.formatDate(this.editStartDate),
        endDate:   this.editEndDate ? this.formatDate(this.editEndDate) : null
      }
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEditDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Actualizado',
          detail: 'Fechas de asignacion actualizadas'
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmRemove(a: any) {
    this.confirmService.confirm({
      message: `¿Remover a "${a.developerName}" de este cliente?`,
      header: 'Confirmar remocion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, remover',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.http.delete(
          `${environment.apiUrl}/clients/${this.clientId}/developers/${a.developerId}`
        ).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success', summary: 'Removido',
              detail: 'Desarrollador removido del cliente'
            });
            this.load();
          }
        });
      }
    });
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}