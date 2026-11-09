import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';

export interface Onglet {
  readonly id: string;
  readonly libelle: string;
}

// Onglets d'une page (modèle WAI-ARIA « tabs ») : un seul est actif et la page affiche son contenu. Affichage pur :
// la page garde l'onglet actif et reçoit le choix par la sortie. Au clavier, les flèches gauche et droite, Début et
// Fin changent d'onglet. Le panneau de la page doit porter `role="tabpanel"`, l'identifiant `<identifiant>-panneau-<id>`
// et `aria-labelledby="<identifiant>-onglet-<id>"` (l'identifiant relie chaque onglet à son panneau).
@Component({
  selector: 'app-onglets',
  templateUrl: './onglets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OngletsComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly identifiant = input.required<string>();
  readonly libelle = input.required<string>(); // nom accessible de la liste d'onglets
  readonly onglets = input.required<readonly Onglet[]>();
  readonly actif = input.required<string>();

  readonly choisi = output<string>();

  protected naviguer(evenement: KeyboardEvent, indice: number): void {
    const dernier = this.onglets().length - 1;
    const cibles: Record<string, number> = {
      ArrowRight: indice === dernier ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? dernier : indice - 1,
      Home: 0,
      End: dernier,
    };
    const cible = cibles[evenement.key];
    if (cible === undefined) {
      return;
    }
    evenement.preventDefault();
    this.choisi.emit(this.onglets()[cible].id);
    this.element.nativeElement.querySelectorAll<HTMLElement>('[role="tab"]')[cible]?.focus();
  }
}
