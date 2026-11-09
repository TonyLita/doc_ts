import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Affichage pur de l'indicateur de représentativité (CDC §8.10) : signale quand une famille n'a pas assez
// d'observations pour être statistiquement significative. Icône et texte : jamais la couleur seule.
@Component({
  selector: 'app-badge-representativite',
  templateUrl: './badge-representativite.component.html',
  host: {
    class: 'badge-representativite',
    '[class.badge-representativite--insuffisant]': '!representatif()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeRepresentativiteComponent {
  readonly representatif = input.required<boolean>();
  readonly libelle = input.required<string>(); // texte complet, ex. « Représentatif (412 obs.) »
}
