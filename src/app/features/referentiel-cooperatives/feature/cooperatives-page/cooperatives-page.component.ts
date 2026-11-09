import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { DialogueConfirmationComponent } from '../../../../shared/ui/dialogue-confirmation/dialogue-confirmation.component';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { DonneesCooperative, FicheCooperative } from '../../data-access/cooperatives.modeles';
import { CooperativesService } from '../../data-access/cooperatives.service';
import { FormulaireCooperativeComponent } from '../../ui/formulaire-cooperative/formulaire-cooperative.component';
import { TableauCooperativesComponent } from '../../ui/tableau-cooperatives/tableau-cooperatives.component';

type Tri = 'nom' | 'commune' | 'producteurs' | 'parcelles';

// Le serveur refuse ou accepte : la plateforme ne traduit que le motif, jamais de trace technique (manuel 4.7).
// Un 409 n'a pas le même sens à l'enregistrement (nom déjà pris) et à la suppression (producteurs ou parcelles rattachés).
function cleErreurCooperative(statut: number, suppression: boolean): string {
  const cles: Record<number, string> = {
    404: 'introuvable',
    409: suppression ? 'rattachee' : 'doublon',
    422: 'invalide',
  };
  return cles[statut] ?? cleErreurService(statut);
}

// Page intelligente (manuel 4.3) : charge toutes les coopératives (une dizaine de lignes : une page suffit), les
// recherche et les trie côté client, puis relaie les actions d'administration au serveur. Les actions n'apparaissent
// que si le serveur les autorise ; chaque action est de nouveau contrôlée par lui (CDC §8.3).
@Component({
  selector: 'app-cooperatives-page',
  imports: [
    TranslocoPipe,
    CarteIndicateurComponent,
    ChampListeComponent,
    DialogueConfirmationComponent,
    FormulaireCooperativeComponent,
    TableauCooperativesComponent,
  ],
  templateUrl: './cooperatives-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CooperativesPageComponent {
  private readonly service = inject(CooperativesService);
  private readonly langue = inject(LangueService).langueActive;

  private readonly chargement = ressourceFiltree(
    () => ({}),
    () => this.service.recuperer(),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  protected readonly recherche = signal('');
  protected readonly tri = signal<Tri>('nom');

  // Formulaire ouvert (création : sans coopérative) et suppression en attente de confirmation.
  protected readonly formulaire = signal<{ readonly id?: string; readonly cooperative?: DonneesCooperative } | undefined>(undefined);
  protected readonly confirmation = signal<{ readonly id: string; readonly nom: string } | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active). Les cartes comptent toutes les
  // coopératives ; la recherche ne filtre que le tableau.
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const langue = this.langue();
    const terme = this.recherche().trim().toLocaleLowerCase(langue);
    const comparerNoms = (a: FicheCooperative, b: FicheCooperative) => a.nom.localeCompare(b.nom, langue);
    const comparateurs: Record<Tri, (a: FicheCooperative, b: FicheCooperative) => number> = {
      nom: comparerNoms,
      commune: (a, b) => a.commune.nom.localeCompare(b.commune.nom, langue) || comparerNoms(a, b),
      producteurs: (a, b) => b.producteurs - a.producteurs || comparerNoms(a, b),
      parcelles: (a, b) => b.parcelles - a.parcelles || comparerNoms(a, b),
    };
    const lignes = donnees.cooperatives
      .filter(
        (cooperative) =>
          !terme ||
          `${cooperative.nom} ${cooperative.villagePivot.nom} ${cooperative.commune.nom}`.toLocaleLowerCase(langue).includes(terme),
      )
      .sort(comparateurs[this.tri()])
      .map((cooperative) => ({
        id: cooperative.id,
        nom: cooperative.nom,
        village: cooperative.villagePivot.nom,
        commune: cooperative.commune.nom,
        producteurs: nombre(cooperative.producteurs),
        parcelles: nombre(cooperative.parcelles),
      }));
    return {
      cooperatives: nombre(donnees.cooperatives.length),
      producteurs: nombre(donnees.cooperatives.reduce((somme, cooperative) => somme + cooperative.producteurs, 0)),
      parcelles: nombre(donnees.cooperatives.reduce((somme, cooperative) => somme + cooperative.parcelles, 0)),
      lignes,
    };
  });

  protected rechercher(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  protected choisirTri(tri: string): void {
    this.tri.set(tri as Tri);
  }

  protected ouvrirCreation(): void {
    this.formulaire.set({});
  }

  protected ouvrirModification(id: string): void {
    const cooperative = this.donnees()?.cooperatives.find((candidate) => candidate.id === id);
    if (cooperative) {
      this.formulaire.set({
        id,
        cooperative: { nom: cooperative.nom, commune: cooperative.commune.id, village: cooperative.villagePivot.id },
      });
    }
  }

  protected fermerFormulaire(): void {
    this.formulaire.set(undefined);
  }

  protected enregistrer(donnees: DonneesCooperative): void {
    const id = this.formulaire()?.id;
    this.executer(id === undefined ? this.service.creer(donnees) : this.service.modifier(id, donnees), false, () =>
      this.formulaire.set(undefined),
    );
  }

  protected demanderSuppression(id: string): void {
    const cooperative = this.donnees()?.cooperatives.find((candidate) => candidate.id === id);
    if (cooperative) {
      this.confirmation.set({ id, nom: cooperative.nom });
    }
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
    this.executer(this.service.supprimer(demande.id), true);
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  // Envoie l'action au serveur puis recharge la liste : le serveur fait foi, rien n'est modifié en local.
  private executer(requete: Observable<void>, suppression: boolean, apres?: () => void): void {
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
        this.cleErreur.set(cleErreurCooperative(erreur.status, suppression));
      },
    });
  }
}
