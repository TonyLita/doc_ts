import { OptionListe } from '../ui/champ-liste/champ-liste.component';

// Options d'une liste déroulante à partir d'éléments du référentiel (coopératives, zones…).
export function versOptions(elements: readonly { readonly id: string; readonly nom: string }[]): OptionListe[] {
  return elements.map((element) => ({ valeur: element.id, libelle: element.nom }));
}
