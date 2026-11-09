import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { ControleLigne } from '../../data-access/imports.modeles';

export interface ColonneApercu {
  readonly cle: string; // clé dans les valeurs de la ligne ; son libellé vient de LibellesApercu.colonnes
  readonly nombre?: boolean; // aligné à droite
}

export interface LigneApercuAffichee {
  readonly numero: number;
  readonly valeurs: Readonly<Record<string, string>>; // déjà formatées
  readonly controle: ControleLigne;
  readonly motif?: string; // code du motif, traduit par LibellesApercu.motifs
}

export interface LibellesApercu {
  readonly ligne: string;
  readonly controle: string;
  readonly vide: string;
  readonly controles: Readonly<Record<ControleLigne, string>>;
  readonly colonnes: Readonly<Record<string, string>>;
  readonly motifs: Readonly<Record<string, string>>;
}

// Affichage pur de l'aperçu d'un import : une ligne du fichier par ligne du tableau, avec son contrôle. Le contrôle
// double sa couleur d'une forme (plein, moitié, vide) : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-tableau-apercu',
  imports: [PastilleComponent],
  templateUrl: './tableau-apercu.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauApercuComponent {
  readonly titre = input.required<string>();
  readonly colonnes = input.required<readonly ColonneApercu[]>();
  readonly lignes = input.required<readonly LigneApercuAffichee[]>();
  readonly libelles = input.required<LibellesApercu>();

  protected readonly remplissages: Readonly<Record<ControleLigne, Remplissage>> = {
    valide: 'plein',
    'a-verifier': 'moitie',
    rejetee: 'vide',
  };
  protected readonly classes: Readonly<Record<ControleLigne, string>> = {
    valide: 'pastille-statut--complet',
    'a-verifier': 'pastille-statut--partiel',
    rejetee: 'pastille-statut--erreur',
  };
}
