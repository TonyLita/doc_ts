// DONNÉES DE TEST géographiques (CDC §8.2), partagées par les faux serveurs qui en dépendent : référentiel géographique,
// coopératives, producteurs. Même statut temporaire que comptes-mock.ts.
// Les communes et les villages jouent le rôle de l'API externe (lecture seule) ; le rattachement village → zone est
// la seule donnée modifiable. Il vit en mémoire : les enregistrements le modifient jusqu'au rechargement de la page.
export const zones = [
  { id: 'littorale', fr: 'Littorale', en: 'Coastal' },
  { id: 'intermediaire', fr: 'Intermédiaire', en: 'Intermediate' },
  { id: 'haute-montagne', fr: 'Haute montagne', en: 'High mountain' },
] as const;

// Communes cohérentes avec les coopératives des autres données de test (OP Sava, OP Analanjirofo, OP Diana).
export const communes = [
  { id: 'sambava', nom: 'Sambava', villages: ['Sambava', 'Ampahana', 'Marovato', 'Antsahamanara', 'Bemalamatra', 'Nosiarina', 'Anjialavabe', 'Ambodimanga'] },
  { id: 'antalaha', nom: 'Antalaha', villages: ['Antalaha', 'Ampanavoana', 'Antsirabe-Nord', 'Ambohitralanana', 'Marofinaritra', 'Ankavanana', 'Sarahandrano', 'Antsahavaribe'] },
  { id: 'andapa', nom: 'Andapa', villages: ['Andapa', 'Marojejy', 'Doany', 'Bemanevika', 'Antsahamena', 'Belaoka', 'Ambodiampana', 'Tanambao'] },
  { id: 'maroantsetra', nom: 'Maroantsetra', villages: ['Maroantsetra', 'Rantabe', 'Andranofotsy', 'Mahavelona', 'Ambodivoanio', 'Voloina', 'Anandrivola', 'Antsahamena-Est'] },
  { id: 'mananara-nord', nom: 'Mananara-Nord', villages: ['Mananara-Nord', 'Sandrakatsy', 'Ambodivoahangy', 'Antanambe', 'Antsiraka', 'Ampasimbe', 'Fotsialanana', 'Tanambao-Mananara'] },
  { id: 'ambanja', nom: 'Ambanja', villages: ['Ambanja', 'Ambodimanary', 'Marovato-Ambanja', 'Antranokarany', 'Ankatafa', 'Anjiabe', 'Ambalahonko', 'Beanana'] },
  { id: 'ambilobe', nom: 'Ambilobe', villages: ['Ambilobe', 'Ambakirano', 'Beramanja', 'Betsiaka', 'Ankaramy', 'Anivorano', 'Ambalamanasy', 'Mahavanona'] },
] as const;

// Villages déjà cités par l'échantillonnage de test : ils gardent la même zone partout.
const zonesImposees: Readonly<Record<string, string>> = {
  Sambava: 'littorale',
  Antalaha: 'littorale',
  Andapa: 'intermediaire',
  Marojejy: 'intermediaire',
  Doany: 'haute-montagne',
  Bemanevika: 'haute-montagne',
};

export interface VillageDeTest {
  readonly id: string;
  readonly nom: string;
  readonly commune: string; // nom de la commune
  readonly communeId: string;
  readonly zoneInitiale: string | null;
}

// Un village sur sept n'a pas encore de zone au départ ; les autres suivent les trois zones tour à tour. Sans aléatoire.
export const villages: readonly VillageDeTest[] = communes.flatMap((commune, indiceCommune) =>
  commune.villages.map((nom, indice) => {
    const rang = indiceCommune * commune.villages.length + indice;
    return {
      id: `vil-${String(rang + 1).padStart(3, '0')}`,
      nom,
      commune: commune.nom,
      communeId: commune.id,
      zoneInitiale: zonesImposees[nom] ?? (rang % 7 === 3 ? null : zones[rang % zones.length].id),
    };
  }),
);

let zonesParVillage = new Map<string, string | null>(villages.map((village) => [village.id, village.zoneInitiale]));

export const villageExiste = (identifiant: string): boolean => zonesParVillage.has(identifiant);
export const zoneExiste = (identifiant: string): boolean => zones.some((zone) => zone.id === identifiant);

// Zone d'un village telle que ce module la tient à jour (identifiant), ou null : les producteurs en héritent (CDC §8.4).
export function zoneDuVillage(identifiantVillage: string): string | null {
  return zonesParVillage.get(identifiantVillage) ?? null;
}

// Écrit le rattachement de villages à des zones (null : retire le rattachement). La validation relève de l'appelant.
export function ecrireZones(affectations: readonly { readonly village: string; readonly zone: string | null }[]): void {
  const suivantes = new Map(zonesParVillage);
  for (const affectation of affectations) {
    suivantes.set(affectation.village, affectation.zone);
  }
  zonesParVillage = suivantes;
}

// Les zones avec leur nom dans la langue demandée.
export function zonesLocalisees(langue: 'fr' | 'en') {
  return zones.map((zone) => ({ id: zone.id, nom: zone[langue] }));
}

// Communes et villages tels que le serveur les propose aux autres référentiels (ex. le village pivot d'une coopérative).
export function communesAvecVillages() {
  return communes.map((commune) => ({
    id: commune.id,
    nom: commune.nom,
    villages: villages.filter((village) => village.communeId === commune.id).map(({ id, nom }) => ({ id, nom })),
  }));
}
