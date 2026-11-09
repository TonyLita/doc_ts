import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SelecteurLangueComponent } from '../../../shared/ui/selecteur-langue/selecteur-langue.component';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

// Header unique de la plateforme : utilisé par la coquille (pages protégées) et par les pages publiques.
@Component({
  selector: 'app-header',
  imports: [SelecteurLangueComponent, ThemeToggleComponent],
  templateUrl: './header.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
