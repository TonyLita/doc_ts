import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ValeursIdentite {
  readonly nom: string;
  readonly prenom: string;
  readonly genre: string; // déjà traduit, « – » si non communiqué
  readonly village: string;
  readonly commune: string;
  readonly code: string;
}

export interface LibellesIdentite {
  readonly nom: string;
  readonly prenom: string;
  readonly genre: string;
  readonly village: string;
  readonly commune: string;
  readonly code: string;
}

// Bloc d'identité et de localisation d'un producteur (CDC §8.4) : ces données viennent de l'API externe, en lecture
// seule. Le bloc nomme sa source et ne contient aucun champ modifiable : il ne peut être ni corrigé ni supprimé ici.
@Component({
  selector: 'app-bloc-identite',
  templateUrl: './bloc-identite.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocIdentiteComponent {
  readonly titre = input.required<string>();
  readonly source = input.required<string>(); // « Source : API externe, lecture seule »
  readonly valeurs = input.required<ValeursIdentite>();
  readonly libelles = input.required<LibellesIdentite>();
}
