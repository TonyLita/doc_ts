// Nom d'un mois (1 à 12) dans la langue donnée, selon les noms de mois du navigateur (Intl).
export function nomMois(langue: string, mois: number, format: 'short' | 'long'): string {
  return new Intl.DateTimeFormat(langue, { month: format }).format(new Date(2000, mois - 1, 1));
}
