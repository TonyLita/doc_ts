import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PastilleComponent, Remplissage } from '../../../../shared/ui/pastille/pastille.component';
import { StatutEchantillonnage } from '../../data-access/producteurs.modeles';

export interface LibellesStatutEchantillonnage {
  readonly suiviActif: string;
  readonly recense: string;
  readonly aCompleter: string;
}

interface Presentation {
  readonly remplissage: Remplissage;
  readonly classe: string;
}

// Suivi actif = plein et vert ; recensé uniquement = vide ; à compléter (couche locale pas encore saisie) = moitié et ambre.
const presentations: Readonly<Record<StatutEchantillonnage | 'a-completer', Presentation>> = {
  'suivi-actif': { remplissage: 'plein', classe: 'pastille-statut--complet' },
  recense: { remplissage: 'vide', classe: 'pastille-statut--en-attente' },
  'a-completer': { remplissage: 'moitie', classe: 'pastille-statut--partiel' },
};

// Affichage pur du statut d'échantillonnage d'un producteur (CDC §8.4). Il double sa couleur d'une forme et d'un
// texte : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-statut-echantillonnage',
  imports: [PastilleComponent],
  templateUrl: './statut-echantillonnage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatutEchantillonnageComponent {
  readonly statut = input.required<StatutEchantillonnage | null>(); // null : à compléter
  readonly libelles = input.required<LibellesStatutEchantillonnage>();

  protected readonly presentation = computed(() => presentations[this.statut() ?? 'a-completer']);
  protected readonly libelle = computed(() => {
    const statut = this.statut();
    const libelles = this.libelles();
    return statut === 'suivi-actif' ? libelles.suiviActif : statut === 'recense' ? libelles.recense : libelles.aCompleter;
  });
}
