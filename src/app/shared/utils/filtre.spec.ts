import { filtre } from './filtre';

describe('filtre', () => {
  it('démarre sans valeur, ou avec la valeur initiale donnée', () => {
    expect(filtre().valeur()).toBeUndefined();
    expect(filtre<'active' | 'archivee'>(undefined, 'active').valeur()).toBe('active');
  });

  it('retient le choix puis prévient la page, par exemple pour revenir à la première page', () => {
    const changements: string[] = [];
    const zone = filtre(() => changements.push('changé'));

    zone.choisir('littorale');

    expect(zone.valeur()).toBe('littorale');
    expect(changements).toEqual(['changé']);
  });

  it('prend une valeur vide pour « tous » : le filtre n’est plus envoyé', () => {
    const zone = filtre(undefined, 'littorale');

    zone.choisir('');

    expect(zone.valeur()).toBeUndefined();
  });
});
