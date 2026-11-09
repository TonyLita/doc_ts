import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OptionListe } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { entier } from '../../../../shared/utils/validateurs';
import { DonneesProgramme, ProgrammeProducteur, StatutEchantillonnage } from '../../data-access/producteurs.modeles';
import {
  LibellesStatutEchantillonnage,
  StatutEchantillonnageComponent,
} from '../statut-echantillonnage/statut-echantillonnage.component';

export interface ValeursProgramme {
  readonly cooperative: string; // déjà prêt à afficher (« – » si absente)
  readonly zone: string;
  readonly pieds: string;
  readonly ageMoyen: string;
}

export interface LibellesProgramme {
  readonly cooperative: string;
  readonly zone: string;
  readonly pieds: string;
  readonly ageMoyen: string;
  readonly statut: string;
  readonly suiviActif: string;
  readonly recense: string;
  readonly choisir: string; // première option de la liste des coopératives
  readonly lienZone: string; // lien vers le référentiel géographique, où se corrige la zone
  readonly enregistrer: string;
  readonly champsInvalides: string;
  readonly statuts: LibellesStatutEchantillonnage;
}

const ageMax = 100;

// Données du programme d'un producteur (CDC §8.4) : coopérative, pieds, âge moyen et statut d'échantillonnage. La zone
// est héritée du village : elle s'affiche mais ne se saisit pas ici (elle se corrige dans le référentiel
// géographique). Seul le profil que le serveur autorise (`modifiable`) voit le formulaire ; les autres consultent.
// Affichage pur : les valeurs validées partent par la sortie `enregistrer`, la page parle au serveur.
@Component({
  selector: 'app-bloc-programme',
  imports: [ReactiveFormsModule, RouterLink, StatutEchantillonnageComponent],
  templateUrl: './bloc-programme.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocProgrammeComponent {
  readonly titre = input.required<string>();
  readonly valeurs = input.required<ProgrammeProducteur>(); // valeurs du serveur : elles alimentent le formulaire
  readonly lecture = input.required<ValeursProgramme>(); // les mêmes, prêtes à afficher en consultation
  readonly cooperatives = input.required<readonly OptionListe[]>();
  readonly libelles = input.required<LibellesProgramme>();
  readonly modifiable = input.required<boolean>();
  readonly enCours = input(false);

  readonly enregistrer = output<DonneesProgramme>();

  protected readonly ageMax = ageMax;

  protected readonly formulaire = new FormGroup({
    cooperative: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    pieds: new FormControl<number | null>(null, [Validators.required, Validators.min(0), entier]),
    ageMoyen: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(ageMax)]),
    statut: new FormControl<StatutEchantillonnage | ''>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    // Le formulaire reflète toujours les valeurs du serveur : après un enregistrement, la page les recharge.
    effect(() => {
      const valeurs = this.valeurs();
      this.formulaire.setValue({
        cooperative: valeurs.cooperative ?? '',
        pieds: valeurs.pieds,
        ageMoyen: valeurs.ageMoyen,
        statut: valeurs.statut ?? '',
      });
    });
  }

  protected valider(): void {
    const { cooperative, pieds, ageMoyen, statut } = this.formulaire.getRawValue();
    if (this.formulaire.invalid || pieds === null || ageMoyen === null || statut === '') {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.enregistrer.emit({ cooperative, pieds, ageMoyen, statut });
  }
}
