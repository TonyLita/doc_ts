import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Profil } from '../../../../core/auth/profil';
import { PastilleComponent } from '../../../../shared/ui/pastille/pastille.component';
import { DroitPlateforme } from '../../data-access/administration.modeles';

export interface ColonneProfil {
  readonly profil: Profil;
  readonly libelle: string; // déjà traduit
}

export interface LignePermission {
  readonly droit: DroitPlateforme;
  readonly profils: readonly Profil[];
}

export interface LibellesPermissions {
  readonly droit: string;
  readonly autorise: string;
  readonly refuse: string;
  readonly droits: Readonly<Record<DroitPlateforme, string>>;
}

// Affichage pur du tableau récapitulatif des permissions par profil (CDC §8.17), consultable par tous. L'accord
// ou le refus d'un droit se lit à la forme (pastille pleine ou vide) et au texte : jamais à la couleur seule.
@Component({
  selector: 'app-matrice-permissions',
  imports: [PastilleComponent],
  templateUrl: './matrice-permissions.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatricePermissionsComponent {
  readonly titre = input.required<string>();
  readonly colonnes = input.required<readonly ColonneProfil[]>();
  readonly lignes = input.required<readonly LignePermission[]>();
  readonly libelles = input.required<LibellesPermissions>();
}
