import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { actionServeur } from '../../../../shared/utils/action-serveur';
import { filtre } from '../../../../shared/utils/filtre';
import { langueDocument } from '../../../../shared/utils/langue-document';
import { nomMois } from '../../../../shared/utils/nom-mois';
import { versOptions } from '../../../../shared/utils/options-liste';
import { rechercheDifferee } from '../../../../shared/utils/recherche-differee';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { telechargerFichier } from '../../../../shared/utils/telecharger-fichier';
import { FormatExportProducteurs } from '../../data-access/producteurs.modeles';
import { ProducteursService } from '../../data-access/producteurs.service';
import { ListeProducteursComponent } from '../../ui/liste-producteurs/liste-producteurs.component';
import { ProducteurEnCours, SaisieFloraisonComponent } from '../saisie-floraison/saisie-floraison.component';

const producteursParPage = 20;
const absent = '–';
// Une zone garde sa couleur d'après son rang ; les couleurs se répètent au-delà de cinq zones (voir .couleur-zone-N).
const nombreCouleursZone = 5;

// Page intelligente (manuel 4.3) : charge les producteurs page par page selon la recherche par nom et prénom(s) (tout
// se fait côté serveur : plusieurs centaines à plus d'un millier de producteurs, CDC §9), puis met les valeurs en forme
// pour les composants d'affichage de ui/. Aucune création ni suppression : la liste vient de l'API externe (CDC §8.4).
// La saisie des données de floraison s'ouvre en modale, pour un producteur au choix ou pour celui d'une ligne. Excel et PDF
// téléchargent la liste telle qu'elle est filtrée (recherche et zone), produite par le serveur.
@Component({
  selector: 'app-producteurs-page',
  imports: [TranslocoPipe, ListeProducteursComponent, PaginationComponent, SaisieFloraisonComponent, ChampListeComponent],
  templateUrl: './producteurs-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProducteursPageComponent {
  private readonly service = inject(ProducteursService);
  private readonly langue = inject(LangueService).langueActive;

  private readonly recherche = signal<string | undefined>(undefined);
  protected readonly page = signal(1);
  protected readonly zone = filtre(() => this.page.set(1));
  // Langue des noms de zone et des fichiers : celle de l'interface (français ou anglais, le français en repli).
  private readonly langueDoc = computed(() => langueDocument(this.langue()));

  private readonly chargement = ressourceFiltree(
    () => ({
      recherche: this.recherche(),
      zone: this.zone.valeur(),
      page: this.page(),
      taille: producteursParPage,
      langue: this.langueDoc(),
    }),
    (filtres) => this.service.lister(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  // Saisie de floraison ouverte (sans producteur : il se choisit dans la modale).
  protected readonly saisie = signal<{ readonly producteur?: ProducteurEnCours } | undefined>(undefined);

  protected readonly optionsZones = computed(() => versOptions(this.donnees()?.zones ?? []));
  protected readonly exportation = actionServeur();

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  // L'âge moyen peut avoir une décimale (ex. 2,5 ans).
  private readonly formatAge = computed(() => new Intl.NumberFormat(this.langue(), { maximumFractionDigits: 1 }));

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const premier = (this.page() - 1) * producteursParPage;
    return {
      mois: donnees.mois.map((mois) => nomMois(this.langueDoc(), mois, 'short')),
      lignes: donnees.producteurs.lignes.map((producteur, indice) => {
        const rang = donnees.zones.findIndex((zone) => zone.id === producteur.zone);
        return {
          id: producteur.id,
          numero: nombre(premier + indice + 1),
          nom: producteur.nom,
          village: producteur.village,
          zone: rang >= 0 ? { nom: donnees.zones[rang].nom, rang: rang % nombreCouleursZone } : undefined,
          pieds: producteur.pieds === null ? absent : nombre(producteur.pieds),
          age: producteur.ageMoyen === null ? undefined : this.formatAge().format(producteur.ageMoyen),
          mois: producteur.fleursParMois.map(nombre),
          fleurs: nombre(producteur.fleurs),
        };
      }),
      totalProducteurs: nombre(donnees.producteurs.total),
      nombrePages: Math.max(1, Math.ceil(donnees.producteurs.total / producteursParPage)),
    };
  });

  // La recherche part au serveur après une courte pause : pas une requête par touche frappée.
  protected readonly rechercher = rechercheDifferee((terme) => {
    this.recherche.set(terme);
    this.page.set(1);
  });

  protected choisirPage(page: number): void {
    this.page.set(page);
  }

  // Télécharge la liste telle qu'elle est filtrée : le serveur produit le fichier, la page le fait télécharger.
  protected exporter(format: FormatExportProducteurs): void {
    this.exportation.lancer(
      this.service.exporter(format, { recherche: this.recherche(), zone: this.zone.valeur(), langue: this.langueDoc() }),
      { succes: (fichier) => telechargerFichier(fichier.contenu, fichier.nom) },
    );
  }

  protected ouvrirSaisie(identifiant?: string): void {
    const ligne = this.donnees()?.producteurs.lignes.find((candidat) => candidat.id === identifiant);
    this.saisie.set({ producteur: ligne && { id: ligne.id, nom: ligne.nom } });
  }

  protected fermerSaisie(): void {
    this.saisie.set(undefined);
  }

  // Une saisie change le total de fleurs et la date de dernière saisie : la liste se recharge.
  protected apresSaisie(): void {
    this.ressource.reload();
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
