import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SegmentRepartition {
  readonly id: string;
  readonly nom: string;
  readonly rang: number; // rang de la couleur de la zone (même rang = même couleur que les graphiques)
  readonly part: number; // part des villages, de 0 à 100 (largeur du segment)
  readonly villages: string; // déjà formaté
  readonly pourcentage: string; // déjà formaté
  readonly parcelles: string; // déjà formaté
}

// Villages qui n'ont pas encore de zone : segment neutre, à rattacher.
export interface SegmentSansZone {
  readonly part: number;
  readonly villages: string;
  readonly pourcentage: string;
  readonly parcelles: string;
}

export interface LibellesRepartition {
  readonly villages: string;
  readonly parcelles: string;
  readonly sansZone: string;
  readonly sansZoneDetail: string; // « à rattacher à une zone »
}

// Répartition des villages par type de zone (CDC §8.2) : une barre proportionnelle et, dessous, la légende chiffrée
// (nombre de villages, pourcentage, nombre de parcelles). Les couleurs sont celles des graphiques ; la barre est
// décorative, le sens est porté par la légende : jamais la couleur seule.
@Component({
  selector: 'app-repartition-zones',
  templateUrl: './repartition-zones.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepartitionZonesComponent {
  readonly titre = input.required<string>();
  readonly segments = input.required<readonly SegmentRepartition[]>();
  readonly sansZone = input<SegmentSansZone>(); // absent : tous les villages ont une zone
  readonly libelles = input.required<LibellesRepartition>();
}
