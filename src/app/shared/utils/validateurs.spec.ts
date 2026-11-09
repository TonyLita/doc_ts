import { FormControl } from '@angular/forms';
import { entier } from './validateurs';

describe('entier', () => {
  it.each([[0], [335], [-2]])('accepte %i', (valeur) => {
    expect(entier(new FormControl<number | null>(valeur))).toBeNull();
  });

  it('accepte un champ vide : c’est Validators.required qui le signale', () => {
    expect(entier(new FormControl<number | null>(null))).toBeNull();
  });

  it('refuse un nombre à virgule', () => {
    expect(entier(new FormControl<number | null>(12.5))).toEqual({ entier: true });
  });
});
