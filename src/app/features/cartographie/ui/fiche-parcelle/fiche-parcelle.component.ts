import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Fiche résumée d'une parcelle (CDC §8.9) : producteur, coopérative, nombre de pieds, production estimée.
@Component({
  selector: 'app-fiche-parcelle',
  templateUrl: './fiche-parcelle.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FicheParcelleComponent {
  readonly producteur = input.required<string>();
  readonly cooperative = input.required<string>();
  readonly pieds = input.required<string>();
  readonly production = input.required<string>();
  readonly libelleCooperative = input.required<string>();
  readonly libellePieds = input.required<string>();
  readonly libelleProduction = input.required<string>();
}
