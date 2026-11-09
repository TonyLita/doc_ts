import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Cooperative } from '../../models/cooperative';
import { versOptions } from '../../utils/options-liste';
import { ChampListeComponent } from '../champ-liste/champ-liste.component';

// Filtres communs aux pages d'analyse : campagne (une seule) et coopérative (une ou toutes, CDC §8.3, §8.12).
// Affichage pur : les textes et la sélection viennent de la page, qui reçoit les choix par les sorties.
// Les filtres propres à une page (zone, statut…) se projettent à la suite avec <app-champ-liste>.
@Component({
  selector: 'app-filtres-campagne-cooperative',
  imports: [ChampListeComponent],
  templateUrl: './filtres-campagne-cooperative.component.html',
  host: { class: 'barre-filtres' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltresCampagneCooperativeComponent {
  readonly campagnes = input.required<readonly string[]>();
  readonly campagne = input.required<string>();
  readonly campagneEnCours = input.required<string>();
  readonly cooperatives = input.required<readonly Cooperative[]>();
  readonly cooperative = input<string>(); // absente = toutes les coopératives
  readonly libelleCampagne = input.required<string>();
  readonly libelleEnCours = input.required<string>();
  readonly libelleCooperative = input.required<string>();
  readonly libelleToutes = input.required<string>();

  readonly campagneChoisie = output<string>();
  // La valeur vide signifie « toutes les coopératives ».
  readonly cooperativeChoisie = output<string | undefined>();

  protected readonly optionsCampagnes = computed(() =>
    this.campagnes().map((annee) => ({
      valeur: annee,
      libelle: annee === this.campagneEnCours() ? `${annee} (${this.libelleEnCours()})` : annee,
    })),
  );
  protected readonly optionsCooperatives = computed(() => versOptions(this.cooperatives()));
}
