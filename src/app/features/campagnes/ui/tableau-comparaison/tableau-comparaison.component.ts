import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface LigneComparaison {
  readonly campagne: string;
  readonly totalFleurs: string; // déjà formaté
  readonly producteursSuivis: string;
  readonly moisPic: string;
  readonly production: string;
}

export interface LibellesComparaison {
  readonly campagne: string;
  readonly totalFleurs: string;
  readonly producteursSuivis: string;
  readonly moisPic: string;
  readonly production: string;
  readonly vide: string; // message quand aucune campagne n'est cochée
}

// Affichage pur des indicateurs du tableau de bord (CDC §8.7), une ligne par campagne comparée.
@Component({
  selector: 'app-tableau-comparaison',
  templateUrl: './tableau-comparaison.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauComparaisonComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneComparaison[]>();
  readonly libelles = input.required<LibellesComparaison>();
}
