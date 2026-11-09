import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { nomsLangues } from '../../../../core/i18n/langues';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { langueDocument } from '../../../../shared/utils/langue-document';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { RapportGenere, TypeRapport } from '../../data-access/rapports-ia.modeles';
import { longueurMaxInstructions, RapportsIaService } from '../../data-access/rapports-ia.service';
import { FormulaireRapportComponent, ParametresRapport } from '../../ui/formulaire-rapport/formulaire-rapport.component';
import { RapportGenereComponent } from '../../ui/rapport-genere/rapport-genere.component';

const typesRapport: readonly TypeRapport[] = ['synthese', 'analyse-zone', 'prevision', 'personnalise'];

// Le motif propre au formulaire (instructions refusées) s'ajoute aux motifs communs des appels serveur.
const cleErreurGeneration = (statut: number): string => (statut === 422 ? 'instructions_invalides' : cleErreurService(statut));

// Page intelligente (manuel 4.3) : relaie la demande de rapport au serveur, seul à appeler le service d'IA, et
// affiche le brouillon obtenu (CDC §8.13). Rien n'est conservé : le rapport disparaît avec la page.
@Component({
  selector: 'app-rapports-ia-page',
  imports: [TranslocoPipe, FormulaireRapportComponent, RapportGenereComponent],
  templateUrl: './rapports-ia-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'enCours()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportsIaPageComponent {
  private readonly service = inject(RapportsIaService);
  private readonly langueActive = inject(LangueService).langueActive;

  private readonly chargement = ressourceFiltree(
    () => ({}),
    () => this.service.recuperer(),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly contexte = this.chargement.donnees;

  protected readonly enCours = signal(false);
  protected readonly cleErreur = signal<string | undefined>(undefined);
  protected readonly rapport = signal<RapportGenere | undefined>(undefined);
  private derniereDemande?: ParametresRapport;

  protected readonly longueurMax = longueurMaxInstructions;
  protected readonly types = typesRapport;

  // Toute langue sans rapport (ex. malgache) donne un rapport français.
  private readonly langueRapport = computed(() => langueDocument(this.langueActive()));
  protected readonly nomLangueRapport = computed(() => nomsLangues[this.langueRapport()]);

  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langueActive(), { dateStyle: 'short', timeZone: 'UTC' }),
  );
  // Mention « basé sur » du rapport affiché : campagne et date des données.
  protected readonly baseSur = computed(() => {
    const rapport = this.rapport();
    return rapport && { campagne: rapport.campagne, date: this.formatDate().format(new Date(rapport.donneesAu)) };
  });

  protected generer(parametres: ParametresRapport): void {
    this.derniereDemande = parametres;
    this.enCours.set(true);
    this.cleErreur.set(undefined);
    this.service
      .generer({
        type: parametres.type,
        instructions: parametres.instructions || undefined,
        langue: this.langueRapport(),
      })
      .subscribe({
        next: (rapport) => {
          this.rapport.set(rapport);
          this.enCours.set(false);
        },
        error: (erreur: AppError) => {
          this.cleErreur.set(cleErreurGeneration(erreur.status));
          this.enCours.set(false);
        },
      });
  }

  protected reessayer(): void {
    if (this.derniereDemande) {
      this.generer(this.derniereDemande);
    }
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
