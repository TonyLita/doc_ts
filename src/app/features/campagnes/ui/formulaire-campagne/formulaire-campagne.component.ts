import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DonneesCampagne } from '../../data-access/campagnes.modeles';

export interface LibellesFormulaire {
  readonly campagne: string;
  readonly debut: string;
  readonly fin: string;
  readonly enregistrer: string;
  readonly annuler: string;
  readonly champObligatoire: string;
  readonly periodeInvalide: string; // la fin précède le début
}

// La fin d'une campagne ne peut pas précéder son début (la validation du serveur fait foi, manuel 7.5).
function periodeCoherente(groupe: AbstractControl): ValidationErrors | null {
  const { debut, fin } = groupe.getRawValue() as DonneesCampagne;
  return debut && fin && fin < debut ? { periode: true } : null;
}

// Formulaire de modification des dates d'une campagne. Affichage pur : les valeurs validées partent par la sortie
// `enregistrer`, la page parle au serveur. L'identifiant de la campagne n'est pas modifiable.
@Component({
  selector: 'app-formulaire-campagne',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-campagne.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireCampagneComponent implements OnInit {
  readonly titre = input.required<string>();
  readonly campagne = input.required<DonneesCampagne>();
  readonly libelles = input.required<LibellesFormulaire>();
  readonly enCours = input(false);

  readonly enregistrer = output<DonneesCampagne>();
  readonly annuler = output<void>();

  protected readonly formulaire = new FormGroup(
    {
      id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      debut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      fin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [periodeCoherente] },
  );

  ngOnInit(): void {
    this.formulaire.setValue(this.campagne());
    this.formulaire.controls.id.disable();
  }

  protected valider(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.enregistrer.emit(this.formulaire.getRawValue());
  }
}
