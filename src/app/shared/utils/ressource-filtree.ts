import { linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

// Charge des données selon des filtres. Les dernières données restent à l'écran pendant le rechargement :
// les filtres et la page ne disparaissent pas à chaque changement. À appeler dans un champ de classe
// (contexte d'injection). Si les filtres valent undefined, rien n'est chargé (ex. profil sans droit d'accès).
export function ressourceFiltree<T, F>(filtres: () => F | undefined, charger: (filtres: F) => Observable<T>) {
  const ressource = rxResource({ params: filtres, stream: ({ params }) => charger(params) });
  const donnees = linkedSignal<T | undefined, T | undefined>({
    source: () => (ressource.hasValue() ? ressource.value() : undefined),
    computation: (nouvelles, precedent) => nouvelles ?? precedent?.value,
  });
  return { ressource, donnees };
}
