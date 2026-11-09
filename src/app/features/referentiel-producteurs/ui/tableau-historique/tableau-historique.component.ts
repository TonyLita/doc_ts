import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatutValidation } from '../../../../shared/models/statut-validation';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { CalibrageFleurs, PeriodeFloraison, QuantiteFloraison } from '../../data-access/producteurs.modeles';

export interface LigneHistorique {
  readonly id: string;
  readonly date: string; // déjà formatée
  readonly campagne: string;
  readonly quantite: QuantiteFloraison;
  readonly periode: PeriodeFloraison;
  readonly calibrage: CalibrageFleurs | null; // null : non renseigné
  readonly statutValidation: StatutValidation;
}

export interface LibellesHistorique {
  readonly date: string;
  readonly campagne: string;
  readonly quantite: string;
  readonly periode: string;
  readonly calibrage: string;
  readonly validation: string;
  readonly vide: string; // message quand le producteur n'a aucune observation
  readonly quantites: Readonly<Record<QuantiteFloraison, string>>;
  readonly periodes: Readonly<Record<PeriodeFloraison, string>>;
  readonly calibrages: Readonly<Record<CalibrageFleurs, string>>;
  readonly statuts: Readonly<Record<StatutValidation, string>>;
}

// Affichage pur de l'historique consolidé des observations de floraison d'un producteur (CDC §8.4, règle 4, §8.10).
// Le statut de validation double sa couleur d'une forme : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-tableau-historique',
  imports: [PastilleComponent],
  templateUrl: './tableau-historique.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauHistoriqueComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneHistorique[]>();
  readonly libelles = input.required<LibellesHistorique>();

  protected readonly remplissages: Readonly<Record<StatutValidation, Remplissage>> = {
    valide: 'plein',
    'en-attente': 'vide',
  };
  // Mêmes couleurs que le tableau de l'échantillonnage : vert pour validé, ambre pour en attente.
  protected readonly classesStatut: Readonly<Record<StatutValidation, string>> = {
    valide: 'pastille-statut--complet',
    'en-attente': 'pastille-statut--partiel',
  };
}
