import { computed, inject } from '@angular/core';
import { LangueService } from '../../core/i18n/langue.service';
import { langueDocument } from './langue-document';

// Valeur affichée quand une donnée est absente.
export const absent = '–';

// Mise en forme des valeurs dans la langue active : à appeler dans un champ de classe. Les formateurs `Intl` sont créés
// une fois par langue ; les fonctions se lisent dans un `computed` ou un gabarit et suivent le changement de langue.
export function formatsLocalises() {
  const langue = inject(LangueService).langueActive;

  const formateurs = computed(() => {
    const courante = langue();
    const entiers = new Intl.NumberFormat(courante);
    const decimaux = new Map<number, Intl.NumberFormat>();
    const decimal = (chiffres: number) => {
      let formateur = decimaux.get(chiffres);
      if (!formateur) {
        formateur = new Intl.NumberFormat(courante, { minimumFractionDigits: chiffres, maximumFractionDigits: chiffres });
        decimaux.set(chiffres, formateur);
      }
      return formateur;
    };
    return { entiers, decimal };
  });

  return {
    absent,
    // Langue des documents et des noms que le serveur renvoie : français ou anglais, le français en repli (ex. malgache).
    langueDocument: computed(() => langueDocument(langue())),
    nombre: (valeur: number): string => formateurs().entiers.format(valeur),
    // Nombre à décimales fixes (ex. coordonnées GPS).
    decimal: (valeur: number, chiffres: number): string => formateurs().decimal(chiffres).format(valeur),
  };
}
