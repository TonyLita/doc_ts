// Coopérative (Organisation de Producteurs) telle que les pages la proposent dans leurs filtres (CDC §8.3).
export interface Cooperative {
  readonly id: string;
  readonly nom: string;
}

// Filtres communs aux pages d'analyse. Sans campagne, le serveur renvoie la campagne en cours (CDC §8.12).
// Sans coopérative, toutes les coopératives sont prises en compte.
export interface FiltresCampagneCooperative {
  readonly campagne?: string;
  readonly cooperative?: string;
}
