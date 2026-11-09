// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.16) : à ajuster dès réception de la documentation.
// GET    <urlApi>/imports                                  →  ContexteImports
// POST   <urlApi>/imports  (multipart : type, fichier)     →  ApercuImport (rien n'est écrit à ce stade)
// GET    <urlApi>/imports/<id>/apercu?page=&taille=        →  PageApercu
// POST   <urlApi>/imports/<id>/confirmation                →  ResultatImport (écrit les lignes valides ou à vérifier)
// DELETE <urlApi>/imports/<id>                             →  abandonne l'import sans effet
// GET    <urlApi>/imports/<id>/rapport-erreurs?langue=     →  fichier des lignes rejetées
// GET    <urlApi>/imports/modele/<type>?langue=            →  fichier modèle à remplir
// Le serveur fait foi : il lit le fichier (entités XML externes désactivées, .xlsm refusé, taille limitée), rattache
// chaque parcelle à un producteur de l'API externe, rejoue tous les contrôles à la confirmation, journalise chaque
// import et n'efface jamais une parcelle (il l'archive). Réservé au Super Administrateur (403 sinon).
// Erreurs d'analyse : 413 (fichier trop gros), 415 (format refusé), 422 (fichier illisible).
export type TypeReferentiel = 'parcelles' | 'cooperatives';

export type ControleLigne = 'valide' | 'a-verifier' | 'rejetee';

export type MotifControle =
  | 'producteur-inconnu'
  | 'cooperative-inconnue'
  | 'coordonnees-invalides'
  | 'doublon'
  | 'champ-manquant';

export interface CompteursImport {
  readonly valides: number;
  readonly aVerifier: number;
  readonly rejetees: number;
}

export interface ApercuImport {
  readonly idImport: string;
  readonly fichier: string;
  readonly type: TypeReferentiel;
  readonly lignesLues: number;
  readonly compteurs: CompteursImport;
}

export interface LigneApercu {
  readonly numero: number; // numéro de la ligne dans le fichier
  // Colonnes lues : parcelles = producteur, cooperative, latitude, longitude, pieds ; coopératives = nom, village, commune.
  readonly valeurs: Readonly<Record<string, string | number | null>>;
  readonly controle: ControleLigne;
  readonly motif?: MotifControle; // pour une ligne à vérifier ou rejetée
}

export interface PageApercu {
  readonly total: number; // nombre de lignes lues, toutes pages confondues
  readonly lignes: readonly LigneApercu[]; // la page demandée
}

export interface ResultatImport {
  readonly creees: number;
  readonly miseAJour: number;
  readonly rejetees: number;
}

export interface EntreeHistorique extends ResultatImport {
  readonly id: string;
  readonly date: string; // date ISO
  readonly utilisateur: string;
  readonly fichier: string;
  readonly type: TypeReferentiel;
}

export interface ContexteImports {
  readonly peutImporter: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly historique: readonly EntreeHistorique[]; // du plus récent au plus ancien
}
