import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, map, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppError } from '../../../core/api/app-error';
// DONNÉES DE TEST (temporaire) : les remontées terrain confiées à l'IA locale ; avec le serveur, il construira le contexte.
import { activitesApiculture, floraisonTerrain, quotasCooperatives } from '../../../donnee_Mock/IA/data-context.mock';
import { ContexteRapports, DemandeRapport, RapportGenere, ReponseOllama } from './rapports-ia.modeles';

export const urlRapportsIa = `${environment.urlApi}/rapports-ia`;

// Même limite que celle du serveur, qui fait foi : un texte libre arrive dans une consigne d'IA, il doit rester court.
export const longueurMaxInstructions = 1000;

// Données en JSON compact : le modèle local a une fenêtre de contexte courte.
const donneesTerrain = JSON.stringify({ floraison: floraisonTerrain, apiculture: activitesApiculture, quotas: quotasCooperatives });

// Température basse (rapport factuel) et fenêtre assez large pour les données terrain.
const optionsModele = { temperature: 0.2, num_ctx: 4096 } as const;

// Échec d'Ollama ramené aux statuts que la page sait déjà traduire : éteint (0), modèle absent (404) ou réponse vide → 503 ;
// temps d'attente écoulé → 504.
function erreurIa(erreur: unknown): AppError {
  if (erreur instanceof TimeoutError) {
    return { status: 504, message: erreur.message };
  }
  const { status, message } = erreur as Partial<AppError>;
  return { status: !status || status === 404 ? 503 : status, message: message ?? '' };
}

@Injectable({ providedIn: 'root' })
export class RapportsIaService {
  private readonly clientHttp = inject(HttpClient);
  private readonly traduction = inject(TranslocoService);

  // Seule couche qui parle au serveur pour ce module (manuel 4.3).
  recuperer(): Observable<ContexteRapports> {
    return this.clientHttp.get<ContexteRapports>(urlRapportsIa);
  }

  // Selon l'environnement : l'IA locale (développement) ou le serveur (contrat de rapports-ia.modeles.ts, CDC §8.13).
  generer(demande: DemandeRapport): Observable<RapportGenere> {
    return environment.ia.mode === 'local' ? this.genererAvecOllama(demande) : this.clientHttp.post<RapportGenere>(urlRapportsIa, demande);
  }

  // Développement seulement : le navigateur appelle l'IA locale (Ollama, sans clé API) ; le jeton de l'application n'est
  // pas envoyé (voir authInterceptor).
  private genererAvecOllama(demande: DemandeRapport): Observable<RapportGenere> {
    const { system, prompt } = this.construirePrompt(demande);
    return this.clientHttp
      .post<ReponseOllama>(environment.ia.urlOllama, { model: environment.ia.modele, system, prompt, stream: false, options: optionsModele })
      .pipe(
        timeout({ first: environment.ia.delaiMaxMs }),
        map((reponse) => {
          const texte = reponse.response?.trim();
          if (!texte) {
            throw { status: 503, message: '' };
          }
          return { texte, campagne: floraisonTerrain.campagne, donneesAu: floraisonTerrain.dateRemontee };
        }),
        catchError((erreur: unknown) => throwError(() => erreurIa(erreur))),
      );
  }

  // Les textes viennent des fichiers de traduction du module (clé « prompt », langue active, français en repli). Le rôle et les
  // règles restent dans `system`, hors de portée du texte de l'utilisateur, qui n'arrive que dans un bloc délimité de
  // `prompt` et ne peut ni le refermer ni dépasser la longueur permise.
  private construirePrompt(demande: DemandeRapport): { system: string; prompt: string } {
    const texte = (cle: string, params?: Record<string, string>) => this.traduction.translate(`rapports_ia.prompt.${cle}`, params);
    const instructions = (demande.instructions ?? '').replaceAll('"""', "'''").trim().slice(0, longueurMaxInstructions);
    return {
      system: [texte('role'), texte('regles'), texte('langueSortie')].join(' '),
      prompt: [
        texte('donnees', { campagne: floraisonTerrain.campagne, date: floraisonTerrain.dateRemontee }),
        donneesTerrain,
        '',
        `${texte('typeRapport')} ${texte(`consignes.${demande.type}`)}`,
        '',
        texte('instructions'),
        '"""',
        instructions || texte('aucune'),
        '"""',
      ].join('\n'),
    };
  }
}
