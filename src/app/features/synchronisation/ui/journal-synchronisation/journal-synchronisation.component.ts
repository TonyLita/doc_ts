import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { StatutSynchronisation, TypeOrigine } from '../../data-access/synchronisation.modeles';

export interface LigneJournal {
  readonly id: string;
  readonly horodatage: string; // déjà formaté
  readonly origine: string;
  readonly typeOrigine: TypeOrigine;
  readonly cooperative: string;
  readonly enregistrements: string; // déjà formaté
  readonly statut: StatutSynchronisation;
}

export interface LibellesJournal {
  readonly horodatage: string;
  readonly origine: string;
  readonly cooperative: string;
  readonly enregistrements: string;
  readonly statut: string;
  readonly vide: string; // message quand aucune synchronisation ne correspond
  readonly types: Readonly<Record<TypeOrigine, string>>;
  readonly statuts: Readonly<Record<StatutSynchronisation, string>>;
}

// Affichage pur du journal de synchronisation (un vrai tableau, lisible par les lecteurs d'écran). Le statut double
// sa couleur d'une forme : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-journal-synchronisation',
  imports: [PastilleComponent],
  templateUrl: './journal-synchronisation.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalSynchronisationComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneJournal[]>();
  readonly libelles = input.required<LibellesJournal>();

  protected readonly remplissages: Readonly<Record<StatutSynchronisation, Remplissage>> = {
    succes: 'plein',
    partiel: 'moitie',
    erreur: 'vide',
  };
  protected readonly classesStatut: Readonly<Record<StatutSynchronisation, string>> = {
    succes: 'pastille-statut--complet',
    partiel: 'pastille-statut--partiel',
    erreur: 'pastille-statut--erreur',
  };
}
