
export type StatutCampagne = 'en-cours' | 'cloturee';

export interface Campagne {
  readonly id: string;
  readonly debut: string;
  readonly fin: string;
  readonly statut: StatutCampagne;
  readonly active: boolean;
}

export type DonneesCampagne = Pick<Campagne, 'id' | 'debut' | 'fin'>;

export interface FleursMois {
  readonly mois: number; 
  readonly fleurs: number;
}

export interface IndicateursCampagne {
  readonly campagne: string; 
  readonly totalFleurs: number;
  readonly producteursSuivis: number;
  readonly moisPic: number;
  readonly productionEstimeeKg: number;
  readonly floraisonMensuelle: readonly FleursMois[];
}

export interface Campagnes {
  readonly peutAdministrer: boolean;
  readonly campagnes: readonly Campagne[];
  readonly comparaison: readonly IndicateursCampagne[];
}
