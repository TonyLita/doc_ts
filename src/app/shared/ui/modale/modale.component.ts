import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { IconeComponent } from '../icone/icone.component';

// Fenêtre modale à contenu libre (ex. un formulaire et son historique). Affichage pur : la page l'affiche uniquement
// quand elle doit être ouverte et reçoit la fermeture par la sortie. Le <dialog> natif gère le piège du focus et
// l'arrière-plan inerte ; la touche Échap et le bouton de fermeture demandent la fermeture. (Pour une simple
// confirmation, voir dialogue-confirmation.)
@Component({
  selector: 'app-modale',
  imports: [IconeComponent],
  templateUrl: './modale.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModaleComponent {
  readonly titre = input.required<string>();
  readonly libelleFermer = input.required<string>();

  readonly fermer = output<void>();

  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  constructor() {
    afterNextRender(() => this.dialogue().nativeElement.showModal());
  }

  protected abandonner(evenement: Event): void {
    evenement.preventDefault(); // la page retire le composant, le navigateur ne ferme pas le dialogue lui-même
    this.fermer.emit();
  }
}
