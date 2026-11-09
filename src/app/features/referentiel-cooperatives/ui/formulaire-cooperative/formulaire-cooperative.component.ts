import { ChangeDetectionStrategy, Component, computed, input, OnInit, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ChoixCommune, DonneesCooperative } from '../../data-access/cooperatives.modeles';

export interface LibellesFormulaireCooperative {
  readonly nom: string;
  readonly commune: string;
  readonly village: string;
  readonly choisir: string; // première option des listes, sans valeur
  readonly enregistrer: string;
  readonly annuler: string;
  readonly champObligatoire: string;
}

const longueurMaxNom = 120;

// Un nom fait d'espaces n'est pas un nom (la validation du serveur fait foi, manuel 7.5).
function nonVide(controle: AbstractControl<string>): ValidationErrors | null {
  return controle.value.trim() ? null : { required: true };
}

// Formulaire de création ou de modification d'une coopérative. Affichage pur : les valeurs validées partent par la
// sortie `enregistrer`, la page parle au serveur. La commune et le village se choisissent dans le référentiel
// géographique (CDC §8.2), jamais en texte libre ; les villages proposés sont ceux de la commune choisie.
@Component({
  selector: 'app-formulaire-cooperative',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-cooperative.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireCooperativeComponent implements OnInit {
  readonly titre = input.required<string>();
  readonly cooperative = input<DonneesCooperative>(); // absente : création
  readonly communes = input.required<readonly ChoixCommune[]>();
  readonly libelles = input.required<LibellesFormulaireCooperative>();
  readonly enCours = input(false);

  readonly enregistrer = output<DonneesCooperative>();
  readonly annuler = output<void>();

  protected readonly longueurMaxNom = longueurMaxNom;

  protected readonly formulaire = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, nonVide, Validators.maxLength(longueurMaxNom)] }),
    commune: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    village: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  private readonly communeChoisie = toSignal(this.formulaire.controls.commune.valueChanges, { initialValue: '' });
  protected readonly villages = computed(
    () => this.communes().find((commune) => commune.id === this.communeChoisie())?.villages ?? [],
  );

  ngOnInit(): void {
    const cooperative = this.cooperative();
    if (cooperative) {
      this.formulaire.setValue(cooperative);
    }
  }

  // Un village d'une autre commune n'est plus valable : la liste se vide quand la commune change.
  protected reinitialiserVillage(): void {
    this.formulaire.controls.village.setValue('');
  }

  protected valider(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const valeurs = this.formulaire.getRawValue();
    this.enregistrer.emit({ ...valeurs, nom: valeurs.nom.trim() });
  }
}
