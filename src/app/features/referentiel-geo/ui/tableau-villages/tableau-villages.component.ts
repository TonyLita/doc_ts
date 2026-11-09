import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { OptionListe } from '../../../../shared/ui/champ-liste/champ-liste.component';

export interface LigneVillage {
  readonly id: string;
  readonly commune: string;
  readonly village: string;
  readonly zone: string; // identifiant de la zone affichée (brouillon compris), vide si le village n'a pas de zone
  readonly zoneNom: string; // nom de cette zone, vide si le village n'a pas de zone
  readonly modifiee: boolean; // zone changée mais pas encore enregistrée
  readonly choisie: boolean; // cochée pour l'affectation en lot
}

export interface LibellesVillages {
  readonly commune: string;
  readonly village: string;
  readonly zone: string;
  readonly nonDefini: string; // « — non défini — »
  readonly modifiee: string; // marque d'une zone en attente d'enregistrement
  readonly choisir: string; // préfixe de l'étiquette de la case d'une ligne
  readonly toutChoisir: string; // étiquette de la case de l'en-tête
  readonly vide: string;
}

export interface ZoneChangee {
  readonly village: string;
  readonly zone: string | null;
}

export interface LigneChoisie {
  readonly village: string;
  readonly choisie: boolean;
}

// Affichage pur des villages (un vrai tableau, lisible par les lecteurs d'écran). Commune et village sont en lecture
// seule (API externe, CDC §8.2) ; seule la zone se change, et seulement si le serveur l'autorise (`modifiable`).
// Les changements partent par les sorties : la page garde le brouillon et parle au serveur.
@Component({
  selector: 'app-tableau-villages',
  templateUrl: './tableau-villages.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauVillagesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneVillage[]>();
  readonly zones = input.required<readonly OptionListe[]>();
  readonly libelles = input.required<LibellesVillages>();
  readonly modifiable = input.required<boolean>();
  readonly toutesChoisies = input.required<boolean>();

  readonly zoneChangee = output<ZoneChangee>();
  readonly ligneChoisie = output<LigneChoisie>();
  readonly toutChoisi = output<boolean>();

  protected readonly nombreColonnes = computed(() => (this.modifiable() ? 4 : 3));

  protected lireZone(evenement: Event): string | null {
    return (evenement.target as HTMLSelectElement).value || null;
  }

  protected lireCoche(evenement: Event): boolean {
    return (evenement.target as HTMLInputElement).checked;
  }
}
