import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface LigneHistoriqueFloraison {
  readonly id: string;
  readonly date: string; // déjà formatée
  readonly fleurs: string; // déjà formaté
}

export interface LibellesHistoriqueFloraison {
  readonly date: string;
  readonly fleurs: string;
  readonly vide: string; // message quand aucune saisie n'a été faite
}

// Historique des données de floraison déjà saisies pour un producteur : la date de saisie et le nombre de fleurs
// pollinisées (un vrai tableau, lisible par les lecteurs d'écran). Affichage pur.
@Component({
  selector: 'app-historique-floraison',
  templateUrl: './historique-floraison.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoriqueFloraisonComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneHistoriqueFloraison[]>();
  readonly libelles = input.required<LibellesHistoriqueFloraison>();
}
