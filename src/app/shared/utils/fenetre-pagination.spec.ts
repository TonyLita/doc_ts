import { fenetrePagination } from './fenetre-pagination';

describe('fenetrePagination', () => {
  it('affiche tous les numéros quand il y a peu de pages', () => {
    expect(fenetrePagination(1, 1)).toEqual([1]);
    expect(fenetrePagination(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('garde la première, la dernière et les voisines de la page courante, avec un trou entre', () => {
    expect(fenetrePagination(1, 89)).toEqual([1, 2, null, 89]);
    expect(fenetrePagination(5, 89)).toEqual([1, null, 4, 5, 6, null, 89]);
    expect(fenetrePagination(89, 89)).toEqual([1, null, 88, 89]);
  });

  it("ne met pas de trou quand il ne manque aucun numéro", () => {
    expect(fenetrePagination(2, 10)).toEqual([1, 2, 3, null, 10]);
    expect(fenetrePagination(9, 10)).toEqual([1, null, 8, 9, 10]);
  });
});
