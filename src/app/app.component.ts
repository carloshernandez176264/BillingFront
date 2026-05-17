import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast position="top-right" [breakpoints]="{'920px': {width: '100%', right: '0', left: '0'}}"/>
    <p-confirmDialog/>
    <router-outlet/>
  `
})
export class AppComponent {}
