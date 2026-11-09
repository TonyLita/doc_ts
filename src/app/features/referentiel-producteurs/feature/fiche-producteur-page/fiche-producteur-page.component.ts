import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { indiceCouleurSerie } from '../../../../shared/utils/couleur-serie';
import { langueDocument } from '../../../../shared/utils/langue-document';
import { versOptions } from '../../../../shared/utils/options-liste';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { DonneesProgramme } from '../../data-access/producteurs.modeles';
import { ProducteursService } from '../../data-access/producteurs.service';
import { BlocIdentiteComponent } from '../../ui/bloc-identite/bloc-identite.component';
import { BlocProgrammeComponent } from '../../ui/bloc-programme/bloc-programme.component';
import { CartesParcellesComponent } from '../../ui/cartes-parcelles/cartes-parcelles.component';
import { TableauHistoriqueComponent } from '../../ui/tableau-historique/tableau-historique.component';
import { SaisieFloraisonComponent } from '../saisie-floraison/saisie-floraison.component';

const absent = '–';

// Le serveur refuse ou accepte : la plateforme ne traduit que le motif, jamais de trace technique (manuel 4.7).
function cleErreurProgramme(statut: number): string {
  const cles: Record<number, string> = { 404: 'introuvable', 422: 'invalide' };
  return cles[statut] ?? cleErreurService(statut);
}

// Page intelligente (manuel 4.3) : la fiche d'un producteur en quatre blocs (CDC §8.4) — identité et localisation
// (API externe, lecture seule), données du programme (modifiables par le seul Super Administrateur, le serveur fait
// foi), parcelles (une carte chacune : zone, fleurs pollinisées, dernière saisie) et historique des observations.
// La saisie des données de floraison s'ouvre en modale pour ce producteur. Aucune création ni suppression de producteur.
@Component({
  selector: 'app-fiche-producteur-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    BlocIdentiteComponent,
    BlocProgrammeComponent,
    CartesParcellesComponent,
    TableauHistoriqueComponent,
    SaisieFloraisonComponent,
  ],
  templateUrl: './fiche-producteur-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FicheProducteurPageComponent {
  private readonly service = inject(ProducteursService);
  private readonly langue = inject(LangueService).langueActive;
  private readonly identifiant = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((parametres) => parametres.get('id') ?? undefined)),
    { initialValue: undefined },
  );

  private readonly chargement = ressourceFiltree(
    () => {
      const id = this.identifiant();
      return id ? { id, langue: langueDocument(this.langue()) } : undefined;
    },
    (filtres) => this.service.fiche(filtres.id, filtres.langue),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  protected readonly saisieOuverte = signal(false);
  protected readonly enCours = signal(false);
  protected readonly enregistre = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);

  // Un identifiant inconnu du serveur (404) n'est pas une panne : il a son propre message, sans « réessayer ».
  protected readonly introuvable = computed(() => {
    const erreur = this.ressource.error() as { status?: number; cause?: { status?: number } } | undefined;
    return (erreur?.status ?? erreur?.cause?.status) === 404;
  });

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  // Les dates sont des jours calendaires (sans heure) : on les lit en UTC pour qu'aucun fuseau ne les décale.
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langue(), { dateStyle: 'short', timeZone: 'UTC' }),
  );

  protected readonly optionsCooperatives = computed(() => versOptions(this.donnees()?.cooperatives ?? []));

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active). Le genre absent (identité réduite pour ce
  // profil) reste « – » : la plateforme ne reconstitue rien.
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const { identite, programme } = donnees;
    const cooperative = donnees.cooperatives.find((candidate) => candidate.id === programme.cooperative);
    // La couleur d'une zone suit son rang dans la liste du serveur, comme partout dans l'application.
    const zones = new Map(donnees.zones.map((zone, indice) => [zone.id, { nom: zone.nom, rang: indiceCouleurSerie(indice) }]));
    return {
      nomComplet: `${identite.nom} ${identite.prenom}`,
      identite: {
        nom: identite.nom,
        prenom: identite.prenom,
        genre: identite.genre,
        village: identite.village,
        commune: identite.commune,
        code: identite.code,
      },
      programme: {
        cooperative: cooperative?.nom ?? absent,
        zone: programme.zone ?? absent,
        pieds: programme.pieds === null ? absent : nombre(programme.pieds),
        ageMoyen: programme.ageMoyen === null ? absent : nombre(programme.ageMoyen),
      },
      parcelles: donnees.parcelles.map((parcelle) => {
        const zone = parcelle.zone ? zones.get(parcelle.zone) : undefined;
        return {
          id: parcelle.id,
          nom: parcelle.libelle,
          rang: zone?.rang ?? null,
          zoneNom: zone?.nom ?? '',
          fleurs: nombre(parcelle.fleurs),
          derniereSaisie: parcelle.derniereSaisie ? this.formatDate().format(new Date(parcelle.derniereSaisie)) : absent,
        };
      }),
      observations: donnees.observations.map((observation) => ({
        id: observation.id,
        date: this.formatDate().format(new Date(observation.date)),
        campagne: observation.campagne,
        quantite: observation.quantite,
        periode: observation.periode,
        calibrage: observation.calibrage,
        statutValidation: observation.statutValidation,
      })),
    };
  });

  protected enregistrerProgramme(donnees: DonneesProgramme): void {
    const id = this.identifiant();
    if (!id) {
      return;
    }
    this.enCours.set(true);
    this.enregistre.set(false);
    this.cleErreur.set(undefined);
    this.service.enregistrerProgramme(id, donnees).subscribe({
      next: () => {
        this.enCours.set(false);
        this.enregistre.set(true);
        this.ressource.reload();
      },
      error: (erreur: AppError) => {
        this.enCours.set(false);
        this.cleErreur.set(cleErreurProgramme(erreur.status));
      },
    });
  }

  protected ouvrirSaisie(): void {
    this.saisieOuverte.set(true);
  }

  protected fermerSaisie(): void {
    this.saisieOuverte.set(false);
  }

  // Une saisie change les fleurs et la dernière saisie de chaque parcelle : la fiche se recharge.
  protected apresSaisie(): void {
    this.ressource.reload();
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
