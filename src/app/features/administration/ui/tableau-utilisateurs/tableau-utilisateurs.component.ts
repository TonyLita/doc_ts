import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Profil } from '../../../../core/auth/profil';
import { PastilleComponent } from '../../../../shared/ui/pastille/pastille.component';

export interface LigneUtilisateur {
  readonly identifiant: string;
  readonly profil: Profil;
  readonly langue: string; // nom de la langue préférée, déjà formaté
  readonly actif: boolean;
  readonly estMoi: boolean; // l'utilisateur connecté : on ne se désactive ni ne se rétrograde soi-même
}

export interface LibellesUtilisateurs {
  readonly identifiant: string;
  readonly role: string;
  readonly langue: string;
  readonly statut: string;
  readonly actions: string;
  readonly vide: string;
  readonly moi: string; // « (vous) »
  readonly changerRole: string;
  readonly desactiver: string;
  readonly reactiver: string;
  readonly profils: Readonly<Record<Profil, string>>;
  readonly actif: string;
  readonly desactive: string;
}

// Affichage pur de la liste des comptes (un vrai tableau, lisible par les lecteurs d'écran). Les actions partent par
// les sorties ; la page parle au serveur. Le statut double sa couleur d'une forme : plein = actif, vide = désactivé.
@Component({
  selector: 'app-tableau-utilisateurs',
  imports: [PastilleComponent],
  templateUrl: './tableau-utilisateurs.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauUtilisateursComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneUtilisateur[]>();
  readonly libelles = input.required<LibellesUtilisateurs>();

  readonly changerRole = output<string>();
  readonly desactiver = output<string>();
  readonly reactiver = output<string>();
}
