import { comptesMock } from './comptes-mock';

describe('comptesMock', () => {
  it('contient un compte par profil du CDC', () => {
    expect(comptesMock.map((compte) => compte.profil).sort()).toEqual([
      'super-administrateur',
      'utilisateur',
      'visiteur',
    ]);
  });

  it('a des identifiants uniques', () => {
    const identifiants = comptesMock.map((compte) => compte.identifiant);

    expect(new Set(identifiants).size).toBe(identifiants.length);
  });
});
