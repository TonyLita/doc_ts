import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { fenetrePagination } from '../../utils/fenetre-pagination';

// Pagination d'une liste chargée page par page (côté serveur). Affichage pur : la page courante et les textes
// viennent de la page, qui reçoit le choix par la sortie. Avec `numeros`, les numéros de page s'affichent aussi (première,
// dernière et voisines de la page courante) ; par défaut, seuls précédent, résumé et suivant.
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  host: { class: 'pagination', '[class.pagination--numeros]': 'numeros()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>(); // à partir de 1
  readonly nombrePages = input.required<number>();
  readonly libelleResume = input.required<string>(); // ex. « Page 2 sur 5 »
  readonly libellePrecedent = input.required<string>();
  readonly libelleSuivant = input.required<string>();
  readonly numeros = input(false);

  readonly pageChoisie = output<number>();

  protected readonly elements = computed(() => fenetrePagination(this.page(), this.nombrePages()));
}
