import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface CarteParcelle {
  readonly id: string;
  readonly nom: string; // nom de la parcelle : son code
  readonly rang: number | null; // rang de la couleur de la zone ; null : parcelle sans zone
  readonly zoneNom: string; // nom de la zone, vide si la parcelle n'a pas de zone
  readonly fleurs: string; // déjà formaté
  readonly derniereSaisie: string; // déjà formatée, « – » si aucune saisie
}

export interface LibellesCartesParcelles {
  readonly zone: string;
  readonly fleurs: string;
  readonly derniereSaisie: string;
  readonly sansZone: string;
  readonly vide: string;
}

// Parcelles d'un producteur (CDC §8.4, règle 3), une carte par parcelle : son nom, son type de zone (couleur des
// graphiques, toujours doublée du nom), les fleurs pollinisées saisies et la date de la dernière saisie. Affichage pur.
@Component({
  selector: 'app-cartes-parcelles',
  templateUrl: './cartes-parcelles.component.html',
  host: { class: 'section-cartes' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartesParcellesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly CarteParcelle[]>();
  readonly libelles = input.required<LibellesCartesParcelles>();
}
