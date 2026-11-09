import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import { FiltresCampagneCooperative } from '../shared/models/cooperative';
import { delaiSimuleMs } from './connexion-mock.interceptor';

// Filtres campagne et coopérative envoyés en paramètres de requête (voir shared/utils/parametres-filtres.ts).
export function filtresDeRequete(requete: HttpRequest<unknown>): FiltresCampagneCooperative {
  return {
    campagne: requete.params.get('campagne') ?? undefined,
    cooperative: requete.params.get('cooperative') ?? undefined,
  };
}

// Joue le rôle du serveur pour un GET sur `url` ; les autres requêtes continuent vers le réseau.
export function intercepteurGetMock(
  url: string,
  construireReponse: (requete: HttpRequest<unknown>) => unknown,
): HttpInterceptorFn {
  return (requete, suivant) =>
    requete.method === 'GET' && requete.url === url
      ? of(new HttpResponse({ status: 200, body: construireReponse(requete) })).pipe(delay(delaiSimuleMs))
      : suivant(requete);
}
