import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface LigneHistorique {
  readonly id: string;
  readonly date: string; // déjà formaté
  readonly utilisateur: string;
  readonly fichier: string;
  readonly type: string; // code du type, traduit par LibellesHistorique.types
  readonly creees: string;
  readonly miseAJour: string;
  readonly rejetees: string;
}

export interface LibellesHistorique {
  readonly date: string;
  readonly utilisateur: string;
  readonly fichier: string;
  readonly type: string;
  readonly creees: string;
  readonly miseAJour: string;
  readonly rejetees: string;
  readonly vide: string;
  readonly types: Readonly<Record<string, string>>;
}

// Affichage pur du journal des imports (CDC §8.16, règle 3) : qui a importé quoi, quand, avec quel résultat.
@Component({
  selector: 'app-historique-imports',
  templateUrl: './historique-imports.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoriqueImportsComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneHistorique[]>();
  readonly libelles = input.required<LibellesHistorique>();
}
