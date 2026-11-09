import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../auth/auth.service';

// Menu de l'utilisateur connecté (header) : son icône ouvre une liste déroulante pour se déconnecter.
// La disposition et les styles sont dans core/layout/layout.css (.menu-utilisateur).
@Component({
  selector: 'app-menu-utilisateur',
  imports: [TranslocoPipe],
  templateUrl: './menu-utilisateur.component.html',
  host: {
    '(document:click)': 'fermerSiExterieur($event)',
    '(document:keydown.escape)': 'fermer()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuUtilisateurComponent {
  private readonly serviceAuth = inject(AuthService);
  private readonly routeur = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly identifiant = this.serviceAuth.identifiantCourant;
  protected readonly ouvert = signal(false);

  protected basculer(): void {
    this.ouvert.update((ouvert) => !ouvert);
  }

  protected fermer(): void {
    this.ouvert.set(false);
  }

  protected fermerSiExterieur(evenement: Event): void {
    if (!this.element.nativeElement.contains(evenement.target as Node)) {
      this.fermer();
    }
  }

  // Efface la session (AuthService) puis revient à la page de connexion.
  protected seDeconnecter(): void {
    this.fermer();
    this.serviceAuth.deconnecter();
    void this.routeur.navigateByUrl('/connexion');
  }
}
