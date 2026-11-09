import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TypeRapport } from '../../data-access/rapports-ia.modeles';

export interface OptionTypeRapport {
  readonly valeur: TypeRapport;
  readonly libelle: string;
}

export interface LibellesFormulaireRapport {
  readonly type: string;
  readonly instructions: string; // « Instructions complémentaires (facultatif) »
  readonly langue: string; // « Langue de sortie »
  readonly generer: string;
  readonly enCours: string; // texte du bouton pendant la génération
  readonly noteType: Readonly<Partial<Record<TypeRapport, string>>>; // précisions affichées sous un type
}

export interface ParametresRapport {
  readonly type: TypeRapport;
  readonly instructions: string;
}

// Paramètres d'un rapport : type, consignes libres facultatives, langue (imposée par la langue active, affichée
// sans choix). Affichage pur : la demande part par la sortie `generer`, la page parle au serveur.
@Component({
  selector: 'app-formulaire-rapport',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-rapport.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireRapportComponent {
  readonly titre = input.required<string>();
  readonly types = input.required<readonly OptionTypeRapport[]>();
  readonly langue = input.required<string>(); // nom de la langue de sortie, déjà formaté
  readonly longueurMax = input.required<number>(); // limite des instructions, appliquée aussi par le serveur
  readonly enCours = input(false);
  readonly libelles = input.required<LibellesFormulaireRapport>();

  readonly generer = output<ParametresRapport>();

  protected readonly formulaire = new FormGroup({
    type: new FormControl<TypeRapport>('synthese', { nonNullable: true }),
    instructions: new FormControl('', { nonNullable: true }),
  });

  protected valider(): void {
    const { type, instructions } = this.formulaire.getRawValue();
    this.generer.emit({ type, instructions: instructions.trim() });
  }
}
