// Langues de l'application (codes ISO). Le français est la langue par défaut et de repli (manuel 5.10).
export const languesDisponibles = ['fr', 'en', 'mg'] as const;

export type Langue = (typeof languesDisponibles)[number];

export const langueParDefaut: Langue = 'fr';

// Nom de chaque langue écrit dans sa propre langue : identique quelle que soit la langue active.
export const nomsLangues: Record<Langue, string> = {
  fr: 'Français',
  en: 'English',
  mg: 'Malagasy',
};

export function estLangue(valeur: unknown): valeur is Langue {
  return languesDisponibles.some((langue) => langue === valeur);
}
