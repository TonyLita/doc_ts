import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

export interface ParcelleArbreVue {
  readonly id: string;
  readonly code: string;
}

export interface VillageArbreVue {
  readonly id: string;
  readonly nom: string;
  readonly rang: number | null; // rang de la couleur de la zone ; null : village sans zone
  readonly zoneNom: string; // nom de la zone, vide si le village n'a pas de zone
  readonly parcelles: readonly ParcelleArbreVue[];
  readonly nombreParcelles: string; // déjà formaté
}

export interface CommuneArbreVue {
  readonly id: string;
  readonly nom: string;
  readonly villages: readonly VillageArbreVue[];
  readonly nombreVillages: string; // déjà formaté
  readonly nombreParcelles: string; // déjà formaté
}

export interface LibellesArbre {
  readonly deplierTout: string;
  readonly replierTout: string;
  readonly deplier: string; // préfixe du nom accessible d'un bouton fermé : « Déplier Sambava »
  readonly replier: string;
  readonly villages: string;
  readonly parcelles: string;
  readonly sansZone: string;
  readonly vide: string;
}

// Arborescence pliable des communes, villages et parcelles (CDC §8.2, §8.5) : chaque zone a sa couleur (même rang =
// même couleur que les graphiques), toujours doublée du nom de la zone. La hiérarchie est en lecture seule ; l'état
// déplié ou replié est le seul état du composant. Les parcelles d'un village ne sont dessinées qu'à son ouverture :
// il peut y en avoir plusieurs centaines.
@Component({
  selector: 'app-arbre-geographique',
  templateUrl: './arbre-geographique.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArbreGeographiqueComponent {
  readonly communes = input.required<readonly CommuneArbreVue[]>();
  readonly libelles = input.required<LibellesArbre>();

  protected readonly communesOuvertes = signal<ReadonlySet<string>>(new Set());
  protected readonly villagesOuverts = signal<ReadonlySet<string>>(new Set());

  private initialise = false;

  constructor() {
    // Au premier affichage, la première commune est dépliée : la structure se lit tout de suite. Ensuite, les
    // rechargements de données gardent l'état choisi par l'utilisateur.
    effect(() => {
      const premiere = this.communes()[0];
      if (!this.initialise && premiere) {
        this.initialise = true;
        this.communesOuvertes.set(new Set([premiere.id]));
      }
    });
  }

  protected basculerCommune(identifiant: string): void {
    this.communesOuvertes.update((ouvertes) => this.basculer(ouvertes, identifiant));
  }

  protected basculerVillage(identifiant: string): void {
    this.villagesOuverts.update((ouverts) => this.basculer(ouverts, identifiant));
  }

  protected toutDeplier(): void {
    this.communesOuvertes.set(new Set(this.communes().map((commune) => commune.id)));
    this.villagesOuverts.set(
      new Set(this.communes().flatMap((commune) => commune.villages.filter((village) => village.parcelles.length).map((village) => village.id))),
    );
  }

  protected toutReplier(): void {
    this.communesOuvertes.set(new Set());
    this.villagesOuverts.set(new Set());
  }

  private basculer(ensemble: ReadonlySet<string>, identifiant: string): ReadonlySet<string> {
    const suivant = new Set(ensemble);
    if (!suivant.delete(identifiant)) {
      suivant.add(identifiant);
    }
    return suivant;
  }
}
