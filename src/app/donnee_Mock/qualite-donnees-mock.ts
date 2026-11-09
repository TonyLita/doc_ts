import { HttpParams } from '@angular/common/http';
import { Anomalie, QualiteDonnees, TypeAnomalie } from '../features/qualite-donnees/data-access/qualite-donnees.modeles';
import { construireObservationsMock } from './observations-mock';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// DONNÉES DE TEST de la qualité des données (CDC §8.11). Même statut temporaire que comptes-mock.ts.
// Les statuts de mois viennent du mock du tableau de bord et les décomptes de saisies de celui des observations :
// les trois pages restent cohérentes entre elles.
const cooperatives = [
  { id: 'coop-sava', nom: 'OP Sava' },
  { id: 'coop-analanjirofo', nom: 'OP Analanjirofo' },
  { id: 'coop-diana', nom: 'OP Diana' },
] as const;

const zones = [
  { id: 'littorale', nom: 'Littorale' },
  { id: 'intermediaire', nom: 'Intermédiaire' },
  { id: 'haute-montagne', nom: 'Haute montagne' },
] as const;

const typesAnomalies: readonly TypeAnomalie[] = ['valeur-aberrante', 'doublon', 'champ-manquant'];
// Répartition fixe des types, sans aléatoire : les mêmes anomalies à chaque démarrage.
const repartitionTypes = [0, 0, 1, 0, 2, 1, 0, 2, 0, 1] as const;
const moisAvecDonnees = [8, 9, 10, 11] as const; // les mois à venir n'ont pas encore d'anomalie
const nombreAnomalies = 63;
const poidsEquivalent = 0.5; // pondération fictive : le CDC ne donne pas la formule du score

// Toutes les anomalies de la campagne, avant filtrage.
const toutesAnomalies: readonly (Anomalie & { readonly idCooperative: string; readonly idZone: string })[] = Array.from(
  { length: nombreAnomalies },
  (_, i) => {
    const cooperative = cooperatives[i % cooperatives.length];
    const zone = zones[(i + Math.floor(i / 3)) % zones.length];
    return {
      id: `anomalie-${i + 1}`,
      type: typesAnomalies[repartitionTypes[i % repartitionTypes.length]],
      producteur: `Producteur ${(i % cooperatives.length) + 1}-${String(i + 1).padStart(3, '0')}`,
      cooperative: cooperative.nom,
      zone: zone.nom,
      mois: moisAvecDonnees[i % moisAvecDonnees.length],
      idCooperative: cooperative.id,
      idZone: zone.id,
    };
  },
);

export function construireQualiteDonneesMock(parametres: HttpParams): QualiteDonnees {
  const cooperative = parametres.get('cooperative') ?? undefined;
  const zone = parametres.get('zone') ?? undefined;
  const page = Number(parametres.get('page') ?? 1);
  const taille = Number(parametres.get('taille') ?? 10);

  const tableauDeBord = construireTableauDeBordMock({
    campagne: parametres.get('campagne') ?? undefined,
    cooperative,
  });
  const observations = construireObservationsMock(
    new HttpParams({
      fromObject: {
        ...(parametres.get('campagne') ? { campagne: parametres.get('campagne') as string } : {}),
        ...(cooperative ? { cooperative } : {}),
        ...(zone ? { zone } : {}),
        statut: 'valide',
      },
    }),
  );

  const saisiesValidees = observations.familles.reduce((somme, famille) => somme + famille.total, 0);
  const saisiesEnAttente = observations.enAttente;
  const total = saisiesValidees + saisiesEnAttente;

  // Complétude = moyenne des mois déjà échus : complet 100 %, partiel 50 % ; les mois « en attente » n'y comptent pas.
  const moisEchus = tableauDeBord.statutsMois.filter((element) => element.statut !== 'en-attente');
  const completudeMensuelle = moisEchus.length
    ? Math.round(
        (moisEchus.reduce((somme, element) => somme + (element.statut === 'complet' ? 100 : 50), 0) /
          moisEchus.length),
      )
    : 0;
  // Le taux est tronqué : un indicateur de qualité n'est jamais arrondi à la hausse.
  const tauxValidation = total ? Math.floor((saisiesValidees / total) * 100) : 0;

  const correspondantes = toutesAnomalies
    .filter((anomalie) => !cooperative || anomalie.idCooperative === cooperative)
    .filter((anomalie) => !zone || anomalie.idZone === zone)
    .map(({ id, type, producteur, cooperative: nomCooperative, zone: nomZone, mois }) => ({
      id,
      type,
      producteur,
      cooperative: nomCooperative,
      zone: nomZone,
      mois,
    }));

  return {
    campagne: tableauDeBord.campagne,
    campagneEnCours: tableauDeBord.campagneEnCours,
    campagnes: tableauDeBord.campagnes,
    cooperatives: tableauDeBord.cooperatives,
    zones: zones.map(({ id, nom }) => ({ id, nom })),
    scoreQualite: Math.round(completudeMensuelle * poidsEquivalent + tauxValidation * (1 - poidsEquivalent)),
    completudeMensuelle,
    tauxValidation,
    saisiesValidees,
    saisiesEnAttente,
    statutsMois: tableauDeBord.statutsMois,
    anomalies: {
      compteurs: typesAnomalies.map((type) => ({
        type,
        nombre: correspondantes.filter((anomalie) => anomalie.type === type).length,
      })),
      total: correspondantes.length,
      lignes: correspondantes.slice((page - 1) * taille, page * taille),
    },
  };
}
