import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { ModaleComponent } from '../../../../shared/ui/modale/modale.component';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { SaisieFloraison } from '../../data-access/floraison.modeles';
import { FloraisonService } from '../../data-access/floraison.service';
import { FormulaireFloraisonComponent } from '../../ui/formulaire-floraison/formulaire-floraison.component';
import { HistoriqueFloraisonComponent } from '../../ui/historique-floraison/historique-floraison.component';

export interface ProducteurEnCours {
  readonly id: string;
  readonly nom: string;
}

// Le serveur refuse ou accepte : la plateforme ne traduit que le motif, jamais de trace technique (manuel 4.7).
function cleErreurSaisie(statut: number): string {
  const cles: Record<number, string> = { 404: 'introuvable', 422: 'invalide' };
  return cles[statut] ?? cleErreurService(statut);
}

// Modale de saisie des données de floraison, utilisée par la liste (producteur au choix) et par la fiche (producteur
// en cours, verrouillé). Composant intelligent (manuel 4.3) : charge les producteurs et, pour celui qui est choisi,
// ses parcelles et son historique, enregistre la saisie au serveur (qui fait foi) puis prévient la page pour qu'elle
// recharge ses chiffres. La modale reste ouverte après un enregistrement : l'historique montre la saisie ajoutée.
@Component({
  selector: 'app-saisie-floraison',
  imports: [TranslocoPipe, ModaleComponent, FormulaireFloraisonComponent, HistoriqueFloraisonComponent],
  templateUrl: './saisie-floraison.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaisieFloraisonComponent {
  private readonly service = inject(FloraisonService);
  private readonly langue = inject(LangueService).langueActive;

  readonly producteur = input<ProducteurEnCours>(); // absent : le producteur se choisit dans la liste

  readonly fermer = output<void>();
  readonly enregistre = output<void>();

  private readonly choixLibre = signal<string | undefined>(undefined);
  protected readonly idChoisi = computed(() => this.producteur()?.id ?? this.choixLibre() ?? '');

  // La liste des producteurs n'est chargée que si aucun producteur n'est imposé.
  private readonly chargementProducteurs = ressourceFiltree(
    () => (this.producteur() ? undefined : {}),
    () => this.service.producteurs(),
  );
  protected readonly erreurProducteurs = this.chargementProducteurs.ressource.error;

  protected readonly optionsProducteurs = computed(() => {
    const impose = this.producteur();
    if (impose) {
      return [{ valeur: impose.id, libelle: impose.nom }];
    }
    return (this.chargementProducteurs.donnees() ?? []).map((choix) => ({
      valeur: choix.id,
      libelle: `${choix.nom} — ${choix.village}`,
    }));
  });

  // Parcelles et historique du producteur choisi. L'identifiant accompagne les données : celles d'un producteur
  // précédent ne s'affichent jamais pendant le chargement du suivant.
  private readonly chargementFloraison = ressourceFiltree(
    () => {
      const id = this.idChoisi();
      return id ? { id } : undefined;
    },
    (filtres) => this.service.producteur(filtres.id).pipe(map((donnees) => ({ id: filtres.id, ...donnees }))),
  );
  protected readonly erreurFloraison = this.chargementFloraison.ressource.error;

  private readonly donneesDuProducteur = computed(() => {
    const donnees = this.chargementFloraison.donnees();
    return donnees?.id === this.idChoisi() ? donnees : undefined;
  });

  protected readonly optionsParcelles = computed(() =>
    (this.donneesDuProducteur()?.parcelles ?? []).map((parcelle) => ({ valeur: parcelle.id, libelle: parcelle.code })),
  );

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  // Les dates sont des jours calendaires (sans heure) : on les lit en UTC pour qu'aucun fuseau ne les décale.
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langue(), { dateStyle: 'short', timeZone: 'UTC' }),
  );

  protected readonly historique = computed(() =>
    (this.donneesDuProducteur()?.saisies ?? []).map((saisie) => ({
      id: saisie.id,
      date: this.formatDate().format(new Date(saisie.date)),
      fleurs: this.formatNombre().format(saisie.fleurs),
    })),
  );

  protected readonly enCours = signal(false);
  protected readonly succes = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);
  protected readonly versionSaisie = signal(0);

  protected choisirProducteur(id: string): void {
    this.choixLibre.set(id || undefined);
    this.succes.set(false);
    this.cleErreur.set(undefined);
  }

  protected enregistrer(saisie: SaisieFloraison): void {
    const id = this.idChoisi();
    if (!id) {
      return;
    }
    this.enCours.set(true);
    this.succes.set(false);
    this.cleErreur.set(undefined);
    this.service.enregistrer(id, saisie).subscribe({
      next: () => {
        this.enCours.set(false);
        this.succes.set(true);
        this.versionSaisie.update((version) => version + 1);
        this.chargementFloraison.ressource.reload();
        this.enregistre.emit();
      },
      error: (erreur: AppError) => {
        this.enCours.set(false);
        this.cleErreur.set(cleErreurSaisie(erreur.status));
      },
    });
  }
}
