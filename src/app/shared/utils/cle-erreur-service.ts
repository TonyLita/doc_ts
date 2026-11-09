// Clé de traduction du motif d'un échec d'appel serveur courant (refus de profil, débit limité, service d'IA ou de
// génération indisponible). La plateforme ne montre que le motif, jamais de trace technique (manuel 4.7).
// Les clés sont à décliner dans les fichiers de traduction de chaque module qui l'utilise.
// `specifiques` ajoute les motifs propres à l'appel (ex. 422 → 'invalide') ; ils passent avant les motifs communs.
export function cleErreurService(statut: number, specifiques: Readonly<Record<number, string>> = {}): string {
  const cles: Record<number, string> = {
    403: 'interdit',
    429: 'trop_de_demandes',
    503: 'indisponible',
    504: 'delai_depasse',
  };
  return specifiques[statut] ?? cles[statut] ?? 'generique';
}
