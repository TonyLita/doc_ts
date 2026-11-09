import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type Remplissage = 'plein' | 'moitie' | 'vide';

// Pastille ronde (pleine, à moitié ou vide) : la forme porte le sens, la couleur vient du texte du parent
// (currentColor). Utilisée pour les statuts et les profils : le sens ne dépend jamais de la couleur seule.
@Component({
  selector: 'app-pastille',
  templateUrl: './pastille.component.html',
  host: { class: 'pastille' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastilleComponent {
  readonly remplissage = input.required<Remplissage>();
}
