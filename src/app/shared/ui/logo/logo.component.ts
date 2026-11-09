import { ChangeDetectionStrategy, Component } from '@angular/core';

// Logo SoaTech : icône et texte en UN SEUL bloc, côte à côte (principe de blocage : voir .logo-soatech dans styles.css).
@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
