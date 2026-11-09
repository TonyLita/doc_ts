import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface LigneCooperative {
  readonly id: string;
  readonly nom: string;
  readonly village: string; // village pivot
  readonly commune: string;
  readonly producteurs: string; // déjà formaté
  readonly parcelles: string; // déjà formaté
}

export interface LibellesCooperatives {
  readonly nom: string;
  readonly village: string;
  readonly commune: string;
  readonly producteurs: string;
  readonly parcelles: string;
  readonly actions: string;
  readonly modifier: string;
  readonly supprimer: string;
  readonly vide: string;
}

// Affichage pur de la liste des coopératives (un vrai tableau, lisible par les lecteurs d'écran). Les actions
// n'existent que si le serveur autorise l'administration ; la page reçoit le choix par les sorties. Les effectifs
// sont calculés par le serveur : ils ne se modifient pas ici.
@Component({
  selector: 'app-tableau-cooperatives',
  templateUrl: './tableau-cooperatives.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauCooperativesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneCooperative[]>();
  readonly libelles = input.required<LibellesCooperatives>();
  readonly peutAdministrer = input.required<boolean>();

  readonly modifier = output<string>();
  readonly supprimer = output<string>();
}
