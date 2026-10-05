import { Component, Input } from '@angular/core';

/** Logo de Cedros Previene: corazón de un solo trazo con una gota de glucosa dentro. */
@Component({
  selector: 'app-logo',
  template: `
    <span class="logo">
      <span class="logo-mark">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <path class="lm-heart" d="M16 27.5s-9.6-5.7-11.7-11.5C2.9 12 5.3 7.4 9.7 7.4c2.8 0 4.8 1.6 6.3 3.9 1.5-2.3 3.5-3.9 6.3-3.9 4.4 0 6.8 4.6 5.4 8.6C25.6 21.8 16 27.5 16 27.5Z" />
          <path class="lm-drop" d="M16 13.2s-3.4 3.8-3.4 6a3.4 3.4 0 0 0 6.8 0c0-2.2-3.4-6-3.4-6Z" />
        </svg>
      </span>
      @if (!soloIcono) {
        <span class="logo-text">Cedros<b>Previene</b></span>
      }
    </span>
  `,
})
export class LogoComponent {
  @Input() soloIcono = false;
}
