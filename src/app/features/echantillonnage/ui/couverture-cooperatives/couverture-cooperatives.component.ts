import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface LigneCouverture {
  readonly id: string;
  readonly nom: string;
  readonly taux: number; // en %
  readonly suivis: string; // déjà formaté
  readonly cibles: string; // déjà formaté
}

// Affichage pur du taux de couverture par coopérative : une barre, le taux et « suivis / ciblés ».
@Component({
  selector: 'app-couverture-cooperatives',
  templateUrl: './couverture-cooperatives.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouvertureCooperativesComponent {
  readonly titre = input.required<string>();
  readonly legende = input.required<string>(); // ex. « suivis / ciblés »
  readonly lignes = input.required<readonly LigneCouverture[]>();
}
