import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';

// Réponses de test communes aux faux serveurs : un délai simulé, puis un succès (avec le nom du fichier annoncé quand
// c'est un fichier) ou un refus HTTP, comme le ferait le vrai serveur.
export function reponseMock<T>(corps: T, delaiMs: number, nomFichier?: string): Observable<HttpResponse<T>> {
  const headers = nomFichier
    ? new HttpHeaders({ 'Content-Disposition': `attachment; filename="${nomFichier}"` })
    : undefined;
  return timer(delaiMs).pipe(switchMap(() => of(new HttpResponse({ status: 200, body: corps, headers }))));
}

export function refusMock(status: number, url: string, delaiMs: number): Observable<never> {
  return timer(delaiMs).pipe(switchMap(() => throwError(() => new HttpErrorResponse({ status, url }))));
}
