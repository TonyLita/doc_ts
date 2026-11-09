import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { ProfilPeriode } from '../../data-access/analyse-zones.modeles';

// Affichage pur du profil de période d'une zone : forme, couleur et libellé (jamais la couleur seule).
@Component({
  selector: 'app-profil-periode',
  imports: [PastilleComponent],
  templateUrl: './profil-periode.component.html',
  host: { class: 'profil-periode', '[class]': '"profil-periode--" + profil()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilPeriodeComponent {
  readonly profil = input.required<ProfilPeriode>();
  readonly libelle = input.required<string>();

  protected readonly remplissages: Readonly<Record<ProfilPeriode, Remplissage>> = {
    precoce: 'moitie',
    normal: 'plein',
    retarde: 'vide',
  };
}
