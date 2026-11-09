import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NomIcone = 'details' | 'saisie' | 'fermer' | 'chevron';

// Icône de bouton ou de lien : un dessin au trait qui prend la couleur du texte. Décorative (masquée aux lecteurs
// d'écran) : le bouton ou le lien qui la contient porte son nom accessible (aria-label) et son infobulle (title).
@Component({
  selector: 'app-icone',
  templateUrl: './icone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconeComponent {
  readonly nom = input.required<NomIcone>();
}
