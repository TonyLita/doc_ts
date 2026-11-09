import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../../../core/api/app-error';
import { HeaderComponent } from '../../../../core/layout/header/header.component';
import { cleMessageErreurConnexion, ConnexionService } from '../../data-access/connexion.service';

@Component({
  selector: 'app-login-page',
  imports: [HeaderComponent, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly serviceConnexion = inject(ConnexionService);
  private readonly routeur = inject(Router);

  // Formulaire réactif typé (manuel 5.5). La validation du serveur fait foi (manuel 7.5).
  protected readonly formulaire = new FormGroup({
    identifiant: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    motDePasse: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly enCours = signal(false);
  protected readonly cleErreur = signal<string | null>(null);

  protected seConnecter(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.cleErreur.set(null);
    this.serviceConnexion.seConnecter(this.formulaire.getRawValue()).subscribe({
      next: () => void this.routeur.navigateByUrl('/tableau-de-bord'),
      // Message compréhensible, jamais de trace technique (manuel 4.7) ; le formulaire reste modifiable pour réessayer.
      error: (erreur: AppError) => {
        this.cleErreur.set(cleMessageErreurConnexion(erreur.status));
        this.enCours.set(false);
      },
    });
  }
}
