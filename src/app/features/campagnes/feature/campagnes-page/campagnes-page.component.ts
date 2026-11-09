import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { DialogueConfirmationComponent } from '../../../../shared/ui/dialogue-confirmation/dialogue-confirmation.component';
import { GraphiqueFloraisonComponent } from '../../../../shared/ui/graphique-floraison/graphique-floraison.component';
import { nomMois } from '../../../../shared/utils/nom-mois';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { DonneesCampagne } from '../../data-access/campagnes.modeles';
import { CampagnesService } from '../../data-access/campagnes.service';
import { FormulaireCampagneComponent } from '../../ui/formulaire-campagne/formulaire-campagne.component';
import { SelecteurCampagnesComponent } from '../../ui/selecteur-campagnes/selecteur-campagnes.component';
import { TableauCampagnesComponent } from '../../ui/tableau-campagnes/tableau-campagnes.component';
import { TableauComparaisonComponent } from '../../ui/tableau-comparaison/tableau-comparaison.component';

type ActionConfirmee = 'cloturer' | 'activer';

// Par défaut, on compare la campagne la plus récente à la précédente.
const campagnesCompareesParDefaut = 2;

// Le serveur refuse ou accepte : la plateforme ne traduit que le motif, jamais de trace technique (manuel 4.7).
function cleErreurAction(statut: number): string {
  return ({ 403: 'interdit', 422: 'invalide' } as Record<number, string>)[statut] ?? 'generique';
}

// Page intelligente : charge l'historique des campagnes et leur comparaison, puis relaie les actions
// d'administration au serveur. Les actions n'apparaissent que si le serveur les autorise. Un sélecteur choisit la
// campagne présentée en haut de page ; il ne change pas la campagne active (réservé au Super Administrateur, CDC §8.12).
// Les campagnes ne se créent pas depuis cette page : seules leurs dates se modifient.
@Component({
  selector: 'app-campagnes-page',
  imports: [
    TranslocoPipe,
    CarteIndicateurComponent,
    ChampListeComponent,
    GraphiqueFloraisonComponent,
    DialogueConfirmationComponent,
    FormulaireCampagneComponent,
    SelecteurCampagnesComponent,
    TableauCampagnesComponent,
    TableauComparaisonComponent,
  ],
  templateUrl: './campagnes-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagnesPageComponent {
  private readonly service = inject(CampagnesService);
  private readonly langue = inject(LangueService).langueActive;

  private readonly chargement = ressourceFiltree(
    () => ({}),
    () => this.service.recuperer(),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  // Formulaire de modification ouvert (dates de la campagne) et action en attente de confirmation.
  protected readonly formulaire = signal<DonneesCampagne | undefined>(undefined);
  protected readonly confirmation = signal<{ readonly action: ActionConfirmee; readonly id: string } | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);
  private readonly choix = signal<readonly string[] | undefined>(undefined);
  // Campagne présentée en haut de page : le choix de l'utilisateur, sinon la campagne active.
  private readonly idAffichee = signal<string | undefined>(undefined);

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  // Les dates sont des jours calendaires (sans heure) : on les lit en UTC pour qu'aucun fuseau ne les décale.
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langue(), { dateStyle: 'short', timeZone: 'UTC' }),
  );

  protected readonly optionsCampagnes = computed(() =>
    (this.donnees()?.campagnes ?? []).map((campagne) => ({ valeur: campagne.id, libelle: campagne.id })),
  );

  // Identifiants des campagnes comparées : le choix de l'utilisateur, sinon les plus récentes.
  private readonly comparees = computed(
    () => this.choix() ?? (this.donnees()?.campagnes ?? []).slice(0, campagnesCompareesParDefaut).map((c) => c.id),
  );

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const date = (iso: string) => this.formatDate().format(new Date(iso));
    const moisLong = (mois: number) => {
      const nom = nomMois(this.langue(), mois, 'long');
      return nom.charAt(0).toUpperCase() + nom.slice(1);
    };

    const affichee =
      donnees.campagnes.find((campagne) => campagne.id === this.idAffichee()) ??
      donnees.campagnes.find((campagne) => campagne.active) ??
      donnees.campagnes[0];
    const choisies = this.comparees();
    const indicateurs = donnees.comparaison.filter((ligne) => choisies.includes(ligne.campagne));
    // L'axe des mois est celui de la campagne la plus longue parmi celles comparées.
    const axe = indicateurs.reduce(
      (plusLongue, ligne) => (ligne.floraisonMensuelle.length > plusLongue.length ? ligne.floraisonMensuelle : plusLongue),
      [] as readonly { readonly mois: number }[],
    );

    return {
      affichee: affichee && {
        id: affichee.id,
        detail: `${date(affichee.debut)} → ${date(affichee.fin)}`,
        statut: affichee.statut,
        estActive: affichee.active,
      },
      lignes: donnees.campagnes.map((campagne) => ({
        id: campagne.id,
        debut: date(campagne.debut),
        fin: date(campagne.fin),
        statut: campagne.statut,
        active: campagne.active,
      })),
      choix: donnees.campagnes.map((campagne) => ({ id: campagne.id, choisie: choisies.includes(campagne.id) })),
      series: indicateurs.map((ligne) => ligne.campagne),
      mois: axe.map(({ mois }) => ({
        libelle: nomMois(this.langue(), mois, 'short'),
        valeurs: indicateurs.map(
          (ligne) => ligne.floraisonMensuelle.find((element) => element.mois === mois)?.fleurs ?? 0,
        ),
      })),
      comparaison: indicateurs.map((ligne) => ({
        campagne: ligne.campagne,
        totalFleurs: nombre(ligne.totalFleurs),
        producteursSuivis: nombre(ligne.producteursSuivis),
        moisPic: moisLong(ligne.moisPic),
        production: nombre(ligne.productionEstimeeKg),
      })),
    };
  });

  protected ouvrirModification(id: string): void {
    const campagne = this.donnees()?.campagnes.find((candidate) => candidate.id === id);
    if (campagne) {
      this.formulaire.set({ id: campagne.id, debut: campagne.debut, fin: campagne.fin });
    }
  }

  protected fermerFormulaire(): void {
    this.formulaire.set(undefined);
  }

  protected enregistrer(donnees: DonneesCampagne): void {
    this.executer(this.service.modifier(donnees), () => this.formulaire.set(undefined));
  }

  protected choisirAffichee(id: string): void {
    this.idAffichee.set(id);
  }

  protected demanderConfirmation(action: ActionConfirmee, id: string): void {
    this.confirmation.set({ action, id });
  }

  protected annulerConfirmation(): void {
    this.confirmation.set(undefined);
  }

  protected confirmer(): void {
    const demande = this.confirmation();
    if (!demande) {
      return;
    }
    this.confirmation.set(undefined);
    this.executer(
      demande.action === 'activer' ? this.service.activer(demande.id) : this.service.cloturer(demande.id),
    );
  }

  protected basculerCampagne(id: string): void {
    const choisies = this.comparees();
    this.choix.set(choisies.includes(id) ? choisies.filter((candidate) => candidate !== id) : [...choisies, id]);
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  // Envoie l'action au serveur puis recharge l'historique : le serveur fait foi, rien n'est modifié en local.
  private executer(requete: Observable<void>, apres?: () => void): void {
    this.enCours.set(true);
    this.cleErreur.set(undefined);
    requete.subscribe({
      next: () => {
        this.enCours.set(false);
        apres?.();
        this.ressource.reload();
      },
      error: (erreur: AppError) => {
        this.enCours.set(false);
        this.cleErreur.set(cleErreurAction(erreur.status));
      },
    });
  }
}
