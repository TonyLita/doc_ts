import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ecrireStockageLocal, lireStockageLocal } from '../stockage/stockage-local';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeState = signal<Theme>(this.readStoredTheme());

  readonly theme = this.themeState.asReadonly();
  readonly isLight = computed(() => this.themeState() === 'light');

  constructor() {
    this.apply(this.themeState());
  }

  toggle(): void {
    this.set(this.isLight() ? 'dark' : 'light');
  }

  set(theme: Theme): void {
    this.themeState.set(theme);
    this.apply(theme);
    this.store(theme);
  }

  private apply(theme: Theme): void {
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private readStoredTheme(): Theme {
    return lireStockageLocal(STORAGE_KEY) === 'light' ? 'light' : DEFAULT_THEME;
  }

  private store(theme: Theme): void {
    ecrireStockageLocal(STORAGE_KEY, theme);
  }
}
