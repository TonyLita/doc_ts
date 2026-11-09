import { HttpParams } from '@angular/common/http';
import {
  Famille,
  FamilleObservations,
  Observations,
} from '../features/observations/data-access/observations.modeles';

// DONNÉES DE TEST des observations de floraison (CDC §8.10). Même statut temporaire que comptes-mock.ts.
// Le calibrage est volontairement peu fourni : il illustre l'indicateur de représentativité.
const campagnes = ['2026', '2025'] as const;
const campagneEnCours = campagnes[0];
const campagnePrecedente = 0.9; // effectifs de la campagne précédente, par rapport à la campagne en cours
const seuilRepresentativite = 30; // fictif : le CDC ne le définit pas
const partEnAttente = 0.09; // cohérent avec les 91 % de saisies valides du mock du tableau de bord

const cooperatives = [
  { id: 'coop-sava', nom: 'OP Sava', part: 0.45 },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo', part: 0.35 },
  { id: 'coop-diana', nom: 'OP Diana', part: 0.2 },
] as const;

const zones = [
  { id: 'littorale', nom: 'Littorale', part: 0.3 },
  { id: 'intermediaire', nom: 'Intermédiaire', part: 0.45 },
  { id: 'haute-montagne', nom: 'Haute montagne', part: 0.25 },
] as const;

// Observations validées, toutes coopératives et toutes zones confondues, par famille et par valeur.
const effectifsValides: readonly { famille: Famille; valeurs: Readonly<Record<string, number>> }[] = [
  { famille: 'quantite', valeurs: { faible: 58, normal: 191, beaucoup: 163 } },
  { famille: 'periode', valeurs: { precoce: 74, normal: 236, retard: 88 } },
  { famille: 'calibrage', valeurs: { court: 40, normal: 70, long: 30 } },
];

// Pourcentages entiers dont la somme fait exactement 100 : le reste est donné à la plus grande valeur.
function pourcentages(effectifs: readonly number[]): number[] {
  const total = effectifs.reduce((somme, effectif) => somme + effectif, 0);
  const parts = effectifs.map((effectif) => (total ? Math.round((effectif / total) * 100) : 0));
  if (total) {
    parts[effectifs.indexOf(Math.max(...effectifs))] += 100 - parts.reduce((somme, part) => somme + part, 0);
  }
  return parts;
}

export function construireObservationsMock(parametres: HttpParams): Observations {
  const campagne = parametres.get('campagne') ?? campagneEnCours;
  const statut = parametres.get('statut');
  const facteur =
    (cooperatives.find((candidate) => candidate.id === parametres.get('cooperative'))?.part ?? 1) *
    (zones.find((candidate) => candidate.id === parametres.get('zone'))?.part ?? 1) *
    (campagne === campagneEnCours ? 1 : campagnePrecedente);
  // Le calibrage n'a presque pas d'observations en début de campagne : on le réduit pour la campagne en cours.
  const reduction = (famille: Famille) => (famille === 'calibrage' && campagne === campagneEnCours ? 0.1 : 1);

  const comptees = (famille: Famille, effectif: number) => {
    const valides = Math.round(effectif * facteur * reduction(famille));
    const enAttente = Math.round(valides * partEnAttente);
    return { valides, enAttente };
  };

  let enAttenteTotal = 0;
  const familles: FamilleObservations[] = effectifsValides.map(({ famille, valeurs }) => {
    const lignes = Object.entries(valeurs).map(([valeur, effectif]) => {
      const { valides, enAttente } = comptees(famille, effectif);
      enAttenteTotal += enAttente;
      const effectifRetenu = statut === 'valide' ? valides : statut === 'en-attente' ? enAttente : valides + enAttente;
      return { valeur, effectif: effectifRetenu };
    });
    const total = lignes.reduce((somme, ligne) => somme + ligne.effectif, 0);
    const parts = pourcentages(lignes.map((ligne) => ligne.effectif));
    return {
      famille,
      total,
      representatif: total >= seuilRepresentativite,
      valeurs: lignes.map((ligne, indice) => ({ ...ligne, pourcentage: parts[indice] })),
    };
  });

  return {
    campagne,
    campagneEnCours,
    campagnes,
    cooperatives: cooperatives.map(({ id, nom }) => ({ id, nom })),
    zones: zones.map(({ id, nom }) => ({ id, nom })),
    enAttente: enAttenteTotal,
    familles,
  };
}
