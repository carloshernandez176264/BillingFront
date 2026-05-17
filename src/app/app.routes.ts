import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [loginGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/list/client-list.component').then(m => m.ClientListComponent)
      },
      {
        path: 'clients/new',
        loadComponent: () =>
          import('./features/clients/form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () =>
          import('./features/clients/form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'developer-profiles',
        loadComponent: () =>
          import('./features/developer-profiles/list/developer-profile-list.component').then(m => m.DeveloperProfileListComponent)
      },
      {
        path: 'developers',
        loadComponent: () =>
          import('./features/developers/list/developer-list.component').then(m => m.DeveloperListComponent)
      },
      {
        path: 'rates',
        loadComponent: () =>
          import('./features/rates/list/rate-list.component').then(m => m.RateListComponent)
      },
      {
        path: 'work-logs',
        loadComponent: () =>
          import('./features/work-logs/list/work-log-list.component').then(m => m.WorkLogListComponent)
      },
      {
        path: 'billing-novelties',
        loadComponent: () =>
          import('./features/billing-novelties/list/billing-novelty-list.component').then(m => m.BillingNoveltyListComponent)
      },
      {
        path: 'pre-invoices',
        loadComponent: () =>
          import('./features/pre-invoices/list/pre-invoice-list.component').then(m => m.PreInvoiceListComponent)
      },
      {
        path: 'pre-invoices/generate',
        loadComponent: () =>
          import('./features/pre-invoices/generate/generate-pre-invoice.component').then(m => m.GeneratePreInvoiceComponent)
      },
      {
        path: 'pre-invoices/:id',
        loadComponent: () =>
          import('./features/pre-invoices/detail/pre-invoice-detail.component').then(m => m.PreInvoiceDetailComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/billing/billing-report.component').then(m => m.BillingReportComponent)
      },
      {
        path: 'tariff-increments',
        loadComponent: () =>
        import('./features/tariff-increments/tariff-increment.component').then(m => m.TariffIncrementComponent)
      },
      {
        path: 'profitability',
        loadComponent: () =>
        import('./features/reports/profitability/profitability.component').then(m => m.ProfitabilityComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/list/user-list.component').then(m => m.UserListComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
