import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { EtatMenuService } from '../../sidebar/etat-menu.service';

// Bouton de réduction du menu latéral (burger), placé dans la bande d'en-tête.
@Component({
  selector: 'app-bouton-menu',
  imports: [TranslocoPipe],
  templateUrl: './bouton-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoutonMenuComponent {
  protected readonly etatMenu = inject(EtatMenuService);
}
