import { computed, Injectable, signal } from '@angular/core';
import { Profil } from './profil';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Jeton gardé en mémoire uniquement, jamais dans localStorage (manuel 7.1).
  private readonly tokenState = signal<string | null>(null);
  private readonly identifiantEtat = signal<string | null>(null);
  private readonly profilEtat = signal<Profil | null>(null);

  readonly token = this.tokenState.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenState() !== null);
  // Utilisateur connecté, affiché dans le header.
  readonly identifiantCourant = this.identifiantEtat.asReadonly();
  // Profil de l'utilisateur connecté, communiqué par le serveur à la connexion.
  readonly profilCourant = this.profilEtat.asReadonly();

  setToken(token: string | null): void {
    this.tokenState.set(token);
  }

  setIdentifiantCourant(identifiant: string | null): void {
    this.identifiantEtat.set(identifiant);
  }

  setProfilCourant(profil: Profil | null): void {
    this.profilEtat.set(profil);
  }

  // Ferme la session côté client : efface le jeton (setToken) et l'utilisateur courant.
  deconnecter(): void {
    this.setToken(null);
    this.setIdentifiantCourant(null);
    this.setProfilCourant(null);
  }
}
