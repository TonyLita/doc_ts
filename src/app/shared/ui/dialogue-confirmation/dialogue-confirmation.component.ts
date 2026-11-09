import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';

// Confirmation d'une action sensible (ex. changer la campagne active). Affichage pur : la page l'affiche
// uniquement quand une confirmation est demandée et reçoit le choix par les sorties. Le <dialog> natif gère le
// piège du focus et l'arrière-plan inerte ; la touche Échap équivaut à « annuler ».
@Component({
  selector: 'app-dialogue-confirmation',
  templateUrl: './dialogue-confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogueConfirmationComponent {
  readonly titre = input.required<string>();
  readonly message = input.required<string>();
  readonly libelleConfirmer = input.required<string>();
  readonly libelleAnnuler = input.required<string>();

  readonly confirmer = output<void>();
  readonly annuler = output<void>();

  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  constructor() {
    afterNextRender(() => this.dialogue().nativeElement.showModal());
  }

  protected abandonner(evenement: Event): void {
    evenement.preventDefault(); // la page retire le composant, le navigateur ne ferme pas le dialogue lui-même
    this.annuler.emit();
  }
}
