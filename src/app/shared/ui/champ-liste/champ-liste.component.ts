import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface OptionListe {
  readonly valeur: string;
  readonly libelle: string;
}

// Liste déroulante native avec son libellé : brique commune de tous les filtres (style .champ-filtre).
// Si `libelleToutes` est fourni, une première option de valeur vide permet de ne rien filtrer.
@Component({
  selector: 'app-champ-liste',
  templateUrl: './champ-liste.component.html',
  host: { class: 'champ-filtre' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampListeComponent {
  readonly libelle = input.required<string>();
  readonly options = input.required<readonly OptionListe[]>();
  readonly valeur = input<string>(''); // vide = « toutes »
  readonly libelleToutes = input<string>();

  readonly choisie = output<string>();

  protected lire(evenement: Event): string {
    return (evenement.target as HTMLSelectElement).value;
  }
}
