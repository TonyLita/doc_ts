import { ecrireStockageLocal, lireStockageLocal } from './stockage-local';

describe('stockage-local', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('écrit puis relit une valeur', () => {
    ecrireStockageLocal('cle', 'valeur');

    expect(lireStockageLocal('cle')).toBe('valeur');
  });

  it('renvoie null pour une clé absente', () => {
    expect(lireStockageLocal('absente')).toBeNull();
  });

  it('renvoie null au lieu de planter quand le stockage est indisponible en lecture', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('stockage bloqué');
    });

    expect(lireStockageLocal('cle')).toBeNull();
  });

  it('ne plante pas quand le stockage est indisponible en écriture', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('stockage bloqué');
    });

    expect(() => ecrireStockageLocal('cle', 'valeur')).not.toThrow();
  });
});
