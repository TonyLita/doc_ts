import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { couleurSerieCss, indiceCouleurSerie } from '../../../../shared/utils/couleur-serie';
import { CartographieService } from '../../data-access/cartographie.service';
import { CarteComponent } from '../../ui/carte/carte.component';
import { FicheParcelleComponent } from '../../ui/fiche-parcelle/fiche-parcelle.component';
import { LegendeCooperativesComponent } from '../../ui/legende-cooperatives/legende-cooperatives.component';

// Page intelligente (manuel 4.3) : charge les parcelles, applique le filtre par coopérative (la légende)
// et met les valeurs en forme pour les composants d'affichage de ui/.
@Component({
  selector: 'app-cartographie-page',
  imports: [
    TranslocoPipe,
    CarteIndicateurComponent,
    CarteComponent,
    FicheParcelleComponent,
    LegendeCooperativesComponent,
  ],
  templateUrl: './cartographie-page.component.html',
  host: { class: 'page-contenu' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartographiePageComponent {
  private readonly langue = inject(LangueService).langueActive;
  private readonly service = inject(CartographieService);

  protected readonly ressource = rxResource({ stream: () => this.service.recuperer() });
  protected readonly donnees = computed(() => (this.ressource.hasValue() ? this.ressource.value() : undefined));

  private readonly cooperativesMasquees = signal<ReadonlySet<string>>(new Set());
  private readonly parcelleChoisie = signal<string | undefined>(undefined);

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  private readonly noms = computed(
    () => new Map(this.donnees()?.cooperatives.map((cooperative) => [cooperative.id, cooperative.nom])),
  );
  private readonly couleurs = computed(
    () =>
      new Map(
        this.donnees()?.cooperatives.map((cooperative, rang) => [cooperative.id, indiceCouleurSerie(rang)]),
      ),
  );
  private readonly parcellesVisibles = computed(() =>
    (this.donnees()?.parcelles ?? []).filter((parcelle) => !this.cooperativesMasquees().has(parcelle.cooperative)),
  );

  protected readonly legende = computed(() =>
    (this.donnees()?.cooperatives ?? []).map((cooperative) => ({
      id: cooperative.id,
      nom: cooperative.nom,
      couleur: this.couleurs().get(cooperative.id) ?? 0,
      visible: !this.cooperativesMasquees().has(cooperative.id),
    })),
  );

  protected readonly marqueurs = computed(() =>
    this.parcellesVisibles().map((parcelle) => ({
      id: parcelle.id,
      latitude: parcelle.latitude,
      longitude: parcelle.longitude,
      couleur: couleurSerieCss(this.couleurs().get(parcelle.cooperative) ?? 0),
    })),
  );

  protected readonly centres = computed(() =>
    (this.donnees()?.centres ?? [])
      .filter((centre) => !this.cooperativesMasquees().has(centre.cooperative))
      .map((centre) => ({
        nom: this.noms().get(centre.cooperative) ?? '',
        latitude: centre.latitude,
        longitude: centre.longitude,
      })),
  );

  // Les trois indicateurs du CDC, calculés sur les parcelles affichées.
  protected readonly indicateurs = computed(() => {
    const parcelles = this.parcellesVisibles();
    const enVanille = parcelles.filter((parcelle) => parcelle.vanille).length;
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    return {
      parcelles: nombre(parcelles.length),
      partVanille: nombre(parcelles.length ? Math.round((enVanille / parcelles.length) * 100) : 0),
      production: nombre(parcelles.reduce((somme, parcelle) => somme + parcelle.productionKg, 0)),
    };
  });

  // La fiche disparaît si la parcelle choisie est masquée par le filtre.
  protected readonly fiche = computed(() => {
    const parcelle = this.parcellesVisibles().find((candidate) => candidate.id === this.parcelleChoisie());
    return (
      parcelle && {
        producteur: parcelle.producteur,
        cooperative: this.noms().get(parcelle.cooperative) ?? '',
        pieds: this.formatNombre().format(parcelle.pieds),
        production: this.formatNombre().format(parcelle.productionKg),
      }
    );
  });

  // Identifiant de la bulle ouverte : seulement si la fiche est affichable (le filtre peut masquer la parcelle).
  protected readonly idBulle = computed(() => (this.fiche() ? this.parcelleChoisie() : undefined));

  protected choisir(id: string): void {
    this.parcelleChoisie.set(id);
  }

  protected effacerChoix(): void {
    this.parcelleChoisie.set(undefined);
  }

  protected basculerCooperative(id: string): void {
    this.cooperativesMasquees.update((masquees) => {
      const suivant = new Set(masquees);
      if (!suivant.delete(id)) {
        suivant.add(id);
      }
      return suivant;
    });
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
