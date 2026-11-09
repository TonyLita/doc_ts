import { LangueDocument } from '../../../shared/utils/langue-document';

export type TypeRapport = 'synthese' | 'analyse-zone' | 'prevision' | 'personnalise';

export type LangueRapport = LangueDocument;

export interface DemandeRapport {
  readonly type: TypeRapport;
  readonly instructions?: string; // consignes libres, facultatives
  readonly langue: LangueRapport;
}

export interface ContexteRapports {
  readonly campagne: string; // campagne active : le rapport porte sur elle
  readonly peutGenerer: boolean; // droit du profil du jeton (les visiteurs n'ont pas accès à la génération)
}

export interface ReponseOllama {
  readonly response: string;
  readonly done: boolean;
}

export interface RapportGenere {
  readonly texte: string; // narratif ; un brouillon, jamais un document validé
  readonly campagne: string;
  readonly donneesAu: string; // date ISO des données utilisées
}
