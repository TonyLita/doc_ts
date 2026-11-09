import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ChoixCampagne {
  readonly id: string;
  readonly choisie: boolean;
}

// Choix des campagnes à comparer : une case par campagne de l'historique. Affichage pur : la page garde la sélection.
@Component({
  selector: 'app-selecteur-campagnes',
  templateUrl: './selecteur-campagnes.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelecteurCampagnesComponent {
  readonly titre = input.required<string>();
  readonly choix = input.required<readonly ChoixCampagne[]>();

  readonly basculer = output<string>();
}
