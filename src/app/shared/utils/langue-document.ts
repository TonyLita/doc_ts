import { Langue } from '../../core/i18n/langues';

export const languesDocument = ['fr', 'en'] as const;

export type LangueDocument = (typeof languesDocument)[number];

export function langueDocument(langue: Langue): LangueDocument {
  return languesDocument.find((candidate) => candidate === langue) ?? 'fr';
}
