import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

// Bouton qui copie un texte dans le presse-papiers puis le confirme (« Copié »). Brique commune : rapports IA,
// résumé des exports.
@Component({
  selector: 'app-bouton-copier',
  templateUrl: './bouton-copier.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoutonCopierComponent {
  readonly texte = input.required<string>();
  readonly libelleCopier = input.required<string>();
  readonly libelleCopie = input.required<string>();

  // Le retour « Copié » disparaît dès que le texte change : il ne concerne plus le nouveau texte.
  protected readonly copie = linkedSignal({ source: this.texte, computation: () => false });

  protected async copier(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.texte());
      this.copie.set(true);
    } catch {
      this.copie.set(false); // presse-papiers refusé par le navigateur : le texte reste sélectionnable
    }
  }
}
