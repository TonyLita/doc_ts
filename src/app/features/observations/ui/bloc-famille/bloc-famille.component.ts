import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GraphiqueZonesComponent } from '../../../../shared/ui/graphique-zones/graphique-zones.component';
import { BadgeRepresentativiteComponent } from '../badge-representativite/badge-representativite.component';

export interface LigneFamille {
  readonly code: string; // code technique de la valeur, traduit à l'affichage
  readonly valeur: number; // effectif brut, pour le graphique
  readonly effectif: string; // déjà formaté
  readonly pourcentage: string; // déjà formaté
}

export interface EnTetesFamille {
  readonly valeur: string;
  readonly effectif: string;
  readonly pourcentage: string;
}

// Affichage pur d'une famille d'observation : graphique de synthèse, répartition chiffrée et badge de
// représentativité. Les valeurs arrivent sous forme de codes ; leurs libellés (déjà traduits) sont fournis dans
// `libelles`, indexés par « <famille>.<code> » (ex. « quantite.faible »).
@Component({
  selector: 'app-bloc-famille',
  imports: [GraphiqueZonesComponent, BadgeRepresentativiteComponent],
  templateUrl: './bloc-famille.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocFamilleComponent {
  readonly titre = input.required<string>();
  readonly famille = input.required<string>();
  readonly libelles = input.required<Readonly<Record<string, string>>>();
  readonly lignes = input.required<readonly LigneFamille[]>();
  readonly total = input.required<string>(); // nombre d'observations, affiché au centre de l'anneau
  readonly representatif = input.required<boolean>();
  readonly libelleRepresentativite = input.required<string>();
  readonly enTetes = input.required<EnTetesFamille>();

  // Le tableau et le graphique reçoivent les mêmes libellés.
  protected readonly lignesLibellees = computed(() =>
    this.lignes().map((ligne) => ({ ...ligne, libelle: this.libelles()[`${this.famille()}.${ligne.code}`] ?? ligne.code })),
  );
  protected readonly parts = computed(() =>
    this.lignesLibellees().map((ligne) => ({ nom: ligne.libelle, valeur: ligne.valeur })),
  );
}
