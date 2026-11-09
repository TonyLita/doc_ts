import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../core/i18n/langue.service';
import { estLangue, languesDisponibles, nomsLangues } from '../../../core/i18n/langues';

@Component({
  selector: 'app-selecteur-langue',
  imports: [TranslocoPipe],
  templateUrl: './selecteur-langue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelecteurLangueComponent {
  protected readonly serviceLangue = inject(LangueService);
  protected readonly langues = languesDisponibles;
  protected readonly nomsLangues = nomsLangues;

  protected choisir(evenement: Event): void {
    const valeur = (evenement.target as HTMLSelectElement).value;
    if (estLangue(valeur)) {
      this.serviceLangue.changerLangue(valeur);
    }
  }
}
