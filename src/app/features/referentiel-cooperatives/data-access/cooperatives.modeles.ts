// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.3) : à ajuster dès réception de la documentation.
// GET    <urlApi>/referentiels/cooperatives        →  Cooperatives
// POST   <urlApi>/referentiels/cooperatives        DonneesCooperative  → crée une coopérative
// PUT    <urlApi>/referentiels/cooperatives/<id>   DonneesCooperative  → la modifie
// DELETE <urlApi>/referentiels/cooperatives/<id>                       → la supprime
// Les coopératives (Organisations de Producteurs) sont des données locales : seul le Super Administrateur les crée,
// les modifie ou les supprime (403 sinon). Le serveur fait foi : le nom est unique (409), le village pivot doit
// appartenir à la commune (422), une coopérative à laquelle des producteurs ou des parcelles sont rattachés ne peut pas
// être supprimée (409). L'identifiant est attribué par le serveur et reste stable (filtres, imports, application
// mobile) ; les effectifs sont calculés par le serveur d'après les producteurs (§8.4) et les parcelles (§8.5).
export interface ChoixVillage {
  readonly id: string;
  readonly nom: string;
}

// Commune et villages du référentiel géographique (§8.2), proposés au formulaire.
export interface ChoixCommune {
  readonly id: string;
  readonly nom: string;
  readonly villages: readonly ChoixVillage[];
}

export interface FicheCooperative {
  readonly id: string;
  readonly nom: string;
  readonly villagePivot: ChoixVillage; // localité de référence de la coopérative
  readonly commune: Pick<ChoixCommune, 'id' | 'nom'>; // commune principale couverte
  readonly producteurs: number; // producteurs membres (calculé)
  readonly parcelles: number; // parcelles géolocalisées (calculé)
}

// Ce que le formulaire envoie : le village et la commune sont désignés par leur identifiant du référentiel géographique.
export interface DonneesCooperative {
  readonly nom: string;
  readonly commune: string;
  readonly village: string;
}

export interface Cooperatives {
  readonly peutAdministrer: boolean; // droit du profil du jeton (Super Administrateur seul)
  readonly communes: readonly ChoixCommune[];
  readonly cooperatives: readonly FicheCooperative[];
}
