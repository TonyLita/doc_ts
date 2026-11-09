import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OptionListe } from '../../../../shared/ui/champ-liste/champ-liste.component';
import { entier } from '../../../../shared/utils/validateurs';
import { DonneesParcelle } from '../../data-access/parcelles.modeles';

export interface LibellesFormulaireParcelle {
  readonly producteur: string;
  readonly cooperative: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly pieds: string;
  readonly vanille: string;
  readonly choisir: string; // première option des listes, sans valeur
  readonly enregistrer: string;
  readonly annuler: string;
  readonly champsInvalides: string;
}

// Formulaire de création ou de modification d'une parcelle. Affichage pur : les valeurs validées partent par la sortie
// `enregistrer`, la page parle au serveur. Le producteur et la coopérative se choisissent dans leurs référentiels
// (CDC §8.4, §8.3), jamais en texte libre ; la zone se déduit du village du producteur et la production est calculée par le
// serveur : ni l'une ni l'autre ne se saisit ici. Le serveur revalide tout (manuel 7.5).
@Component({
  selector: 'app-formulaire-parcelle',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-parcelle.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireParcelleComponent implements OnInit {
  readonly titre = input.required<string>();
  readonly parcelle = input<DonneesParcelle>(); // absente : création
  readonly producteurs = input.required<readonly OptionListe[]>();
  readonly cooperatives = input.required<readonly OptionListe[]>();
  readonly libelles = input.required<LibellesFormulaireParcelle>();
  readonly enCours = input(false);

  readonly enregistrer = output<DonneesParcelle>();
  readonly annuler = output<void>();

  protected readonly formulaire = new FormGroup({
    producteur: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cooperative: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    latitude: new FormControl<number | null>(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl<number | null>(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
    pieds: new FormControl<number | null>(null, [Validators.required, Validators.min(0), entier]),
    vanille: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const parcelle = this.parcelle();
    if (parcelle) {
      this.formulaire.setValue(parcelle);
    }
  }

  protected valider(): void {
    const { latitude, longitude, pieds, ...autres } = this.formulaire.getRawValue();
    if (this.formulaire.invalid || latitude === null || longitude === null || pieds === null) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.enregistrer.emit({ ...autres, latitude, longitude, pieds });
  }
}
