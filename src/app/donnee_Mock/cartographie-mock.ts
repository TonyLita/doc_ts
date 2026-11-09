import { Cartographie } from '../features/cartographie/data-access/cartographie.modeles';

// DONNÉES DE TEST de la cartographie (CDC §8.9) : environ 1 800 parcelles autour de la région SAVA.
// Même statut temporaire que comptes-mock.ts.
const cooperatives = [
  { id: 'coop-sava', nom: 'OP Sava', latitude: -14.27, longitude: 50.17 },
  { id: 'coop-antalaha', nom: 'OP Antalaha', latitude: -14.9, longitude: 50.28 },
  { id: 'coop-andapa', nom: 'OP Andapa', latitude: -14.65, longitude: 49.65 },
  { id: 'coop-vohemar', nom: 'OP Vohémar', latitude: -13.36, longitude: 50.0 },
] as const;
const parcellesParCooperative = 450;
const dispersionDegres = 0.18;
// Fictif, voir le coefficient de conversion du CDC §8.7 ; le référentiel des parcelles de test l'applique aussi.
export const kilosParPied = 0.12;

// Générateur pseudo-aléatoire à graine fixe : les mêmes parcelles à chaque démarrage (aussi utilisé par le faux serveur
// du référentiel des parcelles).
export function creerHasard(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

export function construireCartographieMock(): Cartographie {
  const hasard = creerHasard(42);

  return {
    cooperatives: cooperatives.map(({ id, nom }) => ({ id, nom })),
    centres: cooperatives.map(({ id, latitude, longitude }) => ({ cooperative: id, latitude, longitude })),
    parcelles: cooperatives.flatMap((cooperative, indice) =>
      Array.from({ length: parcellesParCooperative }, (_, numero) => {
        const pieds = 100 + Math.round(hasard() * 800);
        return {
          id: `${cooperative.id}-${numero + 1}`,
          producteur: `Producteur ${indice + 1}-${String(numero + 1).padStart(3, '0')}`,
          cooperative: cooperative.id,
          latitude: cooperative.latitude + (hasard() - 0.5) * 2 * dispersionDegres,
          longitude: cooperative.longitude + (hasard() - 0.5) * 2 * dispersionDegres,
          pieds,
          productionKg: Math.round(pieds * kilosParPied),
          vanille: hasard() < 0.85,
        };
      }),
    ),
  };
}
