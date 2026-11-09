// Date du jour de l'utilisateur (son fuseau, pas l'UTC), au format ISO aaaa-mm-jj attendu par un champ de date.
export function dateDuJour(): string {
  const maintenant = new Date();
  const deuxChiffres = (valeur: number) => String(valeur).padStart(2, '0');
  return `${maintenant.getFullYear()}-${deuxChiffres(maintenant.getMonth() + 1)}-${deuxChiffres(maintenant.getDate())}`;
}
