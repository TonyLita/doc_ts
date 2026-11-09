import { cleErreurService } from './cle-erreur-service';

describe('cleErreurService', () => {
  it.each([
    [403, 'interdit'],
    [429, 'trop_de_demandes'],
    [503, 'indisponible'],
    [504, 'delai_depasse'],
    [500, 'generique'],
    [0, 'generique'],
  ])('statut %i : %s', (statut, cle) => {
    expect(cleErreurService(statut)).toBe(cle);
  });

  it('donne la priorité aux motifs propres à l’appel', () => {
    expect(cleErreurService(422, { 422: 'invalide' })).toBe('invalide');
    expect(cleErreurService(403, { 403: 'reserve' })).toBe('reserve');
  });

  it('retombe sur les motifs communs pour les autres codes', () => {
    expect(cleErreurService(429, { 422: 'invalide' })).toBe('trop_de_demandes');
    expect(cleErreurService(500, { 422: 'invalide' })).toBe('generique');
  });
});
