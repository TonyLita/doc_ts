import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatutDonnees } from '../../models/statut-donnees';
import { PastilleComponent, Remplissage } from '../pastille/pastille.component';

export interface ElementStatutMois {
  readonly libelle: string; // nom du mois, déjà formaté
  readonly statut: StatutDonnees;
}

export type LibellesStatut = Readonly<Record<StatutDonnees, string>>;

// Affichage pur du statut des données par mois. La forme (plein, moitié, vide) double la couleur :
// le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-statut-mois',
  imports: [PastilleComponent],
  templateUrl: './statut-mois.component.html',
  host: { class: 'carte carte--large' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatutMoisComponent {
  readonly libelle = input.required<string>();
  readonly elements = input.required<readonly ElementStatutMois[]>();
  readonly libellesStatut = input.required<LibellesStatut>();

  protected readonly statuts: readonly StatutDonnees[] = ['complet', 'partiel', 'en-attente'];
  protected readonly remplissages: Readonly<Record<StatutDonnees, Remplissage>> = {
    complet: 'plein',
    partiel: 'moitie',
    'en-attente': 'vide',
  };
}
