import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth.service';
import { pageAutorisee } from '../../../../core/layout/sidebar/elements-menu';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { DialogueConfirmationComponent } from '../../../../shared/ui/dialogue-confirmation/dialogue-confirmation.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { actionServeur } from '../../../../shared/utils/action-serveur';
import { filtre } from '../../../../shared/utils/filtre';
import { formatsLocalises } from '../../../../shared/utils/formats-localises';
import { versOptions } from '../../../../shared/utils/options-liste';
import { paginationServeur } from '../../../../shared/utils/pagination-serveur';
import { rechercheDifferee } from '../../../../shared/utils/recherche-differee';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { DonneesParcelle, LigneParcelle, StatutParcelle } from '../../data-access/parcelles.modeles';
import { ParcellesService } from '../../data-access/parcelles.service';
import { FormulaireParcelleComponent } from '../../ui/formulaire-parcelle/formulaire-parcelle.component';
import { ListeParcellesComponent } from '../../ui/liste-parcelles/liste-parcelles.component';

const parcellesParPage = 20;
// Motifs d'échec propres aux écritures, avant les motifs communs (voir cleErreurService).
const erreursParcelle = { 404: 'introuvable', 422: 'invalide' } as const;

// Page intelligente (manuel 4.3) : charge les parcelles page par page selon les filtres et la recherche (tout se fait
// côté serveur : de 1 500 à 2 000 parcelles, CDC §8.5), puis relaie les écritures au serveur, réservées au Super
// Administrateur. Une parcelle ne se supprime pas : elle s'archive, ou se restaure. L'import en masse reste dans la page
// d'import (CDC §8.16), vers laquelle un lien mène.
@Component({
  selector: 'app-parcelles-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    CarteIndicateurComponent,
    ChampListeComponent,
    DialogueConfirmationComponent,
    PaginationComponent,
    FormulaireParcelleComponent,
    ListeParcellesComponent,
  ],
  templateUrl: './parcelles-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcellesPageComponent {
  private readonly service = inject(ParcellesService);
  private readonly profil = inject(AuthService).profilCourant;
  private readonly formats = formatsLocalises();

  protected readonly pagination = paginationServeur(parcellesParPage);
  protected readonly cooperative = filtre(this.pagination.reinitialiser);
  protected readonly zone = filtre(this.pagination.reinitialiser);
  protected readonly statut = filtre<StatutParcelle>(this.pagination.reinitialiser, 'active');
  private readonly recherche = signal<string | undefined>(undefined);

  // La recherche part au serveur après une courte pause : pas une requête par touche frappée.
  protected readonly rechercher = rechercheDifferee((terme) => {
    this.recherche.set(terme);
    this.pagination.reinitialiser();
  });

  private readonly chargement = ressourceFiltree(
    () => ({
      recherche: this.recherche(),
      cooperative: this.cooperative.valeur(),
      zone: this.zone.valeur(),
      statut: this.statut.valeur(),
      page: this.pagination.page(),
      taille: this.pagination.taille,
      langue: this.formats.langueDocument(),
    }),
    (filtres) => this.service.lister(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  // Écritures : une à la fois ; le serveur fait foi, la liste se recharge après chacune.
  private readonly action = actionServeur();
  protected readonly enCours = this.action.enCours;
  protected readonly cleErreur = this.action.cleErreur;

  // Formulaire ouvert (création : sans parcelle) et archivage en attente de confirmation.
  protected readonly formulaire = signal<{ readonly parcelle?: LigneParcelle } | undefined>(undefined);
  protected readonly confirmation = signal<{ readonly id: string; readonly code: string } | undefined>(undefined);

  // La page d'import n'est proposée qu'aux profils qui y ont droit (les droits sont ceux du menu).
  protected readonly peutImporter = computed(() => pageAutorisee('/imports', this.profil()));

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const { nombre, decimal, absent } = this.formats;
    const { synthese } = donnees;
    return {
      synthese: {
        parcelles: nombre(synthese.parcelles),
        partVanille: nombre(synthese.parcelles ? Math.round((synthese.enVanille / synthese.parcelles) * 100) : 0),
        production: nombre(synthese.productionKg),
      },
      lignes: donnees.parcelles.lignes.map((ligne) => ({
        id: ligne.id,
        code: ligne.code,
        producteur: ligne.producteur,
        cooperative: ligne.cooperative,
        latitude: decimal(ligne.latitude, 5),
        longitude: decimal(ligne.longitude, 5),
        pieds: nombre(ligne.pieds),
        production: nombre(ligne.productionKg),
        zone: ligne.zone ?? absent,
        vanille: ligne.vanille,
        archivee: ligne.archivee,
      })),
      total: nombre(donnees.parcelles.total),
      nombrePages: this.pagination.nombrePages(donnees.parcelles.total),
      cooperatives: versOptions(donnees.cooperatives),
      zones: versOptions(donnees.zones),
      // Plusieurs producteurs peuvent porter le même nom : le village les distingue.
      producteurs: donnees.producteurs.map((producteur) => ({
        valeur: producteur.id,
        libelle: `${producteur.nom} – ${producteur.village}`,
      })),
    };
  });

  // Ce que le formulaire reçoit pour modifier une parcelle : les identifiants désignent le producteur et la coopérative.
  protected readonly parcelleOuverte = computed<DonneesParcelle | undefined>(() => {
    const parcelle = this.formulaire()?.parcelle;
    return (
      parcelle && {
        producteur: parcelle.producteurId,
        cooperative: parcelle.cooperativeId,
        latitude: parcelle.latitude,
        longitude: parcelle.longitude,
        pieds: parcelle.pieds,
        vanille: parcelle.vanille,
      }
    );
  });

  protected ouvrirCreation(): void {
    this.formulaire.set({});
  }

  protected ouvrirModification(id: string): void {
    const parcelle = this.ligne(id);
    if (parcelle) {
      this.formulaire.set({ parcelle });
    }
  }

  protected fermerFormulaire(): void {
    this.formulaire.set(undefined);
  }

  protected enregistrer(donnees: DonneesParcelle): void {
    const id = this.formulaire()?.parcelle?.id;
    this.action.lancer(id === undefined ? this.service.creer(donnees) : this.service.modifier(id, donnees), {
      erreurs: erreursParcelle,
      succes: () => this.apres(() => this.formulaire.set(undefined)),
    });
  }

  protected demanderArchivage(id: string): void {
    const parcelle = this.ligne(id);
    if (parcelle) {
      this.confirmation.set({ id, code: parcelle.code });
    }
  }

  protected annulerConfirmation(): void {
    this.confirmation.set(undefined);
  }

  protected confirmerArchivage(): void {
    const demande = this.confirmation();
    if (demande) {
      this.confirmation.set(undefined);
      this.changerArchivage(demande.id, true);
    }
  }

  // Restaurer ne détruit rien : pas de confirmation.
  protected restaurer(id: string): void {
    this.changerArchivage(id, false);
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  private changerArchivage(id: string, archivee: boolean): void {
    this.action.lancer(this.service.archiver(id, archivee), {
      erreurs: erreursParcelle,
      succes: () => this.apres(),
    });
  }

  private ligne(id: string): LigneParcelle | undefined {
    return this.donnees()?.parcelles.lignes.find((candidate) => candidate.id === id);
  }

  // Le serveur a accepté l'écriture : on referme ce qui était ouvert, puis la liste se recharge.
  private apres(fermer?: () => void): void {
    fermer?.();
    this.ressource.reload();
  }
}
