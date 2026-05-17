import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '@env/environment';
import { DeveloperService } from '@core/services/developer.service';

@Component({
  selector: 'app-client-developers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule,
            SelectModule, DialogModule, InputTextModule, ConfirmDialogModule],
  template: `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
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
          <th>Notas</th>
          <th style="width:80px">Acciones</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-a>
        <tr>
          <td><strong>{{ a.developerName }}</strong></td>
          <td><code>{{ a.developerDocument }}</code></td>
          <td>{{ a.profileName }}</td>
          <td>{{ a.notes ?? '—' }}</td>
          <td>
            <p-button icon="pi pi-trash" severity="danger"
                      size="small" (click)="confirmRemove(a)"/>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b">
            No hay desarrolladores asignados a este cliente
          </td>
        </tr>
      </ng-template>
    </p-table>

    <p-dialog [(visible)]="showDialog" header="Asignar Desarrollador"
              [modal]="true" [style]="{width:'500px'}">
      <div class="field mb-3">
        <label style="font-weight:600;font-size:.875rem;display:block;margin-bottom:.4rem">
          Desarrollador *
        </label>
        <p-select [(ngModel)]="selectedDeveloperId"
                  [options]="availableDevelopers"
                  optionLabel="label" optionValue="value"
                  placeholder="Selecciona el desarrollador"
                  [filter]="true" filterPlaceholder="Buscar por nombre..."
                  class="w-full">
        </p-select>
      </div>
      <div class="field mb-3">
        <label style="font-weight:600;font-size:.875rem;display:block;margin-bottom:.4rem">
          Notas (opcional)
        </label>
        <input pInputText [(ngModel)]="assignmentNotes"
               placeholder="Ej: Desarrollador principal del proyecto X"
               class="w-full"/>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
        <p-button label="Cancelar" severity="secondary"
                  (click)="showDialog=false" type="button"/>
        <p-button label="Asignar" icon="pi pi-check"
                  [loading]="saving()"
                  [disabled]="!selectedDeveloperId || saving()"
                  (click)="assign()"/>
      </div>
    </p-dialog>
  `
})
export class ClientDevelopersComponent implements OnInit {

  @Input() clientId!: string;

  assignments         = signal<any[]>([]);
  loading             = signal(false);
  saving              = signal(false);
  showDialog          = false;
  selectedDeveloperId = '';
  assignmentNotes     = '';
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
    this.showDialog = true;
  }

  assign() {
    if (!this.selectedDeveloperId) return;
    this.saving.set(true);
    this.http.post<any>(
      `${environment.apiUrl}/clients/${this.clientId}/developers`,
      { developerId: this.selectedDeveloperId, notes: this.assignmentNotes || null }
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog = false;
        this.messageService.add({
          severity: 'success', summary: 'Asignado',
          detail: 'Desarrollador asignado al cliente exitosamente'
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  confirmRemove(a: any) {
    this.confirmService.confirm({
      message: `¿Remover a "${a.developerName}" de este cliente?`,
      header: 'Confirmar remoción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, remover',
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
}