import { signal } from '@angular/core';

// Un filtre de liste : sa valeur, ou undefined pour « tous » (un filtre absent n'est pas envoyé au serveur). `choisir`
// reçoit la valeur d'une liste déroulante (une valeur vide veut dire « tous ») puis appelle `surChangement`, par exemple
// la remise à la première page d'une liste paginée. À appeler dans un champ de classe.
export function filtre<T extends string = string>(surChangement?: () => void, initiale?: T) {
  const valeur = signal<T | undefined>(initiale);

  return {
    valeur: valeur.asReadonly(),
    choisir: (choix: string): void => {
      valeur.set((choix as T) || undefined);
      surChangement?.();
    },
  };
}
