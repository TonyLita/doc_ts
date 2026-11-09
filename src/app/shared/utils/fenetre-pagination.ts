// Numéros de page à afficher : tous quand il y en a peu, sinon la première, la dernière et celles autour de la page courante,
// un « trou » (null) remplaçant les numéros omis. Ex. page 5 sur 89 : 1 … 4 5 6 … 89.
const maximumSansTrou = 7;

export function fenetrePagination(page: number, nombrePages: number): readonly (number | null)[] {
  if (nombrePages <= maximumSansTrou) {
    return Array.from({ length: nombrePages }, (_, i) => i + 1);
  }
  const numeros = [...new Set([1, page - 1, page, page + 1, nombrePages])]
    .filter((numero) => numero >= 1 && numero <= nombrePages)
    .sort((a, b) => a - b);
  return numeros.flatMap((numero, i) => (i > 0 && numero - numeros[i - 1] > 1 ? [null, numero] : [numero]));
}
