import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profil } from '../../../../core/auth/profil';
import { LangueDocument } from '../../../../shared/utils/langue-document';
import { NouvelUtilisateur } from '../../data-access/administration.modeles';

export interface OptionFormulaire<T extends string> {
  readonly valeur: T;
  readonly libelle: string;
}

export interface LibellesFormulaireUtilisateur {
  readonly identifiant: string;
  readonly motDePasse: string;
  readonly role: string;
  readonly langue: string;
  readonly enregistrer: string;
  readonly annuler: string;
  readonly champsInvalides: string;
}

// Longueur minimale du mot de passe initial : un confort, la politique de mot de passe du serveur fait foi (manuel 7.5).
const longueurMinMotDePasse = 8;

// Création d'un compte (identifiant, mot de passe initial, rôle, langue) ou changement du rôle d'un compte existant
// (seul le rôle se modifie). Affichage pur : la demande part par la sortie `enregistrer`, la page parle au serveur.
@Component({
  selector: 'app-formulaire-utilisateur',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-utilisateur.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireUtilisateurComponent implements OnInit {
  readonly titre = input.required<string>();
  readonly utilisateur = input<{ readonly identifiant: string; readonly profil: Profil }>(); // absent : création
  readonly profils = input.required<readonly OptionFormulaire<Profil>[]>();
  readonly langues = input.required<readonly OptionFormulaire<LangueDocument>[]>();
  readonly enCours = input(false);
  readonly libelles = input.required<LibellesFormulaireUtilisateur>();

  readonly enregistrer = output<NouvelUtilisateur>();
  readonly annuler = output<void>();

  protected readonly longueurMin = longueurMinMotDePasse;
  protected readonly formulaire = new FormGroup({
    identifiant: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    motDePasse: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(longueurMinMotDePasse)],
    }),
    profil: new FormControl<Profil>('utilisateur', { nonNullable: true }),
    langue: new FormControl<LangueDocument>('fr', { nonNullable: true }),
  });

  ngOnInit(): void {
    const utilisateur = this.utilisateur();
    if (utilisateur) {
      this.formulaire.patchValue({ identifiant: utilisateur.identifiant, profil: utilisateur.profil });
      // Seul le rôle d'un compte existant se change : les autres champs sont figés et ne sont pas validés.
      this.formulaire.controls.identifiant.disable();
      this.formulaire.controls.motDePasse.disable();
      this.formulaire.controls.langue.disable();
    }
  }

  protected valider(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.enregistrer.emit(this.formulaire.getRawValue());
  }
}
