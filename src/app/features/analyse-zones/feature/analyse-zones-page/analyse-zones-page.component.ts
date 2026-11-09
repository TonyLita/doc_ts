import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { BlocSyntheseComponent } from '../../../../shared/ui/bloc-synthese/bloc-synthese.component';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { GraphiqueFloraisonComponent } from '../../../../shared/ui/graphique-floraison/graphique-floraison.component';
import { nomMois } from '../../../../shared/utils/nom-mois';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { AnalyseZonesService } from '../../data-access/analyse-zones.service';
import { ProfilPeriodeComponent } from '../../ui/profil-periode/profil-periode.component';

// Page intelligente (manuel 4.3) : charge l'analyse selon les filtres, met les valeurs en forme dans la langue
// active et répète une colonne par zone reçue du serveur. La disposition vient de core/layout/page.css.
@Component({
  selector: 'app-analyse-zones-page',
  imports: [
    TranslocoPipe,
    FiltresCampagneCooperativeComponent,
    CarteIndicateurComponent,
    GraphiqueFloraisonComponent,
    BlocSyntheseComponent,
    ProfilPeriodeComponent,
  ],
  templateUrl: './analyse-zones-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyseZonesPageComponent {
  private readonly service = inject(AnalyseZonesService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);

  private readonly chargement = ressourceFiltree(
    () => ({ campagne: this.campagne(), cooperative: this.cooperative() }),
    (filtres) => this.service.recuperer(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));

  // Une entrée par zone, prête à afficher (nombres et mois formatés dans la langue active).
  protected readonly zones = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return [];
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const moisCourt = (mois: number) => nomMois(this.langue(), mois, 'short');

    return donnees.zones.map((zone) => ({
      id: zone.id,
      nom: zone.nom,
      profil: zone.profil,
      producteurs: nombre(zone.producteurs),
      fleurs: nombre(zone.fleurs),
      part: nombre(zone.partTotal),
      partTotal: zone.partTotal,
      serieMensuelle: [zone.nom],
      mensuel: zone.mensuel.map((ligne) => ({ libelle: moisCourt(ligne.mois), valeurs: [ligne.fleurs] })),
      // Une série par campagne : les précédentes, puis la campagne affichée en dernier.
      campagnes: [...zone.historique.map((ancienne) => ancienne.campagne), donnees.campagne],
      comparaison: zone.mensuel.map((ligne) => ({
        libelle: moisCourt(ligne.mois),
        valeurs: [
          ...zone.historique.map(
            (ancienne) => ancienne.mensuel.find((fleurs) => fleurs.mois === ligne.mois)?.fleurs ?? 0,
          ),
          ligne.fleurs,
        ],
      })),
    }));
  });

  protected choisirCampagne(campagne: string): void {
    this.campagne.set(campagne);
  }

  // Sans coopérative choisie (« toutes »), aucun filtre n'est envoyé.
  protected choisirCooperative(cooperative: string | undefined): void {
    this.cooperative.set(cooperative);
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
