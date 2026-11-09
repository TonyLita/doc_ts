import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Affichage pur du bloc de synthèse : un titre, un texte et une note (ex. dernière synchronisation).
@Component({
  selector: 'app-bloc-synthese',
  templateUrl: './bloc-synthese.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocSyntheseComponent {
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly note = input<string>();
}
