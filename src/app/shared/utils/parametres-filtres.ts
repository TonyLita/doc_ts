import { HttpParams } from '@angular/common/http';
import { FiltresCampagneCooperative } from '../models/cooperative';

// Paramètres de requête des filtres campagne et coopérative, plus ceux propres à la page (zone, statut, page…).
// Un filtre absent ou vide n'est pas envoyé.
export function parametresFiltres(
  filtres: FiltresCampagneCooperative,
  autres: Readonly<Record<string, string | number | undefined>> = {},
): HttpParams {
  let parametres = new HttpParams();
  for (const [cle, valeur] of Object.entries({ campagne: filtres.campagne, cooperative: filtres.cooperative, ...autres })) {
    if (valeur !== undefined && valeur !== '') {
      parametres = parametres.set(cle, String(valeur));
    }
  }
  return parametres;
}
