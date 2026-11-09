import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ElementLegende {
  readonly id: string;
  readonly nom: string;
  readonly couleur: number; // indice de couleur (classe .couleur-zone-N)
  readonly visible: boolean;
}

// Légende de la carte ET filtre par coopérative : cocher affiche les parcelles, décocher les masque.
@Component({
  selector: 'app-legende-cooperatives',
  templateUrl: './legende-cooperatives.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendeCooperativesComponent {
  readonly titre = input.required<string>();
  readonly libelleCentre = input.required<string>();
  readonly elements = input.required<readonly ElementLegende[]>();
  readonly basculer = output<string>();
}
