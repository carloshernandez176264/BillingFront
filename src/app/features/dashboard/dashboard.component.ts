import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ClientService } from '@core/services/client.service';
import { WorkLogService } from '@core/services/worklog.service';
import { PreInvoiceService } from '@core/services/preinvoice.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  template: `
    <div class="bp-page-header">
      <h1>Inicio</h1>
      <span class="text-muted">{{ today }}</span>
    </div>

    <!-- Quick access cards -->
    <div class="dashboard-grid">
      @for (card of quickCards; track card.route) {
        <a class="bp-card dash-card" [routerLink]="card.route">
          <div class="dash-icon" [style.background]="card.color">
            <i [class]="'pi ' + card.icon"></i>
          </div>
          <div class="dash-info">
            <div class="dash-label">{{ card.label }}</div>
            <div class="dash-sub">{{ card.sub }}</div>
          </div>
          <i class="pi pi-chevron-right dash-arrow"></i>
        </a>
      }
    </div>

    <!-- Quick actions -->
    <div class="bp-card mt-3">
      <h3 style="margin: 0 0 1rem; color: var(--bp-primary)">Acciones Rápidas</h3>
      <div style="display: flex; flex-wrap: wrap; gap: .75rem;">
        <p-button label="Nuevo Cliente"        icon="pi pi-plus"     severity="secondary"
                  [routerLink]="'/clients/new'"/>
        <p-button label="Registrar Horas"      icon="pi pi-clock"    severity="secondary"
                  [routerLink]="'/work-logs'"/>
        <p-button label="Generar Pre-Factura"  icon="pi pi-file-pdf"
                  [routerLink]="'/pre-invoices/generate'"/>
        <p-button label="Ver Reportes"         icon="pi pi-chart-bar" severity="secondary"
                  [routerLink]="'/reports'"/>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
    .dash-card {
      display: flex; align-items: center; gap: 1rem;
      text-decoration: none; color: inherit; cursor: pointer;
      transition: transform .15s, box-shadow .15s;
    }
    .dash-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.1); }
    .dash-icon {
      width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .dash-icon .pi { font-size: 1.4rem; color: #fff; }
    .dash-info { flex: 1; }
    .dash-label { font-weight: 700; font-size: .95rem; }
    .dash-sub   { font-size: .8rem; color: var(--bp-text-muted); margin-top: .15rem; }
    .dash-arrow { color: var(--bp-text-muted); font-size: .8rem; }
  `]
})
export class DashboardComponent {

  today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  quickCards = [
    { label: 'Clientes',          sub: 'Gestión de clientes de facturación', icon: 'pi-building',            route: '/clients',           color: '#1e4078' },
    { label: 'Desarrolladores',   sub: 'Recursos facturables',               icon: 'pi-users',               route: '/developers',        color: '#0891b2' },
    { label: 'Tarifas',           sub: 'Configuración de tarifas',           icon: 'pi-dollar',              route: '/rates',             color: '#059669' },
    { label: 'Registros de Horas',sub: 'Horas mensuales registradas',        icon: 'pi-clock',               route: '/work-logs',         color: '#7c3aed' },
    { label: 'Novedades',         sub: 'Descuentos y ausencias',             icon: 'pi-exclamation-triangle', route: '/billing-novelties', color: '#d97706' },
    { label: 'Pre-Facturas',      sub: 'Generar y gestionar facturas',       icon: 'pi-file-pdf',            route: '/pre-invoices',      color: '#dc2626' },
    { label: 'Reportes',          sub: 'Resúmenes financieros',              icon: 'pi-chart-bar',           route: '/reports',           color: '#0f766e' },
    { label: 'Usuarios',          sub: 'Gestión de usuarios',                icon: 'pi-user-edit',           route: '/users',             color: '#6d28d9' }
  ];
}
