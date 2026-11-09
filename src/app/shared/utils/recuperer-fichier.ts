import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { FichierExporte } from '../models/fichier-exporte';

const nomParDefaut = 'export';

// Nom du fichier annoncé par le serveur (Content-Disposition: attachment; filename="...").
function nomDuFichier(reponse: HttpResponse<Blob>): string {
  return /filename="?([^";]+)"?/.exec(reponse.headers.get('Content-Disposition') ?? '')?.[1] ?? nomParDefaut;
}

// Récupère un fichier produit par le serveur, avec son nom. À brancher sur telechargerFichier pour le faire télécharger.
export function recupererFichier(clientHttp: HttpClient, url: string, params?: HttpParams): Observable<FichierExporte> {
  return clientHttp
    .get(url, { params, observe: 'response', responseType: 'blob' })
    .pipe(map((reponse) => ({ contenu: reponse.body as Blob, nom: nomDuFichier(reponse) })));
}
