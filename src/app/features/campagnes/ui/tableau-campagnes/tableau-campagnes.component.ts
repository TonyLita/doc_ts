import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { StatutCampagne } from '../../data-access/campagnes.modeles';

export interface LigneCampagne {
  readonly id: string;
  readonly debut: string; // déjà formaté
  readonly fin: string; // déjà formaté
  readonly statut: StatutCampagne;
  readonly active: boolean;
}

export interface LibellesCampagnes {
  readonly campagne: string;
  readonly debut: string;
  readonly fin: string;
  readonly statut: string;
  readonly active: string;
  readonly actions: string;
  readonly activeOui: string; // texte de la campagne active
  readonly modifier: string;
  readonly cloturer: string;
  readonly definirActive: string;
  readonly vide: string;
  readonly statuts: Readonly<Record<StatutCampagne, string>>;
}

// Affichage pur de l'historique des campagnes (un vrai tableau, lisible par les lecteurs d'écran). Les actions
// n'existent que si le serveur autorise l'administration ; la page reçoit le choix par les sorties.
// Le statut double sa couleur d'une forme : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-tableau-campagnes',
  imports: [PastilleComponent],
  templateUrl: './tableau-campagnes.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauCampagnesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneCampagne[]>();
  readonly libelles = input.required<LibellesCampagnes>();
  readonly peutAdministrer = input.required<boolean>();

  readonly modifier = output<string>();
  readonly cloturer = output<string>();
  readonly activer = output<string>();

  protected readonly remplissages: Readonly<Record<StatutCampagne, Remplissage>> = {
    'en-cours': 'plein',
    cloturee: 'vide',
  };
  protected readonly classesStatut: Readonly<Record<StatutCampagne, string>> = {
    'en-cours': 'pastille-statut--complet',
    cloturee: 'pastille-statut--en-attente',
  };
}
