import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LangueService } from '../../../../core/i18n/langue.service';
import { StatutValidation } from '../../../../shared/models/statut-validation';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { versOptions } from '../../../../shared/utils/options-liste';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { ObservationsService } from '../../data-access/observations.service';
import { BlocFamilleComponent } from '../../ui/bloc-famille/bloc-famille.component';

// Page intelligente (manuel 4.3) : charge les observations selon les filtres et met les valeurs en forme dans la
// langue active. Consultation seule : la saisie se fait sur le mobile (CDC §8.10).
@Component({
  selector: 'app-observations-page',
  imports: [TranslocoPipe, FiltresCampagneCooperativeComponent, ChampListeComponent, BlocFamilleComponent],
  templateUrl: './observations-page.component.html',
  host: {
    class: 'page-contenu',
    '[class.page-contenu--chargement]': 'ressource.isLoading()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObservationsPageComponent {
  private readonly service = inject(ObservationsService);
  private readonly langue = inject(LangueService).langueActive;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);
  protected readonly zone = signal<string | undefined>(undefined);
  // Par défaut, seules les observations validées alimentent les chiffres (CDC §8.11).
  protected readonly statut = signal<StatutValidation | undefined>('valide');

  private readonly chargement = ressourceFiltree(
    () => ({
      campagne: this.campagne(),
      cooperative: this.cooperative(),
      zone: this.zone(),
      statut: this.statut(),
    }),
    (filtres) => this.service.recuperer(filtres),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly donnees = this.chargement.donnees;

  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langue()));

  protected readonly optionsZones = computed(() => versOptions(this.donnees()?.zones ?? []));

  // Une entrée par famille, prête à afficher (nombres formatés dans la langue active).
  protected readonly familles = computed(() => {
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    return (this.donnees()?.familles ?? []).map((famille) => ({
      famille: famille.famille,
      total: famille.total,
      totalFormate: nombre(famille.total),
      representatif: famille.representatif,
      lignes: famille.valeurs.map((valeur) => ({
        code: valeur.valeur,
        valeur: valeur.effectif,
        effectif: nombre(valeur.effectif),
        pourcentage: nombre(valeur.pourcentage),
      })),
    }));
  });

  protected choisirCampagne(campagne: string): void {
    this.campagne.set(campagne);
  }

  // Une valeur vide signifie « toutes » : aucun filtre n'est envoyé.
  protected choisirCooperative(cooperative: string | undefined): void {
    this.cooperative.set(cooperative);
  }

  protected choisirZone(zone: string): void {
    this.zone.set(zone || undefined);
  }

  protected choisirStatut(statut: string): void {
    this.statut.set((statut as StatutValidation) || undefined);
  }

  protected recharger(): void {
    this.ressource.reload();
  }
}
