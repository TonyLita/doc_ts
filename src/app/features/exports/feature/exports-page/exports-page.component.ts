import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { concatMap, from, Observable } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { LangueService } from '../../../../core/i18n/langue.service';
import { pageAutorisee } from '../../../../core/layout/sidebar/elements-menu';
import { nomsLangues } from '../../../../core/i18n/langues';
import { BoutonCopierComponent } from '../../../../shared/ui/bouton-copier/bouton-copier.component';
import { ChampListeComponent } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { FiltresCampagneCooperativeComponent } from '../../../../shared/ui/filtres-campagne-cooperative/filtres-campagne-cooperative.component';
import { FichierExporte } from '../../../../shared/models/fichier-exporte';
import { GraphiqueFloraisonComponent } from '../../../../shared/ui/graphique-floraison/graphique-floraison.component';
import { GraphiqueZonesComponent } from '../../../../shared/ui/graphique-zones/graphique-zones.component';
import { OngletsImportExportComponent } from '../../../../shared/ui/onglets-import-export/onglets-import-export.component';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { formatsLocalises } from '../../../../shared/utils/formats-localises';
import { langueDocument } from '../../../../shared/utils/langue-document';
import { nomMois } from '../../../../shared/utils/nom-mois';
import { versOptions } from '../../../../shared/utils/options-liste';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { telechargerFichier } from '../../../../shared/utils/telecharger-fichier';
import { FiltresExports, FormatTableur, GraphiqueExportable } from '../../data-access/exports.modeles';
import { ExportsService } from '../../data-access/exports.service';
import { CarteExportComponent } from '../../ui/carte-export/carte-export.component';

const formatsTableur: readonly FormatTableur[] = ['xlsx', 'csv'];
// Les trois graphiques de la page, dans l'ordre de leurs aperçus.
const graphiquesExportables: readonly GraphiqueExportable[] = ['floraison-mensuelle', 'repartition-zones', 'comparaison-saisons'];
const somme = (valeurs: readonly number[]) => valeurs.reduce((total, valeur) => total + valeur, 0);

// Un export en cours à la fois : on retient lequel (pour l'état de sa carte) et l'éventuel motif d'échec. « graphiques » est
// le téléchargement des trois images d'un coup.
type CleExport = 'producteurs' | 'rapport-pdf' | 'graphiques' | GraphiqueExportable;

// Page intelligente (manuel 4.3) : relaie les demandes d'export au serveur, seul à produire les fichiers, et les
// fait télécharger (CDC §8.14). Chaque export reflète la langue active et le périmètre choisi (campagne, zone,
// coopérative). Le résumé texte n'est pas un fichier : il se copie.
@Component({
  selector: 'app-exports-page',
  imports: [
    TranslocoPipe,
    RouterLink,
    OngletsImportExportComponent,
    FiltresCampagneCooperativeComponent,
    ChampListeComponent,
    BoutonCopierComponent,
    CarteExportComponent,
    GraphiqueFloraisonComponent,
    GraphiqueZonesComponent,
  ],
  templateUrl: './exports-page.component.html',
  host: { class: 'page-contenu' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportsPageComponent {
  private readonly service = inject(ExportsService);
  private readonly langueActive = inject(LangueService).langueActive;
  private readonly profil = inject(AuthService).profilCourant;

  private readonly chargement = ressourceFiltree(
    () => ({}),
    () => this.service.recuperer(),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly contexte = this.chargement.donnees;

  protected readonly campagne = signal<string | undefined>(undefined);
  protected readonly cooperative = signal<string | undefined>(undefined);
  protected readonly zone = signal<string | undefined>(undefined);
  protected readonly format = signal<FormatTableur>('xlsx');

  // Langue des exports : celle de l'interface (français ou anglais), elle ne se choisit pas ici (CDC §8.18).
  private readonly langue = computed(() => langueDocument(this.langueActive()));
  protected readonly nomLangue = computed(() => nomsLangues[this.langue()]);

  private readonly filtres = computed<FiltresExports>(() => ({
    campagne: this.campagne(),
    cooperative: this.cooperative(),
    zone: this.zone(),
    langue: this.langue(),
  }));

  // Le résumé suit le périmètre et la langue ; un visiteur n'y a pas droit, on ne le demande pas. Il part en même temps que
  // le contexte (le droit se lit dans le profil) : l'attendre ajoutait un second délai à l'affichage de la page.
  private readonly filtresDemandes = computed(() => (pageAutorisee('/exports', this.profil()) ? this.filtres() : undefined));
  private readonly chargementResume = ressourceFiltree(this.filtresDemandes, (filtres) => this.service.resume(filtres));
  protected readonly resume = this.chargementResume.donnees;
  protected readonly erreurResume = computed(() => this.chargementResume.ressource.error() !== undefined);

  // Aperçus des graphiques : mêmes données que les images à télécharger, chargées en parallèle comme le résumé, puis mises
  // en forme pour les graphiques partagés de l'application (mois nommés dans la langue, répartition par zone, total).
  private readonly nombres = formatsLocalises();
  private readonly chargementApercus = ressourceFiltree(this.filtresDemandes, (filtres) => this.service.apercus(filtres));
  protected readonly erreurApercus = computed(() => this.chargementApercus.ressource.error() !== undefined);
  protected readonly apercus = computed(() => {
    const donnees = this.chargementApercus.donnees();
    if (!donnees) {
      return undefined;
    }
    const mois = (numero: number) => nomMois(this.langue(), numero, 'short');
    const repartition = donnees.zones.map((nom, z) => ({ nom, valeur: somme(donnees.mensuel.map((ligne) => ligne.fleursParZone[z])) }));
    return {
      zones: donnees.zones,
      mensuel: donnees.mensuel.map((ligne) => ({ libelle: mois(ligne.mois), valeurs: ligne.fleursParZone })),
      repartition,
      total: this.nombres.nombre(somme(repartition.map((zone) => zone.valeur))),
      saisons: donnees.saisons.campagnes,
      moisSaisons: donnees.saisons.mois.map((ligne) => ({ libelle: mois(ligne.mois), valeurs: ligne.fleurs })),
    };
  });

  // Campagne affichée dans l'en-tête et dans les noms de fichiers : le choix de l'utilisateur, sinon la campagne active.
  protected readonly campagneAffichee = computed(() => this.campagne() ?? this.contexte()?.campagne ?? '');
  // Nom annoncé sur les boutons ; le fichier téléchargé garde le nom que lui donne le serveur.
  protected readonly nomFichierProducteurs = computed(() => `producteurs_${this.campagneAffichee()}.${this.format()}`);
  protected readonly nomFichierRapport = computed(() => `rapport_vanille_${this.campagneAffichee()}.pdf`);
  protected readonly rapportIaAutorise = computed(() => pageAutorisee('/rapports-ia', this.profil()));

  protected readonly enCours = signal<CleExport | undefined>(undefined);
  protected readonly echec = signal<{ readonly export: CleExport; readonly cle: string } | undefined>(undefined);

  protected readonly formats = formatsTableur;
  protected readonly graphiques = graphiquesExportables;
  protected readonly optionsZones = computed(() => versOptions(this.contexte()?.zones ?? []));

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

  protected choisirFormat(format: string): void {
    this.format.set(formatsTableur.find((candidat) => candidat === format) ?? 'xlsx');
  }

  protected exporterProducteurs(): void {
    this.exporter('producteurs', this.service.producteurs(this.filtres(), this.format()));
  }

  protected exporterRapportPdf(): void {
    this.exporter('rapport-pdf', this.service.rapportPdf(this.filtres()));
  }

  protected exporterGraphique(graphique: GraphiqueExportable): void {
    this.exporter(graphique, this.service.graphique(graphique, this.filtres()));
  }

  // Les trois images l'une après l'autre : le navigateur peut demander d'autoriser les téléchargements multiples.
  protected exporterGraphiques(): void {
    this.exporter(
      'graphiques',
      from(graphiquesExportables).pipe(concatMap((graphique) => this.service.graphique(graphique, this.filtres()))),
    );
  }

  // Motif d'échec de l'export donné, pour l'afficher sur sa carte uniquement.
  protected cleEchecDe(exports: readonly CleExport[]): string | undefined {
    const echec = this.echec();
    return echec && exports.includes(echec.export) ? echec.cle : undefined;
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  private exporter(cle: CleExport, requete: Observable<FichierExporte>): void {
    this.enCours.set(cle);
    this.echec.set(undefined);
    requete.subscribe({
      next: (fichier) => telechargerFichier(fichier.contenu, fichier.nom),
      complete: () => this.enCours.set(undefined),
      error: (erreur: AppError) => {
        this.echec.set({ export: cle, cle: cleErreurService(erreur.status) });
        this.enCours.set(undefined);
      },
    });
  }
}
