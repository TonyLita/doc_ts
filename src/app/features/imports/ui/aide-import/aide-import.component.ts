import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface EtapeAide {
  readonly titre: string;
  readonly texte: string;
}

// Aide de la page d'import : les étapes à suivre, numérotées, puis une note. Affichage pur : tous les textes arrivent déjà
// traduits.
@Component({
  selector: 'app-aide-import',
  templateUrl: './aide-import.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AideImportComponent {
  readonly titre = input.required<string>();
  readonly etapes = input.required<readonly EtapeAide[]>();
  readonly libelleNote = input.required<string>(); // « Note »
  readonly note = input.required<string>();
}
