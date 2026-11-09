import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ChampListeComponent, OptionListe } from '../../../../shared/ui/champ-liste/champ-liste.component';

export interface LibellesAffectation {
  readonly affecter: string; // « Affecter la sélection à »
  readonly choisirZone: string; // première option, sans valeur
  readonly appliquer: string;
  readonly selection: string; // « Villages sélectionnés : 3 », déjà formaté
  readonly enAttente: string; // « Modifications en attente : 5 », déjà formaté
  readonly enregistrer: string;
  readonly annuler: string;
}

// Affectation en lot et validation des changements de zone (CDC §8.2) : un référentiel de plusieurs centaines de
// villages ne se paramètre pas un par un. Affichage pur : la zone choisie pour le lot est le seul état local ; la
// page garde la sélection et le brouillon et relaie les trois actions par les sorties.
@Component({
  selector: 'app-barre-affectation',
  imports: [ChampListeComponent],
  templateUrl: './barre-affectation.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarreAffectationComponent {
  readonly zones = input.required<readonly OptionListe[]>();
  readonly libelles = input.required<LibellesAffectation>();
  readonly nombreSelectionnes = input.required<number>();
  readonly nombreModifications = input.required<number>();
  readonly enCours = input.required<boolean>();

  readonly affecter = output<string>();
  readonly enregistrer = output<void>();
  readonly annuler = output<void>();

  protected readonly zoneDuLot = signal('');

  protected appliquer(): void {
    this.affecter.emit(this.zoneDuLot());
  }
}
