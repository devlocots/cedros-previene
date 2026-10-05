import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <span class="logo">
      <span class="logo-mark">
        <svg width="20" height="20" viewBox="0 0 26 26" aria-hidden="true">
          <path d="M13 2 L22 15 H17 L23 23 H3 L9 15 H4 Z" fill="currentColor" />
          <rect x="11.5" y="20" width="3" height="5" fill="currentColor" />
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
