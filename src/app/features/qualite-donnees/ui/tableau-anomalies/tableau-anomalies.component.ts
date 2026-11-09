import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TypeAnomalie } from '../../data-access/qualite-donnees.modeles';

export interface LigneAnomalie {
  readonly id: string;
  readonly type: TypeAnomalie;
  readonly producteur: string;
  readonly cooperative: string;
  readonly zone: string;
  readonly mois: string; // déjà formaté
}

export interface LibellesAnomalies {
  readonly type: string;
  readonly producteur: string;
  readonly cooperative: string;
  readonly zone: string;
  readonly mois: string;
  readonly vide: string; // message quand aucune anomalie ne correspond
  readonly types: Readonly<Record<TypeAnomalie, string>>;
}

// Affichage pur de la liste des anomalies détectées par le contrôle de cohérence (un vrai tableau, lisible par
// les lecteurs d'écran). Consultation seule.
@Component({
  selector: 'app-tableau-anomalies',
  templateUrl: './tableau-anomalies.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauAnomaliesComponent {
  readonly titre = input.required<string>();
  readonly lignes = input.required<readonly LigneAnomalie[]>();
  readonly libelles = input.required<LibellesAnomalies>();
}
