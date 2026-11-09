import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface LigneListeParcelle {
  readonly id: string;
  readonly code: string;
  readonly producteur: string;
  readonly cooperative: string;
  readonly latitude: string; // déjà formaté
  readonly longitude: string; // déjà formaté
  readonly pieds: string; // déjà formaté
  readonly production: string; // déjà formaté
  readonly zone: string; // déjà prêt à afficher (« – » si le village n'a pas de zone)
  readonly vanille: boolean;
  readonly archivee: boolean;
}

export interface LibellesListeParcelles {
  readonly code: string;
  readonly producteur: string;
  readonly cooperative: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly pieds: string;
  readonly production: string;
  readonly zone: string;
  readonly vanille: string;
  readonly oui: string;
  readonly non: string;
  readonly archivee: string; // marque d'une parcelle archivée
  readonly actions: string;
  readonly modifier: string;
  readonly archiver: string;
  readonly restaurer: string;
  readonly vide: string; // message quand aucune parcelle ne correspond
}

// Affichage pur de la liste des parcelles (un vrai tableau, lisible par les lecteurs d'écran). Les actions n'existent que
// si le serveur autorise l'administration ; la page reçoit le choix par les sorties. La production est une estimation
// indicative calculée par le serveur : elle ne se modifie pas ici.
@Component({
  selector: 'app-liste-parcelles',
  templateUrl: './liste-parcelles.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListeParcellesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneListeParcelle[]>();
  readonly libelles = input.required<LibellesListeParcelles>();
  readonly peutAdministrer = input.required<boolean>();

  readonly modifier = output<string>();
  readonly archiver = output<string>();
  readonly restaurer = output<string>();
}
