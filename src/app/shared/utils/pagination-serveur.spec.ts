import { paginationServeur } from './pagination-serveur';

describe('paginationServeur', () => {
  it('démarre à la première page', () => {
    expect(paginationServeur(20).page()).toBe(1);
  });

  it('change de page puis revient à la première', () => {
    const pagination = paginationServeur(20);

    pagination.choisir(3);
    expect(pagination.page()).toBe(3);

    pagination.reinitialiser();
    expect(pagination.page()).toBe(1);
  });

  it.each([
    [0, 1],
    [20, 1],
    [21, 2],
    [1776, 89],
  ])('%i résultats : %i page(s)', (total, pages) => {
    expect(paginationServeur(20).nombrePages(total)).toBe(pages);
  });
});
