import { Injectable, signal } from '@angular/core';

// État du menu latéral, partagé entre le bouton de réduction (header) et la sidebar : menu affiché ou réduit, et groupes
// ouverts (plusieurs à la fois). Service racine : l'état survit à une déconnexion.
@Injectable({ providedIn: 'root' })
export class EtatMenuService {
  private readonly menuReduitEtat = signal(false);
  private readonly groupesOuvertsEtat = signal<ReadonlySet<string>>(new Set());

  readonly menuReduit = this.menuReduitEtat.asReadonly();
  readonly groupesOuverts = this.groupesOuvertsEtat.asReadonly();

  basculer(): void {
    this.menuReduitEtat.update((reduit) => !reduit);
  }

  basculerGroupe(id: string): void {
    this.groupesOuvertsEtat.update((ouverts) => {
      const suivants = new Set(ouverts);
      if (!suivants.delete(id)) {
        suivants.add(id);
      }
      return suivants;
    });
  }

  ouvrirGroupe(id: string): void {
    if (!this.groupesOuverts().has(id)) {
      this.groupesOuvertsEtat.update((ouverts) => new Set(ouverts).add(id));
    }
  }
}
