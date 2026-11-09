import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ZoneGraphique {
  readonly nom: string;
  readonly valeur: number;
}

// Affichage pur de la répartition par zone agro-écologique (anneau + légende avec parts en %).
@Component({
  selector: 'app-graphique-zones',
  templateUrl: './graphique-zones.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphiqueZonesComponent {
  readonly titre = input.required<string>();
  readonly zones = input.required<readonly ZoneGraphique[]>();
  readonly libelleTotal = input.required<string>(); // total déjà formaté, affiché au centre
  // Faux quand la carte qui l'accueille porte déjà le titre : il reste alors le nom accessible du dessin.
  readonly avecTitre = input(true);

  // Le cercle (rayon 15,9155) mesure 100 unités : une part en % se dessine directement en trait.
  protected readonly segments = computed(() => {
    const zones = this.zones();
    const total = zones.reduce((somme, zone) => somme + zone.valeur, 0) || 1;
    let cumul = 0;
    return zones.map((zone, indice) => {
      const part = (zone.valeur / total) * 100;
      const segment = {
        nom: zone.nom,
        couleur: indice % 5,
        trait: `${part} ${100 - part}`,
        pourcentage: Math.round(part),
        decalage: 25 - cumul,
      };
      cumul += part;
      return segment;
    });
  });
}
