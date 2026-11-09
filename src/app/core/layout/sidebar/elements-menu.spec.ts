import { pageAutorisee } from './elements-menu';

describe('pageAutorisee', () => {
  it('lit les profils des pages déclarées dans une entrée à plusieurs pages', () => {
    expect(pageAutorisee('/imports', 'super-administrateur')).toBe(true);
    expect(pageAutorisee('/imports', 'utilisateur')).toBe(false);
    expect(pageAutorisee('/exports', 'utilisateur')).toBe(true);
    expect(pageAutorisee('/exports', 'visiteur')).toBe(false);
  });

  it("autorise tous les profils sur une entrée simple sans restriction", () => {
    expect(pageAutorisee('/rapports-ia', 'visiteur')).toBe(true);
    expect(pageAutorisee('/rapports-ia', 'utilisateur')).toBe(true);
  });

  it("n'autorise personne sur une route absente du menu, ni un profil inconnu sur une page réservée", () => {
    expect(pageAutorisee('/inconnue', 'super-administrateur')).toBe(false);
    expect(pageAutorisee('/exports', null)).toBe(false);
  });
});
