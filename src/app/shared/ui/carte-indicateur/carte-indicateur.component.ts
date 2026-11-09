import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Affichage pur d'un indicateur clé : libellé, valeur, barre de progression et précision facultatives.
@Component({
  selector: 'app-carte-indicateur',
  templateUrl: './carte-indicateur.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarteIndicateurComponent {
  readonly libelle = input.required<string>();
  readonly valeur = input.required<string>();
  readonly detail = input<string>();
  // Pourcentage de 0 à 100 ; la barre n'est affichée que s'il est fourni.
  readonly progression = input<number>();
}
