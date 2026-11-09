import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconeComponent } from '../../../../shared/ui/icone/icone.component';

// Zone d'un producteur telle que la pastille l'affiche : son nom et sa couleur (rang 0 à 4 dans la liste des zones).
export interface ZoneListeProducteur {
  readonly nom: string;
  readonly rang: number;
}

export interface LigneListeProducteur {
  readonly id: string;
  readonly numero: string; // rang dans la liste filtrée, déjà formaté
  readonly nom: string; // nom et prénom(s)
  readonly village: string;
  readonly zone: ZoneListeProducteur | undefined; // undefined : le village n'a pas de zone
  readonly pieds: string; // déjà formaté, « – » si absent
  readonly age: string | undefined; // déjà formaté, sans unité ; undefined si absent
  readonly mois: readonly string[]; // fleurs de chaque mois, déjà formatées, même ordre que les en-têtes `mois`
  readonly fleurs: string; // total, déjà formaté
}

export interface LibellesListeProducteurs {
  readonly numero: string;
  readonly producteur: string;
  readonly village: string; // « Fokontany »
  readonly zone: string;
  readonly sansZone: string;
  readonly pieds: string;
  readonly age: string;
  readonly uniteAge: string; // collée à l'âge : « a »
  readonly absent: string; // « – »
  readonly total: string;
  readonly action: string;
  readonly details: string; // préfixe du nom accessible de l'icône : « Détails de … »
  readonly saisir: string; // préfixe du nom accessible de l'icône : « Saisir données floraison de … »
  readonly vide: string;
}

// Nombre de colonnes qui ne sont pas des mois : N°, nom, village, zone, pieds, âge, total, action.
const colonnesFixes = 8;

// Affichage pur de la liste des producteurs (un vrai tableau, lisible par les lecteurs d'écran) : une colonne par mois de
// la campagne. La carte accueille en haut la recherche et le filtre de zone (emplacement `haut`) et en bas la pagination
// (emplacement `bas`). Les actions sont deux icônes : « Détails » mène à la fiche, « Saisir données floraison » (seulement
// si le serveur l'autorise) part par la sortie. Il n'existe ni création ni suppression : un producteur apparaît parce que
// l'API externe le fournit (CDC §8.4).
@Component({
  selector: 'app-liste-producteurs',
  imports: [RouterLink, IconeComponent],
  templateUrl: './liste-producteurs.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListeProducteursComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneListeProducteur[]>();
  readonly mois = input.required<readonly string[]>(); // en-têtes des colonnes de mois, déjà nommés dans la langue
  readonly libelles = input.required<LibellesListeProducteurs>();
  readonly peutSaisir = input.required<boolean>();

  readonly saisir = output<string>();

  protected readonly colonnesFixes = colonnesFixes;
}
