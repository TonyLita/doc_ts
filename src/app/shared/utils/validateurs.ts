import { AbstractControl, ValidationErrors } from '@angular/forms';

// Un nombre saisi doit être entier. Un champ vide est accepté ici : `Validators.required` s'en charge.
export function entier(controle: AbstractControl<number | null>): ValidationErrors | null {
  const valeur = controle.value;
  return valeur === null || Number.isInteger(valeur) ? null : { entier: true };
}
