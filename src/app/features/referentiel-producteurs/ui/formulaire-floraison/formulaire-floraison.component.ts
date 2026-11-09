import { ChangeDetectionStrategy, Component, effect, input, output, untracked } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { OptionListe } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { dateDuJour } from '../../../../shared/utils/date-du-jour';
import { SaisieFloraison } from '../../data-access/floraison.modeles';

export interface LibellesFormulaireFloraison {
  readonly date: string;
  readonly producteur: string;
  readonly parcelle: string;
  readonly fleurs: string;
  readonly choisir: string; // première option des listes, sans valeur
  readonly enregistrer: string;
  readonly champObligatoire: string;
  readonly fleursInvalides: string; // le nombre n'est pas un entier supérieur à 0
}

// Le nombre de fleurs pollinisées est un entier supérieur à 0 (la validation du serveur fait foi, manuel 7.5).
function entierPositif(controle: AbstractControl<number | null>): ValidationErrors | null {
  const valeur = controle.value;
  return valeur === null || (Number.isInteger(valeur) && valeur > 0) ? null : { positif: true };
}

// Formulaire de saisie des données de floraison : date de saisie (aujourd'hui par défaut), producteur, parcelle du
// producteur et nombre de fleurs pollinisées. Affichage pur : les valeurs validées partent par la sortie `enregistrer`,
// le choix d'un producteur par `producteurChoisi` (la page en recharge les parcelles). Le producteur peut être
// verrouillé quand la saisie se fait pour le producteur en cours.
@Component({
  selector: 'app-formulaire-floraison',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-floraison.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireFloraisonComponent {
  readonly producteurs = input.required<readonly OptionListe[]>();
  readonly producteur = input.required<string>(); // identifiant du producteur choisi, vide si aucun
  readonly producteurVerrouille = input.required<boolean>();
  readonly parcelles = input.required<readonly OptionListe[]>(); // parcelles du producteur choisi
  readonly libelles = input.required<LibellesFormulaireFloraison>();
  readonly enCours = input(false);
  // Change à chaque saisie enregistrée : le nombre de fleurs est alors vidé pour la saisie suivante.
  readonly versionSaisie = input(0);

  readonly producteurChoisi = output<string>();
  readonly enregistrer = output<SaisieFloraison>();

  protected readonly formulaire = new FormGroup({
    date: new FormControl(dateDuJour(), { nonNullable: true, validators: [Validators.required] }),
    producteur: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    parcelle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fleurs: new FormControl<number | null>(null, [Validators.required, entierPositif]),
  });

  constructor() {
    // Le producteur affiché est celui de la page ; verrouillé, il ne se change pas.
    effect(() => {
      const controle = this.formulaire.controls.producteur;
      controle.setValue(this.producteur(), { emitEvent: false });
      if (this.producteurVerrouille()) {
        controle.disable({ emitEvent: false });
      } else {
        controle.enable({ emitEvent: false });
      }
    });
    // Une parcelle d'un autre producteur n'est plus valable : le choix est vidé quand la liste change.
    effect(() => {
      const liste = this.parcelles();
      const controle = this.formulaire.controls.parcelle;
      if (!liste.some((parcelle) => parcelle.valeur === untracked(() => controle.value))) {
        controle.setValue('');
      }
    });
    effect(() => {
      if (this.versionSaisie() > 0) {
        this.formulaire.controls.fleurs.reset(null);
      }
    });
  }

  protected choisirProducteur(evenement: Event): void {
    this.producteurChoisi.emit((evenement.target as HTMLSelectElement).value);
  }

  protected valider(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const { date, parcelle, fleurs } = this.formulaire.getRawValue();
    if (fleurs !== null) {
      this.enregistrer.emit({ date, parcelle, fleurs });
    }
  }
}
