import { HttpParams } from '@angular/common/http';
import {
  CouvertureCooperative,
  Echantillonnage,
  ProducteurEchantillonne,
} from '../features/echantillonnage/data-access/echantillonnage.modeles';

// DONNÉES DE TEST de l'échantillonnage (CDC §8.6). Même statut temporaire que comptes-mock.ts.
// Effectifs cohérents avec le mock du tableau de bord : 412 producteurs suivis, 78 % de couverture.
const campagnes = ['2026', '2025'] as const;
const campagneEnCours = campagnes[0];

const cooperatives = [
  { id: 'coop-sava', nom: 'OP Sava', echantillon: 185, population: 226 },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo', echantillon: 144, population: 195 },
  { id: 'coop-diana', nom: 'OP Diana', echantillon: 83, population: 107 },
] as const;

const zones = [
  { id: 'littorale', nom: 'Littorale', villages: ['Sambava', 'Antalaha'] },
  { id: 'intermediaire', nom: 'Intermédiaire', villages: ['Andapa', 'Marojejy'] },
  { id: 'haute-montagne', nom: 'Haute montagne', villages: ['Doany', 'Bemanevika'] },
] as const;

const lettresReferents = ['A', 'B', 'C', 'D'] as const;
const campagnePrecedente = 0.9; // effectifs de la campagne précédente, par rapport à la campagne en cours

const taux = (echantillon: number, population: number) => Math.round((echantillon / population) * 100);

// Tous les producteurs échantillonnés d'une coopérative, sans aléatoire : les mêmes à chaque démarrage.
function producteursDe(indiceCooperative: number, effectif: number): ProducteurEchantillonne[] {
  const cooperative = cooperatives[indiceCooperative];
  return Array.from({ length: effectif }, (_, i) => {
    const zone = zones[i % zones.length];
    const referent = (decalage: number) =>
      `Lead Farmer ${indiceCooperative + 1}${lettresReferents[(i + decalage) % lettresReferents.length]}`;
    return {
      id: `${cooperative.id}-${i + 1}`,
      nom: `Producteur ${indiceCooperative + 1}-${String(i + 1).padStart(3, '0')}`,
      village: zone.villages[i % zone.villages.length],
      commune: zone.villages[(i + 1) % zone.villages.length],
      cooperative: cooperative.nom,
      zone: zone.nom,
      // Un référent, deux pour un producteur sur cinq (règle 3 : un ou plusieurs Lead Farmers).
      leadFarmers: i % 5 === 0 ? [referent(0), referent(1)] : [referent(0)],
      statutValidation: (i * 7) % 10 < 3 ? 'en-attente' : 'valide',
    };
  });
}

export function construireEchantillonnageMock(parametres: HttpParams): Echantillonnage {
  const campagne = parametres.get('campagne') ?? campagneEnCours;
  const facteur = campagne === campagneEnCours ? 1 : campagnePrecedente;
  const choisie = parametres.get('cooperative');
  const zone = zones.find((candidate) => candidate.id === parametres.get('zone'));
  const statut = parametres.get('statut');
  const recherche = (parametres.get('recherche') ?? '').toLowerCase();
  const page = Number(parametres.get('page') ?? 1);
  const taille = Number(parametres.get('taille') ?? 20);

  const retenues = cooperatives
    .map((cooperative, indice) => ({ cooperative, indice }))
    .filter(({ cooperative }) => !choisie || cooperative.id === choisie);
  const parCooperative: CouvertureCooperative[] = retenues.map(({ cooperative }) => {
    const echantillon = Math.round(cooperative.echantillon * facteur);
    return {
      id: cooperative.id,
      nom: cooperative.nom,
      echantillon,
      population: cooperative.population,
      taux: taux(echantillon, cooperative.population),
    };
  });
  const echantillon = parCooperative.reduce((somme, ligne) => somme + ligne.echantillon, 0);
  const population = parCooperative.reduce((somme, ligne) => somme + ligne.population, 0);

  const correspondants = retenues
    .flatMap(({ cooperative, indice }) =>
      producteursDe(indice, Math.round(cooperative.echantillon * facteur)),
    )
    .filter((producteur) => !zone || producteur.zone === zone.nom)
    .filter((producteur) => !statut || producteur.statutValidation === statut)
    .filter(
      (producteur) =>
        !recherche || `${producteur.nom} ${producteur.village} ${producteur.commune}`.toLowerCase().includes(recherche),
    );

  return {
    campagne,
    campagneEnCours,
    campagnes,
    cooperatives: cooperatives.map(({ id, nom }) => ({ id, nom })),
    zones: zones.map(({ id, nom }) => ({ id, nom })),
    couverture: { echantillon, population, taux: taux(echantillon, population) },
    parCooperative,
    producteurs: {
      total: correspondants.length,
      lignes: correspondants.slice((page - 1) * taille, page * taille),
    },
  };
}
