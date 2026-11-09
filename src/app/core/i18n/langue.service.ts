import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { ecrireStockageLocal, lireStockageLocal } from '../stockage/stockage-local';
import { estLangue, Langue, langueParDefaut } from './langues';

const cleStockage = 'langue';

@Injectable({ providedIn: 'root' })
export class LangueService {
  private readonly document = inject(DOCUMENT);
  private readonly traduction = inject(TranslocoService);
  private readonly langueActiveEtat = signal<Langue>(langueParDefaut);

  readonly langueActive = this.langueActiveEtat.asReadonly();

  // Au démarrage : charge la langue détectée et le français de repli avant le premier affichage,
  // pour ne jamais montrer de clés brutes. Seul le choix explicite de l'utilisateur est enregistré.
  async initialiser(): Promise<void> {
    const langue = this.detecterLangue();
    this.appliquerLangue(langue);
    try {
      await Promise.all([
        firstValueFrom(this.traduction.load(langue)),
        firstValueFrom(this.traduction.load(langueParDefaut)),
      ]);
    } catch {
      // Fichiers indisponibles : l'application démarre quand même.
    }
  }

  changerLangue(langue: Langue): void {
    if (!estLangue(langue)) {
      return;
    }
    this.appliquerLangue(langue);
    ecrireStockageLocal(cleStockage, langue);
  }

  // Ordre : choix enregistré, puis langue du navigateur, puis français.
  private detecterLangue(): Langue {
    const langueEnregistree = lireStockageLocal(cleStockage);
    if (estLangue(langueEnregistree)) {
      return langueEnregistree;
    }

    const languesNavigateur = this.document.defaultView?.navigator?.languages ?? [];
    for (const etiquette of languesNavigateur) {
      const code = etiquette.split('-')[0].toLowerCase();
      if (estLangue(code)) {
        return code;
      }
    }

    return langueParDefaut;
  }

  private appliquerLangue(langue: Langue): void {
    this.langueActiveEtat.set(langue);
    this.traduction.setActiveLang(langue);
    this.document.documentElement.lang = langue;
  }
}
