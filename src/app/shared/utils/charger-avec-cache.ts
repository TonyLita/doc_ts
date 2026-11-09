import { Observable } from 'rxjs';

// Dernières réponses reçues, gardées en mémoire du navigateur (perdues au rechargement de la page).
const reponses = new Map<string, unknown>();

// Charge des données en montrant tout de suite la dernière réponse déjà reçue pour cette clé (s'il y en a une), puis la
// réponse fraîche qui la remplace : revenir sur une page déjà vue n'attend plus le serveur. La clé doit contenir tout ce
// qui distingue les données (utilisateur, filtres) : on ne montre jamais les données d'un autre utilisateur.
export function chargerAvecCache<T>(cle: string, requete: () => Observable<T>): Observable<T> {
  return new Observable<T>((abonne) => {
    if (reponses.has(cle)) {
      abonne.next(reponses.get(cle) as T);
    }
    const souscription = requete().subscribe({
      next: (valeur) => {
        reponses.set(cle, valeur);
        abonne.next(valeur);
      },
      error: (erreur: unknown) => abonne.error(erreur),
      complete: () => abonne.complete(),
    });
    return () => souscription.unsubscribe();
  });
}

// Oublie les réponses dont la clé commence par ce préfixe : à appeler après une écriture qui les rend périmées, pour ne pas
// montrer un instant l'ancienne version.
export function oublierCache(prefixe: string): void {
  for (const cle of [...reponses.keys()]) {
    if (cle.startsWith(prefixe)) {
      reponses.delete(cle);
    }
  }
}
