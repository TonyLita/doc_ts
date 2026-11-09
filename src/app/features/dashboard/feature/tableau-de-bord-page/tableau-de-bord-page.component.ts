import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { TableauDeBordService } from '../../data-access/tableau-de-bord.service';
import { BlocSyntheseComponent } from '../../../../shared/ui/bloc-synthese/bloc-synthese.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { nomMois } from '../../../../shared/utils/nom-mois';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { GraphiqueFloraisonComponent } from '../../../../shared/ui/graphique-floraison/graphique-floraison.component';
import { GraphiqueZonesComponent } from '../../../../shared/ui/graphique-zones/graphique-zones.component';
import { StatutMoisComponent } from '../../../../shared/ui/statut-mois/statut-mois.component';

// Page intelligente (manuel 4.3) : charge les données selon les filtres, les met en forme dans la langue
// active et les passe aux composants d'affichage de ui/. Le header, la sidebar et la mise en page viennent
// de core/layout ; les styles communs (cartes, grilles, filtres) sont dans core/layout/layout.css.
@Component({
  selector: 'app-tableau-de-bord-page',
  imports: [
    TranslocoPipe,
    FiltresCampagneCooperativeComponent,
    CarteIndicateurComponent,
    StatutMoisComponent,
    GraphiqueFloraisonComponent,
    GraphiqueZonesComponent,
    BlocSyntheseComponent,
  ],
  templateUrl: './tableau-de-bord-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauDeBordPageComponent {
  private readonly service = inject(TableauDeBordService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);

  // Sans campagne choisie, le serveur renvoie la campagne en cours (CDC §8.12).
  private readonly chargement = ressourceFiltree(
    () => ({ campagne: this.campagne(), cooperative: this.cooperative() }),
    (filtres) => this.service.recuperer(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langue(), { dateStyle: 'short', timeStyle: 'short' }),
  );

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }

    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const moisCourt = (mois: number) => nomMois(this.langue(), mois, 'short');
    const moisPic = nomMois(this.langue(), donnees.moisPic, 'long');

    return {
      producteurs: nombre(donnees.producteursSuivis),
      couverture: nombre(donnees.tauxCouverture),
      fleurs: nombre(donnees.totalFleurs),
      moisPic: moisPic.charAt(0).toUpperCase() + moisPic.slice(1),
      production: nombre(donnees.productionEstimeeKg),
      cooperatives: nombre(donnees.cooperativesActives),
      saisies: nombre(donnees.tauxSaisiesValides),
      statuts: donnees.statutsMois.map((element) => ({
        libelle: moisCourt(element.mois),
        statut: element.statut,
      })),
      mois: donnees.floraisonMensuelle.map((ligne) => ({
        libelle: moisCourt(ligne.mois),
        valeurs: ligne.fleursParZone,
      })),
      zones: donnees.zones.map((nom, indice) => ({
        nom,
        valeur: donnees.floraisonMensuelle.reduce((somme, ligne) => somme + ligne.fleursParZone[indice], 0),
      })),
      derniereSynchronisation: this.formatDate().format(new Date(donnees.derniereSynchronisation)),
    };
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
