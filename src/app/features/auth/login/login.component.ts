import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule,
            InputTextModule, PasswordModule, CardModule, MessageModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <span class="login-logo">💼</span>
          <h1>Plataforma de Facturación</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (errorMsg()) {
            <p-message severity="error" [text]="errorMsg()!" styleClass="w-full mb-3"/>
          }

          <div class="field">
            <label for="email">Correo electrónico</label>
            <input pInputText id="email" formControlName="email"
                   placeholder="admin@billing.platform" class="w-full"
                   [class.ng-invalid]="invalid('email')"/>
            @if (invalid('email')) {
              <small class="p-error">Ingresa un correo electrónico válido</small>
            }
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <p-password id="password" formControlName="password"
                        placeholder="Contraseña" styleClass="w-full"
                        [feedback]="false" [toggleMask]="true"
                        [class.ng-invalid]="invalid('password')"/>
            @if (invalid('password')) {
              <small class="p-error">La contraseña es obligatoria</small>
            }
          </div>

          <p-button type="submit" label="Ingresar" icon="pi pi-sign-in"
                    styleClass="w-full mt-2"
                    [loading]="loading()"
                    [disabled]="form.invalid || loading()"/>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e4078 0%, #2d5fa8 100%);
      padding: 1rem;
    }
    .login-card {
      background: #fff; border-radius: 16px; padding: 2.5rem;
      width: 100%; max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
    }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-logo { font-size: 3rem; }
    h1 { margin: .5rem 0 .25rem; font-size: 1.6rem; color: #1e4078; }
    p  { color: #64748b; margin: 0; }
    .field { margin-bottom: 1.25rem; }
    label { display: block; font-weight: 600; margin-bottom: .4rem; font-size: .875rem; }
    .p-error { font-size: .78rem; }
  `]
})
export class LoginComponent {

  form: FormGroup;
  loading  = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.login(this.form.value).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.mustChangePassword) {
          this.router.navigate(['/auth/change-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(
          err.status === 401
            ? 'Correo o contraseña incorrectos'
            : err.status === 423
            ? 'La cuenta está bloqueada. Contacta al administrador.'
            : 'Error al iniciar sesión. Intenta de nuevo.'
        );
      }
    });
  }

  invalid(field: string) {
    const c = this.form.get(field);
    return c?.invalid && c?.touched;
  }
}
