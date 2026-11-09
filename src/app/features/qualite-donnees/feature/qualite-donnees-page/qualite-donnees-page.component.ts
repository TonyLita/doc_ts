import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { StatutMoisComponent } from '../../../../shared/ui/statut-mois/statut-mois.component';
import { nomMois } from '../../../../shared/utils/nom-mois';
import { versOptions } from '../../../../shared/utils/options-liste';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { QualiteDonneesService } from '../../data-access/qualite-donnees.service';
import { TableauAnomaliesComponent } from '../../ui/tableau-anomalies/tableau-anomalies.component';

const anomaliesParPage = 10;

// Page intelligente (manuel 4.3) : charge le suivi de la fiabilité des données selon les filtres (anomalies page
// par page, côté serveur) et met les valeurs en forme dans la langue active. Consultation seule : la validation des
// saisies se fait sur le mobile (CDC §8.11).
@Component({
  selector: 'app-qualite-donnees-page',
  imports: [
    TranslocoPipe,
    FiltresCampagneCooperativeComponent,
    ChampListeComponent,
    CarteIndicateurComponent,
    StatutMoisComponent,
    TableauAnomaliesComponent,
    PaginationComponent,
  ],
  templateUrl: './qualite-donnees-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualiteDonneesPageComponent {
  private readonly service = inject(QualiteDonneesService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);
  protected readonly zone = signal<string | undefined>(undefined);
  protected readonly page = signal(1);

  private readonly chargement = ressourceFiltree(
    () => ({
      campagne: this.campagne(),
      cooperative: this.cooperative(),
      zone: this.zone(),
      page: this.page(),
      taille: anomaliesParPage,
    }),
    (filtres) => this.service.recuperer(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));

  protected readonly optionsZones = computed(() => versOptions(this.donnees()?.zones ?? []));

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const totalSaisies = donnees.saisiesValidees + donnees.saisiesEnAttente;
    return {
      score: nombre(donnees.scoreQualite),
      completude: nombre(donnees.completudeMensuelle),
      validation: nombre(donnees.tauxValidation),
      validees: nombre(donnees.saisiesValidees),
      totalSaisies: nombre(totalSaisies),
      enAttente: nombre(donnees.saisiesEnAttente),
      partEnAttente: nombre(100 - donnees.tauxValidation), // complément du taux fourni : les deux chiffres s'additionnent
      statuts: donnees.statutsMois.map((element) => ({
        libelle: nomMois(this.langue(), element.mois, 'short'),
        statut: element.statut,
      })),
      compteurs: donnees.anomalies.compteurs.map((compteur) => ({
        type: compteur.type,
        nombre: nombre(compteur.nombre),
      })),
      anomalies: donnees.anomalies.lignes.map((ligne) => ({
        ...ligne,
        mois: nomMois(this.langue(), ligne.mois, 'long'),
      })),
      totalAnomalies: nombre(donnees.anomalies.total),
      nombrePages: Math.max(1, Math.ceil(donnees.anomalies.total / anomaliesParPage)),
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

  protected choisirPage(page: number): void {
    this.page.set(page);
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
