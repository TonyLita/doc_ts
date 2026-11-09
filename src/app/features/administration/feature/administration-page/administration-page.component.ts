import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { Profil } from '../../../../core/auth/profil';
import { nomsLangues } from '../../../../core/i18n/langues';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { DialogueConfirmationComponent } from '../../../../shared/ui/dialogue-confirmation/dialogue-confirmation.component';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { languesDocument } from '../../../../shared/utils/langue-document';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { NouvelUtilisateur } from '../../data-access/administration.modeles';
import { AdministrationService } from '../../data-access/administration.service';
import { FormulaireUtilisateurComponent } from '../../ui/formulaire-utilisateur/formulaire-utilisateur.component';
import { MatricePermissionsComponent } from '../../ui/matrice-permissions/matrice-permissions.component';
import { TableauUtilisateursComponent } from '../../ui/tableau-utilisateurs/tableau-utilisateurs.component';

type ActionCompte = 'desactiver' | 'reactiver';

// Profils à droits croissants, dans l'ordre d'affichage (CDC §6).
const profils: readonly Profil[] = ['super-administrateur', 'utilisateur', 'visiteur'];

// Le serveur refuse ou accepte : la plateforme ne traduit que le motif, jamais de trace technique (manuel 4.7).
function cleErreurAdministration(statut: number): string {
  const cles: Record<number, string> = { 409: 'conflit', 422: 'invalide' };
  return cles[statut] ?? cleErreurService(statut);
}

// Page intelligente (manuel 4.3) : affiche la campagne active, le tableau des permissions (pour tous les profils) et,
// pour le Super Administrateur seul, la gestion des comptes (CDC §8.1, §8.17). Chaque action passe par le serveur, qui
// fait foi : rien n'est modifié en local avant sa réponse.
@Component({
  selector: 'app-administration-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    CarteIndicateurComponent,
    DialogueConfirmationComponent,
    FormulaireUtilisateurComponent,
    MatricePermissionsComponent,
    TableauUtilisateursComponent,
  ],
  templateUrl: './administration-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrationPageComponent {
  private readonly service = inject(AdministrationService);
  private readonly identifiantCourant = inject(AuthService).identifiantCourant;

  private readonly chargement = ressourceFiltree(
    () => ({}),
    () => this.service.recuperer(),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  // Formulaire ouvert (création : sans utilisateur) et action en attente de confirmation.
  protected readonly formulaire = signal<{ readonly utilisateur?: { readonly identifiant: string; readonly profil: Profil } } | undefined>(undefined);
  protected readonly confirmation = signal<{ readonly action: ActionCompte; readonly identifiant: string } | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);

  protected readonly profils = profils;
  // Les noms de langue s'écrivent dans leur propre langue : la liste ne change pas avec la langue active.
  protected readonly optionsLangues = languesDocument.map((valeur) => ({ valeur, libelle: nomsLangues[valeur] }));

  // Valeurs prêtes à afficher.
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    return {
      campagneActive: donnees.campagneActive ?? '–',
      utilisateurs: donnees.utilisateurs.map((utilisateur) => ({
        identifiant: utilisateur.identifiant,
        profil: utilisateur.profil,
        langue: nomsLangues[utilisateur.langue],
        actif: utilisateur.actif,
        estMoi: utilisateur.identifiant === this.identifiantCourant(),
      })),
    };
  });

  protected ouvrirCreation(): void {
    this.formulaire.set({});
  }

  protected ouvrirChangementRole(identifiant: string): void {
    const utilisateur = this.donnees()?.utilisateurs.find((candidat) => candidat.identifiant === identifiant);
    if (utilisateur) {
      this.formulaire.set({ utilisateur: { identifiant: utilisateur.identifiant, profil: utilisateur.profil } });
    }
  }

  protected fermerFormulaire(): void {
    this.formulaire.set(undefined);
  }

  protected enregistrer(donnees: NouvelUtilisateur): void {
    const modification = this.formulaire()?.utilisateur !== undefined;
    this.executer(
      modification ? this.service.changerRole(donnees.identifiant, donnees.profil) : this.service.creer(donnees),
      () => this.formulaire.set(undefined),
    );
  }

  protected demanderConfirmation(action: ActionCompte, identifiant: string): void {
    this.confirmation.set({ action, identifiant });
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
      demande.action === 'desactiver' ? this.service.desactiver(demande.identifiant) : this.service.reactiver(demande.identifiant),
    );
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  // Envoie l'action au serveur puis recharge la page : le serveur fait foi, rien n'est modifié en local.
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
        this.cleErreur.set(cleErreurAdministration(erreur.status));
      },
    });
  }
}
