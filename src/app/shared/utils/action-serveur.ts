import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AppError } from '../../core/api/app-error';
import { cleErreurService } from './cle-erreur-service';

export interface OptionsAction<T> {
  // Appelée quand le serveur a répondu : c'est là que la page ferme son formulaire et recharge ses données.
  readonly succes?: (resultat: T) => void;
  // Motifs d'échec propres à cette action, avant les motifs communs (voir cleErreurService).
  readonly erreurs?: Readonly<Record<number, string>>;
}

// Envoi d'une action d'écriture au serveur par une page : `enCours` tant qu'il n'a pas répondu, `cleErreur` (clé de
// traduction du motif, jamais de trace technique, manuel 4.7) si l'action échoue. Le serveur fait foi : rien n'est
// modifié en local avant sa réponse. À appeler dans un champ de classe.
export function actionServeur() {
  const enCours = signal(false);
  const cleErreur = signal<string | undefined>(undefined);

  return {
    enCours: enCours.asReadonly(),
    cleErreur: cleErreur.asReadonly(),
    lancer<T>(requete: Observable<T>, options: OptionsAction<T> = {}): void {
      enCours.set(true);
      cleErreur.set(undefined);
      requete.subscribe({
        next: (resultat) => {
          enCours.set(false);
          options.succes?.(resultat);
        },
        error: (erreur: AppError) => {
          enCours.set(false);
          cleErreur.set(cleErreurService(erreur.status, options.erreurs));
        },
      });
    },
  };
}
