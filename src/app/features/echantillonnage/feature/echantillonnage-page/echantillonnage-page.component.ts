import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { versOptions } from '../../../../shared/utils/options-liste';
import { rechercheDifferee } from '../../../../shared/utils/recherche-differee';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { StatutValidation } from '../../../../shared/models/statut-validation';
import { EchantillonnageService } from '../../data-access/echantillonnage.service';
import { CouvertureCooperativesComponent } from '../../ui/couverture-cooperatives/couverture-cooperatives.component';
import { TableauProducteursComponent } from '../../ui/tableau-producteurs/tableau-producteurs.component';

const producteursParPage = 20;

// Page intelligente (manuel 4.3) : charge l'échantillon page par page selon les filtres et la recherche
// (tout se fait côté serveur), puis met les valeurs en forme pour les composants d'affichage de ui/.
@Component({
  selector: 'app-echantillonnage-page',
  imports: [
    TranslocoPipe,
    FiltresCampagneCooperativeComponent,
    ChampListeComponent,
    CarteIndicateurComponent,
    CouvertureCooperativesComponent,
    TableauProducteursComponent,
    PaginationComponent,
  ],
  templateUrl: './echantillonnage-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EchantillonnagePageComponent {
  private readonly service = inject(EchantillonnageService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);
  protected readonly zone = signal<string | undefined>(undefined);
  protected readonly statut = signal<StatutValidation | undefined>(undefined);
  private readonly recherche = signal<string | undefined>(undefined);
  protected readonly page = signal(1);

  private readonly chargement = ressourceFiltree(
    () => ({
      campagne: this.campagne(),
      cooperative: this.cooperative(),
      zone: this.zone(),
      statut: this.statut(),
      recherche: this.recherche(),
      page: this.page(),
      taille: producteursParPage,
    }),
    (filtres) => this.service.recuperer(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));

  protected readonly optionsZones = computed(() =>
    versOptions(this.donnees()?.zones ?? []),
  );

  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    return {
      taux: donnees.couverture.taux,
      echantillon: nombre(donnees.couverture.echantillon),
      population: nombre(donnees.couverture.population),
      parCooperative: donnees.parCooperative.map((ligne) => ({
        id: ligne.id,
        nom: ligne.nom,
        taux: ligne.taux,
        suivis: nombre(ligne.echantillon),
        cibles: nombre(ligne.population),
      })),
      nombrePages: Math.max(1, Math.ceil(donnees.producteurs.total / producteursParPage)),
    };
  });

  // Un changement de filtre ramène à la première page.
  protected choisirCampagne(campagne: string): void {
    this.campagne.set(campagne);
    this.page.set(1);
  }

  // Une valeur vide signifie « toutes » : aucun filtre n'est envoyé.
  protected choisirCooperative(cooperative: string | undefined): void {
    this.cooperative.set(cooperative);
    this.page.set(1);
  }

  protected choisirZone(zone: string): void {
    this.zone.set(zone || undefined);
    this.page.set(1);
  }

  protected choisirStatut(statut: string): void {
    this.statut.set((statut as StatutValidation) || undefined);
    this.page.set(1);
  }

  // La recherche part au serveur après une courte pause : pas une requête par touche frappée.
  protected readonly rechercher = rechercheDifferee((terme) => {
    this.recherche.set(terme);
    this.page.set(1);
  });

  protected choisirPage(page: number): void {
    this.page.set(page);
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
