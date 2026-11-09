// Nombre d'intervalles de l'axe vertical d'un graphique (donc nombre + 1 graduations, zéro compris).
export const nombreGraduations = 4;

// Plus petit pas « rond » (1, 2, 5 × 10^n) qui couvre la valeur demandée.
function pasRond(valeur: number): number {
  const puissance = 10 ** Math.floor(Math.log10(valeur));
  return ([1, 2, 5, 10].find((facteur) => facteur * puissance >= valeur) ?? 10) * puissance;
}

// Axe vertical d'un graphique pour une valeur maximale : pas entre deux graduations et valeur du haut de l'axe.
// Partagé par le graphique affiché et par les images exportées, pour qu'ils aient la même échelle.
export function echelleAxe(maximum: number): { readonly pas: number; readonly maxAxe: number } {
  const pas = pasRond((maximum || 1) / nombreGraduations);
  return { pas, maxAxe: pas * nombreGraduations };
}
