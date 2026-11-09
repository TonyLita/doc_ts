import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Carte d'un export du centre d'exports : titre, description, puis le contenu propre à l'export (boutons, options,
// aperçu) projeté à l'intérieur, et le message d'erreur éventuel. Affichage pur.
@Component({
  selector: 'app-carte-export',
  templateUrl: './carte-export.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarteExportComponent {
  readonly titre = input.required<string>();
  readonly description = input.required<string>();
  readonly erreur = input<string>(); // message déjà traduit
}
