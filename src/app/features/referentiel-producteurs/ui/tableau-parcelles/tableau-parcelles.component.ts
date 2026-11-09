import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface LigneParcelle {
  readonly id: string;
  readonly libelle: string;
  readonly coordonnees: string; // « latitude, longitude » déjà formatées, « – » si non communiquées
  readonly pieds: string; // déjà formaté
}

export interface LibellesParcelles {
  readonly libelle: string;
  readonly coordonnees: string;
  readonly pieds: string;
  readonly vide: string;
}

// Affichage pur des parcelles d'un producteur (CDC §8.4, règle 3 : une ou plusieurs parcelles géolocalisées).
@Component({
  selector: 'app-tableau-parcelles',
  templateUrl: './tableau-parcelles.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauParcellesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneParcelle[]>();
  readonly libelles = input.required<LibellesParcelles>();
}
