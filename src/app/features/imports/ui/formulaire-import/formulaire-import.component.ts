import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TypeReferentiel } from '../../data-access/imports.modeles';

export interface LibellesFormulaireImport {
  readonly fichier: string; // « Fichier source » : nom accessible du champ de fichier
  readonly formats: string; // « Formats acceptés »
  readonly tailleMax: string; // « Taille maximale : 10 Mo »
  readonly formatRefuse: string;
  readonly tropGros: string;
  readonly deposer: string; // « Glissez-déposez ou cliquez pour sélectionner »
  readonly aucunFichier: string;
  readonly choisir: string; // « Choisir le fichier »
  readonly modele: string; // « Télécharger le modèle »
  readonly analyser: string;
  readonly enCours: string;
}

export interface DemandeAnalyse {
  readonly type: TypeReferentiel;
  readonly fichier: File;
}

// Formats lus par le serveur selon le type : KML pour la géolocalisation des parcelles, Excel ou CSV pour les listes.
// Jamais .xlsm (macros). Le serveur refuse de toute façon un format interdit (415).
const formatsParType: Readonly<Record<TypeReferentiel, readonly string[]>> = {
  parcelles: ['.kml', '.csv', '.xlsx'],
  cooperatives: ['.csv', '.xlsx'],
};

// Zone de dépôt d'un type de référentiel (étape 1) : fichier choisi ou glissé dans le cadre, puis analyse. La page en
// affiche une par type. Affichage pur : la demande part par la sortie `analyser`, la page parle au serveur. Les contrôles
// de taille et de format ne sont qu'un confort : le serveur fait foi.
@Component({
  selector: 'app-formulaire-import',
  templateUrl: './formulaire-import.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireImportComponent {
  readonly type = input.required<TypeReferentiel>();
  readonly titre = input.required<string>();
  readonly tailleMaxMo = input.required<number>();
  // Une analyse est en cours (dans n'importe quelle zone) : plus aucune action n'est possible ; `analyseEnCours` dit que
  // c'est celle de cette zone, dont le bouton l'annonce.
  readonly enCours = input(false);
  readonly analyseEnCours = input(false);
  readonly libelles = input.required<LibellesFormulaireImport>();

  readonly analyser = output<DemandeAnalyse>();
  readonly modele = output<TypeReferentiel>();

  protected readonly fichier = signal<File | undefined>(undefined);
  protected readonly survol = signal(false);

  protected readonly formatsAcceptes = computed(() => formatsParType[this.type()]);
  protected readonly accept = computed(() => this.formatsAcceptes().join(','));
  protected readonly formatRefuse = computed(() => {
    const nom = this.fichier()?.name.toLowerCase();
    return nom !== undefined && !this.formatsAcceptes().some((extension) => nom.endsWith(extension));
  });
  protected readonly tropGros = computed(() => (this.fichier()?.size ?? 0) > this.tailleMaxMo() * 1024 * 1024);
  protected readonly peutAnalyser = computed(
    () => this.fichier() !== undefined && !this.formatRefuse() && !this.tropGros() && !this.enCours(),
  );

  protected choisirFichier(evenement: Event): void {
    this.fichier.set((evenement.target as HTMLInputElement).files?.[0]);
  }

  // Le navigateur n'autorise le dépôt que si l'on annule le comportement par défaut du survol.
  protected survoler(evenement: DragEvent): void {
    evenement.preventDefault();
    this.survol.set(!this.enCours());
  }

  protected deposer(evenement: DragEvent): void {
    evenement.preventDefault();
    this.survol.set(false);
    const depose = evenement.dataTransfer?.files[0];
    if (depose && !this.enCours()) {
      this.fichier.set(depose);
    }
  }

  protected valider(): void {
    const fichier = this.fichier();
    if (fichier && this.peutAnalyser()) {
      this.analyser.emit({ type: this.type(), fichier });
    }
  }
}
