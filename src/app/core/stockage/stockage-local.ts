// Lecture et écriture dans le localStorage sans jamais planter : le stockage peut être indisponible
// (navigation privée, données bloquées). L'application reste fonctionnelle sans lui.
export function lireStockageLocal(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

export function ecrireStockageLocal(cle: string, valeur: string): void {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    // Valeur non conservée, sans conséquence.
  }
}
