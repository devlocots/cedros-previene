import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-theme-toggle',
  imports: [IconComponent],
  template: `
    <button type="button" class="icon-btn" (click)="tema.alternar()"
            [attr.aria-label]="tema.tema() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            [attr.title]="tema.tema() === 'dark' ? 'Tema claro' : 'Tema oscuro'">
      <app-icon [name]="tema.tema() === 'dark' ? 'sun' : 'moon'" [size]="18" />
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly tema = inject(ThemeService);
}
