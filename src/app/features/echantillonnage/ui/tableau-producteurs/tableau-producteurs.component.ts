import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { StatutValidation } from '../../../../shared/models/statut-validation';
import { ProducteurEchantillonne } from '../../data-access/echantillonnage.modeles';

export interface LibellesTableau {
  readonly producteur: string;
  readonly village: string;
  readonly cooperative: string;
  readonly zone: string;
  readonly leadFarmers: string;
  readonly statut: string;
  readonly vide: string; // message quand aucun producteur ne correspond
  readonly statuts: Readonly<Record<StatutValidation, string>>;
}

// Affichage pur de la liste des producteurs échantillonnés (un vrai tableau, lisible par les lecteurs d'écran).
// Le statut de validation double sa couleur d'une forme : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-tableau-producteurs',
  imports: [PastilleComponent],
  templateUrl: './tableau-producteurs.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauProducteursComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly ProducteurEchantillonne[]>();
  readonly libelles = input.required<LibellesTableau>();

  protected readonly remplissages: Readonly<Record<StatutValidation, Remplissage>> = {
    valide: 'plein',
    'en-attente': 'vide',
  };
  // Réutilise les couleurs des statuts de données : vert pour validé, ambre pour en attente.
  protected readonly classesStatut: Readonly<Record<StatutValidation, string>> = {
    valide: 'pastille-statut--complet',
    'en-attente': 'pastille-statut--partiel',
  };
}
