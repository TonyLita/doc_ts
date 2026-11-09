import { signal } from '@angular/core';

// Page courante d'une liste chargée page par page (côté serveur), à partir de 1. `reinitialiser` ramène à la première
// page : à appeler quand un filtre ou une recherche change. À appeler dans un champ de classe.
export function paginationServeur(taille: number) {
  const page = signal(1);

  return {
    page: page.asReadonly(),
    taille,
    choisir: (numero: number): void => page.set(numero),
    reinitialiser: (): void => page.set(1),
    // Au moins une page, même sans résultat.
    nombrePages: (total: number): number => Math.max(1, Math.ceil(total / taille)),
  };
}
