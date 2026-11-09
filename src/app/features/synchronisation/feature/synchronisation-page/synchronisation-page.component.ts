import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { StatutSynchronisation } from '../../data-access/synchronisation.modeles';
import { SynchronisationService } from '../../data-access/synchronisation.service';
import { JournalSynchronisationComponent } from '../../ui/journal-synchronisation/journal-synchronisation.component';

const entreesParPage = 15;

// Page intelligente (manuel 4.3) : consulte le journal de synchronisation page par page selon les filtres et met
// les valeurs en forme dans la langue active. Consultation seule : la synchronisation est automatique, la
// plateforme web n'en déclenche aucune (CDC §8.15).
@Component({
  selector: 'app-synchronisation-page',
  imports: [
    TranslocoPipe,
    FiltresCampagneCooperativeComponent,
    ChampListeComponent,
    CarteIndicateurComponent,
    JournalSynchronisationComponent,
    PaginationComponent,
  ],
  templateUrl: './synchronisation-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynchronisationPageComponent {
  private readonly service = inject(SynchronisationService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);
  protected readonly statut = signal<StatutSynchronisation | undefined>(undefined);
  protected readonly page = signal(1);

  private readonly chargement = ressourceFiltree(
    () => ({
      campagne: this.campagne(),
      cooperative: this.cooperative(),
      statut: this.statut(),
      page: this.page(),
      taille: entreesParPage,
    }),
    (filtres) => this.service.recuperer(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langue(), { dateStyle: 'short', timeStyle: 'medium' }),
  );

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const donnees = this.donnees();
    if (!donnees) {
      return undefined;
    }
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const date = (iso: string) => this.formatDate().format(new Date(iso));
    const { resume, journal } = donnees;
    return {
      derniere: resume.derniere ? date(resume.derniere) : '–',
      total: nombre(resume.total),
      enregistrements: nombre(resume.enregistrements),
      aSurveiller: nombre(resume.enErreur + resume.partielles),
      enErreur: nombre(resume.enErreur),
      partielles: nombre(resume.partielles),
      lignes: journal.lignes.map((entree) => ({
        id: entree.id,
        horodatage: date(entree.horodatage),
        origine: entree.origine,
        typeOrigine: entree.typeOrigine,
        cooperative: entree.cooperative,
        enregistrements: nombre(entree.enregistrements),
        statut: entree.statut,
      })),
      totalEntrees: nombre(journal.total),
      nombrePages: Math.max(1, Math.ceil(journal.total / entreesParPage)),
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

  protected choisirStatut(statut: string): void {
    this.statut.set((statut as StatutSynchronisation) || undefined);
    this.page.set(1);
  }

  protected choisirPage(page: number): void {
    this.page.set(page);
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
