import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Légende commune aux graphiques : une pastille de couleur par zone (même ordre = même couleur).
@Component({
  selector: 'app-legende-zones',
  templateUrl: './legende-zones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendeZonesComponent {
  readonly zones = input.required<readonly string[]>();
}
