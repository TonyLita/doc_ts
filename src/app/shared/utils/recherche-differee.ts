import { DestroyRef, inject } from '@angular/core';

const delaiParDefautMs = 300;

// Gestionnaire d'un champ de recherche dont la valeur part au serveur après une courte pause : pas une requête par
// touche frappée. `appliquer` reçoit le terme saisi (sans espaces autour), ou undefined si le champ est vide.
// À appeler dans un champ de classe (contexte d'injection) : la minuterie est arrêtée avec le composant.
export function rechercheDifferee(
  appliquer: (terme: string | undefined) => void,
  delaiMs = delaiParDefautMs,
): (evenement: Event) => void {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  inject(DestroyRef).onDestroy(() => clearTimeout(minuterie));
  return (evenement) => {
    const terme = (evenement.target as HTMLInputElement).value.trim();
    clearTimeout(minuterie);
    minuterie = setTimeout(() => appliquer(terme || undefined), delaiMs);
  };
}
