import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { DialogueConfirmationComponent } from '../../../../shared/ui/dialogue-confirmation/dialogue-confirmation.component';
import { OngletsComponent } from '../../../../shared/ui/onglets/onglets.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { indiceCouleurSerie } from '../../../../shared/utils/couleur-serie';
import { langueDocument } from '../../../../shared/utils/langue-document';
import { versOptions } from '../../../../shared/utils/options-liste';
import { rechercheDifferee } from '../../../../shared/utils/recherche-differee';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { ReferentielExterneService } from '../../data-access/referentiel-externe.service';
import { ZonesVillagesService } from '../../data-access/zones-villages.service';
import { ArbreGeographiqueComponent, CommuneArbreVue } from '../../ui/arbre-geographique/arbre-geographique.component';
import { BarreAffectationComponent } from '../../ui/barre-affectation/barre-affectation.component';
import { RepartitionZonesComponent } from '../../ui/repartition-zones/repartition-zones.component';
import { TableauVillagesComponent, ZoneChangee, LigneChoisie } from '../../ui/tableau-villages/tableau-villages.component';

const villagesParPage = 20;

type OngletPage = 'arbre' | 'zones';

// Le serveur refuse ou accepte : la plateforme ne traduit que le motif, jamais de trace technique (manuel 4.7).
function cleErreurAffectation(statut: number): string {
  const cles: Record<number, string> = { 404: 'introuvable', 422: 'invalide' };
  return cles[statut] ?? cleErreurService(statut);
}

// Page intelligente (manuel 4.3) : un résumé chiffré (communes, villages, parcelles, répartition par zone), puis deux
// onglets — l'arborescence communes › villages › parcelles (lecture seule, pour tous) et le paramétrage des zones. Ce
// dernier charge les villages page par page selon les filtres et la recherche (tout se fait côté serveur) et, pour le
// Super Administrateur seul, garde le brouillon des zones changées jusqu'à leur enregistrement groupé (CDC §8.2).
// Communes et villages ne sont jamais modifiés ici.
@Component({
  selector: 'app-referentiel-geo-page',
  imports: [
    TranslocoPipe,
    CarteIndicateurComponent,
    ChampListeComponent,
    DialogueConfirmationComponent,
    PaginationComponent,
    BarreAffectationComponent,
    TableauVillagesComponent,
    OngletsComponent,
    RepartitionZonesComponent,
    ArbreGeographiqueComponent,
  ],
  templateUrl: './referentiel-geo-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferentielGeoPageComponent {
  private readonly referentielExterne = inject(ReferentielExterneService);
  private readonly zonesVillages = inject(ZonesVillagesService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly commune = signal<string | undefined>(undefined);
  protected readonly zone = signal<string | undefined>(undefined);
  protected readonly sansZone = signal(false);
  private readonly recherche = signal<string | undefined>(undefined);
  protected readonly page = signal(1);

  private readonly chargement = ressourceFiltree(
    () => ({
      commune: this.commune(),
      zone: this.zone(),
      sansZone: this.sansZone(),
      recherche: this.recherche(),
      page: this.page(),
      taille: villagesParPage,
      langue: langueDocument(this.langue()),
    }),
    (filtres) => this.referentielExterne.villages(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  protected readonly onglet = signal<OngletPage>('arbre');

  // L'arborescence ne se charge que lorsque son onglet est affiché : revenir à l'arbre après avoir changé des zones la
  // recharge, donc elle reflète toujours les zones enregistrées.
  private readonly chargementArbre = ressourceFiltree(
    () => (this.onglet() === 'arbre' ? { langue: langueDocument(this.langue()) } : undefined),
    (filtres) => this.referentielExterne.arbre(filtres.langue),
  );
  protected readonly ressourceArbre = this.chargementArbre.ressource;
  protected readonly arbre = this.chargementArbre.donnees;

  // Brouillon des zones changées (village → zone, null = sans zone) et villages cochés pour l'affectation en lot.
  // Ils survivent aux changements de filtre et de page ; rien n'est écrit avant la confirmation.
  private readonly brouillon = signal<ReadonlyMap<string, string | null>>(new Map());
  private readonly selection = signal<ReadonlySet<string>>(new Set());
  protected readonly confirmation = signal(false);
  protected readonly enCours = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  private readonly formatPourcentage = computed(
    () => new Intl.NumberFormat(this.langue(), { style: 'percent', maximumFractionDigits: 0 }),
  );
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langue(), { dateStyle: 'short', timeStyle: 'short' }),
  );

  protected readonly optionsCommunes = computed(() => versOptions(this.donnees()?.communes ?? []));
  protected readonly optionsZones = computed(() => versOptions(this.donnees()?.zones ?? []));

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const brouillon = this.brouillon();
    const selection = this.selection();
    const nomsZones = new Map(donnees.zones.map((zone) => [zone.id, zone.nom]));
    const lignes = donnees.villages.lignes.map((village) => {
      const modifiee = brouillon.has(village.id);
      const zone = modifiee ? (brouillon.get(village.id) ?? null) : village.zone;
      return {
        id: village.id,
        commune: village.commune,
        village: village.nom,
        zone: zone ?? '',
        zoneNom: (zone && nomsZones.get(zone)) || '',
        modifiee,
        choisie: selection.has(village.id),
      };
    });
    const { compteurs } = donnees;
    // Part des villages de la zone : la barre utilise la valeur exacte, la légende l'arrondit.
    const part = (villages: number) => (compteurs.total ? (villages / compteurs.total) * 100 : 0);
    const pourcentage = (villages: number) => this.formatPourcentage().format(compteurs.total ? villages / compteurs.total : 0);
    return {
      derniere: donnees.derniereSynchronisation ? this.formatDate().format(new Date(donnees.derniereSynchronisation)) : '–',
      communes: nombre(compteurs.communes),
      total: nombre(compteurs.total),
      parcelles: nombre(compteurs.parcelles),
      repartition: donnees.zones.map((zone, indice) => {
        const compteur = compteurs.parZone.find((candidat) => candidat.zone === zone.id);
        const villages = compteur?.villages ?? 0;
        return {
          id: zone.id,
          nom: zone.nom,
          rang: indiceCouleurSerie(indice),
          part: part(villages),
          villages: nombre(villages),
          pourcentage: pourcentage(villages),
          parcelles: nombre(compteur?.parcelles ?? 0),
        };
      }),
      repartitionSansZone: compteurs.sansZone
        ? {
            part: part(compteurs.sansZone),
            villages: nombre(compteurs.sansZone),
            pourcentage: pourcentage(compteurs.sansZone),
            parcelles: nombre(compteurs.parcellesSansZone),
          }
        : undefined,
      lignes,
      toutesChoisies: lignes.length > 0 && lignes.every((ligne) => ligne.choisie),
      nombreSelectionnes: selection.size,
      nombreModifications: brouillon.size,
      totalVillages: nombre(donnees.villages.total),
      nombrePages: Math.max(1, Math.ceil(donnees.villages.total / villagesParPage)),
    };
  });

  // L'arborescence prête à afficher : la couleur d'une zone suit son rang dans la liste du serveur, comme partout.
  protected readonly vueArbre = computed((): readonly CommuneArbreVue[] | undefined => {
    const arbre = this.arbre();
    if (!arbre) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const zones = new Map(arbre.zones.map((zone, indice) => [zone.id, { nom: zone.nom, rang: indiceCouleurSerie(indice) }]));
    return arbre.communes.map((commune) => {
      const villages = commune.villages.map((village) => {
        const zone = village.zone ? zones.get(village.zone) : undefined;
        return {
          id: village.id,
          nom: village.nom,
          rang: zone?.rang ?? null,
          zoneNom: zone?.nom ?? '',
          parcelles: village.parcelles,
          nombreParcelles: nombre(village.parcelles.length),
        };
      });
      return {
        id: commune.id,
        nom: commune.nom,
        villages,
        nombreVillages: nombre(villages.length),
        nombreParcelles: nombre(villages.reduce((somme, village) => somme + village.parcelles.length, 0)),
      };
    });
  });

  // La recherche part au serveur après une courte pause : pas une requête par touche frappée.
  protected readonly rechercher = rechercheDifferee((terme) => {
    this.recherche.set(terme);
    this.page.set(1);
  });

  // Un changement de filtre ramène à la première page. Une valeur vide signifie « toutes » : aucun filtre n'est envoyé.
  protected choisirCommune(commune: string): void {
    this.commune.set(commune || undefined);
    this.page.set(1);
  }

  // Zone précise et « sans zone » s'excluent : choisir l'une retire l'autre.
  protected choisirZone(zone: string): void {
    this.zone.set(zone || undefined);
    if (zone) {
      this.sansZone.set(false);
    }
    this.page.set(1);
  }

  protected basculerSansZone(evenement: Event): void {
    const coche = (evenement.target as HTMLInputElement).checked;
    this.sansZone.set(coche);
    if (coche) {
      this.zone.set(undefined);
    }
    this.page.set(1);
  }

  protected choisirOnglet(onglet: string): void {
    this.onglet.set(onglet as OngletPage);
  }

  protected choisirPage(page: number): void {
    this.page.set(page);
  }

  protected changerZone(changement: ZoneChangee): void {
    this.ecrireBrouillon(changement.village, changement.zone);
  }

  protected choisirLigne(ligne: LigneChoisie): void {
    this.selection.update((courante) => {
      const suivante = new Set(courante);
      if (ligne.choisie) {
        suivante.add(ligne.village);
      } else {
        suivante.delete(ligne.village);
      }
      return suivante;
    });
  }

  // La case de l'en-tête agit sur les villages de la page affichée.
  protected choisirToutes(choisies: boolean): void {
    const identifiants = this.donnees()?.villages.lignes.map((village) => village.id) ?? [];
    this.selection.update((courante) => {
      const suivante = new Set(courante);
      for (const identifiant of identifiants) {
        if (choisies) {
          suivante.add(identifiant);
        } else {
          suivante.delete(identifiant);
        }
      }
      return suivante;
    });
  }

  // Affectation en lot : la zone choisie entre au brouillon pour tous les villages cochés.
  protected affecter(zone: string): void {
    for (const village of this.selection()) {
      this.ecrireBrouillon(village, zone);
    }
    this.selection.set(new Set());
  }

  protected annulerModifications(): void {
    this.brouillon.set(new Map());
  }

  protected demanderConfirmation(): void {
    if (this.brouillon().size > 0) {
      this.confirmation.set(true);
    }
  }

  protected annulerConfirmation(): void {
    this.confirmation.set(false);
  }

  protected confirmer(): void {
    this.confirmation.set(false);
    const affectations = Array.from(this.brouillon(), ([village, zone]) => ({ village, zone }));
    this.executer(this.zonesVillages.affecter(affectations), () => {
      this.brouillon.set(new Map());
      this.selection.set(new Set());
    });
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  protected rechargerArbre(): void {
    this.ressourceArbre.reload();
  }

  // Un village remis à sa zone d'origine sort du brouillon : il n'y a plus rien à enregistrer pour lui.
  private ecrireBrouillon(village: string, zone: string | null): void {
    const connu = this.donnees()?.villages.lignes.find((candidat) => candidat.id === village);
    this.brouillon.update((courant) => {
      const suivant = new Map(courant);
      if (connu && connu.zone === zone) {
        suivant.delete(village);
      } else {
        suivant.set(village, zone);
      }
      return suivant;
    });
  }

  // Envoie les changements au serveur puis recharge la page : le serveur fait foi, rien n'est modifié en local.
  private executer(requete: Observable<void>, apres: () => void): void {
    this.enCours.set(true);
    this.cleErreur.set(undefined);
    requete.subscribe({
      next: () => {
        this.enCours.set(false);
        apres();
        this.ressource.reload();
      },
      error: (erreur: AppError) => {
        this.enCours.set(false);
        this.cleErreur.set(cleErreurAffectation(erreur.status));
      },
    });
  }
}
