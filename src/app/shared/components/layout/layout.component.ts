import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
            ButtonModule, AvatarModule, RippleModule],
  template: `
    <!-- Sidebar -->
    <aside class="bp-sidebar" [class.collapsed]="sidebarCollapsed()">
      <div class="bp-sidebar-logo">
        <span class="logo-icon">💼</span>
        <span class="logo-text" *ngIf="!sidebarCollapsed()">Plataforma de <BR> Facturación</span>
      </div>

      <nav class="bp-nav">
        @for (item of menuItems; track item.route) {
          <a class="bp-nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             [title]="item.label">
            <i [class]="'pi ' + item.icon"></i>
            <span *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="bp-sidebar-footer">
        <button class="bp-nav-item" (click)="logout()" title="Cerrar sesión">
          <i class="pi pi-sign-out"></i>
          <span *ngIf="!sidebarCollapsed()">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Topbar -->
    <header class="bp-topbar">
      <button class="bp-topbar-toggle" (click)="toggleSidebar()">
        <i class="pi pi-bars"></i>
      </button>
      <div class="bp-topbar-right">
        <span class="bp-topbar-user">
          <i class="pi pi-user"></i>
          {{ authService.currentUser()?.sub }}
        </span>
      </div>
    </header>

    <!-- Main content -->
    <main class="bp-content">
      <router-outlet/>
    </main>
  `,
  styles: [`
    .bp-sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      width: var(--bp-sidebar-w); background: var(--bp-primary);
      display: flex; flex-direction: column; transition: width .2s ease;
      z-index: 100; overflow: hidden;
    }
    .bp-sidebar.collapsed { width: 64px; }
    .bp-sidebar-logo {
      display: flex; align-items: center; gap: .75rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,.1);
      color: #fff; font-weight: 700; font-size: 1rem; white-space: nowrap;
    }
    .logo-icon { font-size: 1.5rem; flex-shrink: 0; }
    .bp-nav { flex: 1; padding: .5rem 0; overflow-y: auto; }
    .bp-nav-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .75rem 1.25rem; color: rgba(255,255,255,.8);
      text-decoration: none; transition: all .15s;
      white-space: nowrap; border: none; background: none;
      cursor: pointer; width: 100%; font-size: .9rem;
    }
    .bp-nav-item:hover, .bp-nav-item.active {
      background: rgba(255,255,255,.12); color: #fff;
    }
    .bp-nav-item .pi { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
    .bp-sidebar-footer { border-top: 1px solid rgba(255,255,255,.1); padding: .5rem 0; }
    .bp-topbar {
      position: fixed; top: 0; left: var(--bp-sidebar-w); right: 0;
      height: var(--bp-topbar-h); background: #fff;
      border-bottom: 1px solid var(--bp-border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; z-index: 99; transition: left .2s ease;
    }
    .bp-topbar-toggle { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: var(--bp-text); }
    .bp-topbar-right { display: flex; align-items: center; gap: 1rem; }
    .bp-topbar-user { color: var(--bp-text-muted); font-size: .875rem; display: flex; align-items: center; gap: .4rem; }
    .bp-content { margin-left: var(--bp-sidebar-w); margin-top: var(--bp-topbar-h); padding: 1.5rem; transition: margin-left .2s ease; }
  `]
})
export class LayoutComponent {

  sidebarCollapsed = signal(false);

  menuItems: MenuItem[] = [
    { label: 'Inicio',             icon: 'pi-home',                 route: '/dashboard' },
    { label: 'Clientes',           icon: 'pi-building',             route: '/clients' },
    { label: 'Perfiles Dev',       icon: 'pi-briefcase',            route: '/developer-profiles' },
    { label: 'Desarrolladores',    icon: 'pi-users',                route: '/developers' },
    { label: 'Tarifas por Cliente',            icon: 'pi-dollar',               route: '/rates' },
    { label: 'Rentabilidad', icon: 'pi-chart-pie', route: '/profitability' },
    { label: 'Registros de Horas', icon: 'pi-clock',                route: '/work-logs' },
    { label: 'Novedades',          icon: 'pi-exclamation-triangle', route: '/billing-novelties' },
    { label: 'Pre-Facturas',       icon: 'pi-file-pdf',             route: '/pre-invoices' },
    { label: 'Reportes',           icon: 'pi-chart-bar',            route: '/reports' },
    { label: 'Usuarios',           icon: 'pi-user-edit',            route: '/users' },
    { label: 'Incrementos IPC', icon: 'pi-percentage', route: '/tariff-increments' }
  ];

  constructor(readonly authService: AuthService) {}

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }

  logout() { this.authService.logout(); }
}
