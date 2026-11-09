import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AppError } from '../../../../core/api/app-error';
import { LangueService } from '../../../../core/i18n/langue.service';
import { FichierExporte } from '../../../../shared/models/fichier-exporte';
import { CarteIndicateurComponent } from '../../../../shared/ui/carte-indicateur/carte-indicateur.component';
import { OngletsImportExportComponent } from '../../../../shared/ui/onglets-import-export/onglets-import-export.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { cleErreurService } from '../../../../shared/utils/cle-erreur-service';
import { langueDocument } from '../../../../shared/utils/langue-document';
import { ressourceFiltree } from '../../../../shared/utils/ressource-filtree';
import { telechargerFichier } from '../../../../shared/utils/telecharger-fichier';
import { ApercuImport, ResultatImport, TypeReferentiel } from '../../data-access/imports.modeles';
import { ImportsService } from '../../data-access/imports.service';
import { AideImportComponent } from '../../ui/aide-import/aide-import.component';
import { DemandeAnalyse, FormulaireImportComponent } from '../../ui/formulaire-import/formulaire-import.component';
import { HistoriqueImportsComponent } from '../../ui/historique-imports/historique-imports.component';
import { ColonneApercu, TableauApercuComponent } from '../../ui/tableau-apercu/tableau-apercu.component';

type Etape = 'choisir' | 'apercu' | 'resultat';

const lignesParPage = 15;
// Même limite que celle du serveur, qui fait foi.
const tailleMaxMo = 10;
const typesReferentiel: readonly TypeReferentiel[] = ['parcelles', 'cooperatives'];

// Colonnes lues dans le fichier selon le type : parcelles (CDC §8.5) et coopératives (CDC §8.3).
const colonnesParType: Readonly<Record<TypeReferentiel, readonly ColonneApercu[]>> = {
  parcelles: [
    { cle: 'producteur' },
    { cle: 'cooperative' },
    { cle: 'latitude', nombre: true },
    { cle: 'longitude', nombre: true },
    { cle: 'pieds', nombre: true },
  ],
  cooperatives: [{ cle: 'nom' }, { cle: 'village' }, { cle: 'commune' }],
};

// Les motifs propres à l'analyse d'un fichier s'ajoutent aux motifs communs des appels serveur.
function cleErreurImport(statut: number): string {
  const cles: Record<number, string> = { 413: 'trop_gros', 415: 'format_refuse', 422: 'fichier_illisible' };
  return cles[statut] ?? cleErreurService(statut);
}

// Page intelligente (manuel 4.3) : conduit l'import en trois étapes (choisir, aperçu, résultat) en relayant chaque
// étape au serveur, seul à lire le fichier et à écrire les référentiels (CDC §8.16). Rien n'est écrit avant la
// confirmation explicite ; « Annuler » abandonne sans effet.
@Component({
  selector: 'app-imports-page',
  imports: [
    TranslocoPipe,
    CarteIndicateurComponent,
    OngletsImportExportComponent,
    FormulaireImportComponent,
    AideImportComponent,
    TableauApercuComponent,
    HistoriqueImportsComponent,
    PaginationComponent,
  ],
  templateUrl: './imports-page.component.html',
  host: { class: 'page-contenu' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportsPageComponent {
  private readonly service = inject(ImportsService);
  private readonly langueActive = inject(LangueService).langueActive;

  private readonly chargement = ressourceFiltree(
    () => ({}),
    () => this.service.recuperer(),
  );
  protected readonly ressource = this.chargement.ressource;
  protected readonly contexte = this.chargement.donnees;

  protected readonly etape = signal<Etape>('choisir');
  protected readonly apercu = signal<ApercuImport | undefined>(undefined);
  protected readonly resultat = signal<ResultatImport | undefined>(undefined);
  protected readonly page = signal(1);
  protected readonly enCours = signal(false);
  // Zone dont le fichier est en cours d'analyse : elle seule annonce « Analyse… », les autres sont seulement bloquées.
  protected readonly typeAnalyse = signal<TypeReferentiel | undefined>(undefined);
  protected readonly cleErreur = signal<string | undefined>(undefined);

  // Lignes de la page d'aperçu demandée ; la ressource repart de zéro à chaque import (pas de lignes périmées).
  protected readonly lignes = rxResource({
    params: () => {
      const apercu = this.apercu();
      return apercu ? { idImport: apercu.idImport, page: this.page() } : undefined;
    },
    stream: ({ params }) => this.service.apercu(params.idImport, params.page, lignesParPage),
  });

  protected readonly types = typesReferentiel;
  protected readonly tailleMaxMo = tailleMaxMo;

  private readonly langue = computed(() => langueDocument(this.langueActive()));
  private readonly formatNombre = computed(() => new Intl.NumberFormat(this.langueActive()));
  private readonly formatDate = computed(
    () => new Intl.DateTimeFormat(this.langueActive(), { dateStyle: 'short', timeStyle: 'short' }),
  );

  // Toutes les valeurs prêtes à afficher (formatées dans la langue active).
  protected readonly vue = computed(() => {
    const nombre = (valeur: number) => this.formatNombre().format(valeur);
    const apercu = this.apercu();
    const resultat = this.resultat();
    const page = this.lignes.hasValue() ? this.lignes.value() : undefined;
    return {
      apercu: apercu && {
        fichier: apercu.fichier,
        type: apercu.type,
        lignesLues: nombre(apercu.lignesLues),
        valides: nombre(apercu.compteurs.valides),
        aVerifier: nombre(apercu.compteurs.aVerifier),
        rejetees: nombre(apercu.compteurs.rejetees),
        colonnes: colonnesParType[apercu.type],
      },
      lignes: (page?.lignes ?? []).map((ligne) => ({
        numero: ligne.numero,
        valeurs: Object.fromEntries(
          Object.entries(ligne.valeurs).map(([cle, valeur]) => [
            cle,
            typeof valeur === 'number' ? nombre(valeur) : (valeur ?? '–'),
          ]),
        ),
        controle: ligne.controle,
        motif: ligne.motif,
      })),
      nombrePages: Math.max(1, Math.ceil((page?.total ?? 0) / lignesParPage)),
      total: nombre(page?.total ?? 0),
      resultat: resultat && {
        creees: nombre(resultat.creees),
        miseAJour: nombre(resultat.miseAJour),
        rejetees: nombre(resultat.rejetees),
        aDesRejets: resultat.rejetees > 0,
      },
      historique: (this.contexte()?.historique ?? []).map((entree) => ({
        id: entree.id,
        date: this.formatDate().format(new Date(entree.date)),
        utilisateur: entree.utilisateur,
        fichier: entree.fichier,
        type: entree.type,
        creees: nombre(entree.creees),
        miseAJour: nombre(entree.miseAJour),
        rejetees: nombre(entree.rejetees),
      })),
    };
  });

  protected analyser(demande: DemandeAnalyse): void {
    this.typeAnalyse.set(demande.type);
    this.enCours.set(true);
    this.cleErreur.set(undefined);
    this.service.analyser(demande.type, demande.fichier).subscribe({
      next: (apercu) => {
        this.apercu.set(apercu);
        this.page.set(1);
        this.etape.set('apercu');
        this.enCours.set(false);
      },
      error: (erreur: AppError) => this.echec(erreur),
    });
  }

  protected confirmer(): void {
    const apercu = this.apercu();
    if (!apercu) {
      return;
    }
    this.enCours.set(true);
    this.cleErreur.set(undefined);
    this.service.confirmer(apercu.idImport).subscribe({
      next: (resultat) => {
        this.resultat.set(resultat);
        this.etape.set('resultat');
        this.enCours.set(false);
        this.ressource.reload(); // le journal compte un import de plus
      },
      error: (erreur: AppError) => this.echec(erreur),
    });
  }

  // Abandonne l'import en cours : le serveur n'a rien écrit, on revient au choix du fichier.
  protected annuler(): void {
    const apercu = this.apercu();
    if (apercu) {
      this.service.annuler(apercu.idImport).subscribe({ error: () => undefined });
    }
    this.nouvelImport();
  }

  protected nouvelImport(): void {
    this.apercu.set(undefined);
    this.resultat.set(undefined);
    this.cleErreur.set(undefined);
    this.page.set(1);
    this.etape.set('choisir');
  }

  protected choisirPage(page: number): void {
    this.page.set(page);
  }

  protected telechargerModele(type: TypeReferentiel): void {
    this.telecharger(this.service.modele(type, this.langue()));
  }

  protected telechargerRapport(): void {
    const apercu = this.apercu();
    if (apercu) {
      this.telecharger(this.service.rapportErreurs(apercu.idImport, this.langue()));
    }
  }

  protected recharger(): void {
    this.ressource.reload();
  }

  private telecharger(requete: Observable<FichierExporte>): void {
    this.cleErreur.set(undefined);
    requete.subscribe({
      next: (fichier) => telechargerFichier(fichier.contenu, fichier.nom),
      error: (erreur: AppError) => this.cleErreur.set(cleErreurImport(erreur.status)),
    });
  }

  private echec(erreur: AppError): void {
    this.cleErreur.set(cleErreurImport(erreur.status));
    this.enCours.set(false);
  }
}
