import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Campagne,
  Campagnes,
  DonneesCampagne,
  IndicateursCampagne,
} from '../features/campagnes/data-access/campagnes.modeles';
import { urlCampagnes } from '../features/campagnes/data-access/campagnes.service';
import { delaiSimuleMs } from './connexion-mock.interceptor';
import { profilDeRequete } from './profil-mock';
import { refusMock, reponseMock } from './reponses-mock';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// DONNÉES DE TEST des campagnes (CDC §8.12). Même statut temporaire que comptes-mock.ts.
// L'historique vit en mémoire : les actions d'administration le modifient jusqu'au rechargement de la page.
// Les autres pages de test (tableau de bord, échantillonnage…) gardent leur propre liste de campagnes fixe.
let campagnes: readonly Campagne[] = [
  { id: '2026', debut: '2026-08-01', fin: '2027-02-28', statut: 'en-cours', active: true },
  { id: '2025', debut: '2025-08-01', fin: '2026-02-28', statut: 'cloturee', active: false },
  { id: '2024', debut: '2024-08-01', fin: '2025-02-28', statut: 'cloturee', active: false },
];

// Campagnes qui ont des données : celles du tableau de bord de test, plus une saison plus ancienne dérivée de 2025
// (plus faible et plus précoce) pour que les courbes de la comparaison se distinguent.
const sourcesComparaison: Readonly<Record<string, { base: string; facteur: number; decalage: number }>> = {
  '2026': { base: '2026', facteur: 1, decalage: 0 },
  '2025': { base: '2025', facteur: 1, decalage: 0 },
  '2024': { base: '2025', facteur: 0.8, decalage: 1 },
};

function indicateursDe(campagne: string): IndicateursCampagne | undefined {
  const source = sourcesComparaison[campagne];
  if (!source) {
    return undefined; // campagne créée sans donnée : absente de la comparaison
  }
  const tableau = construireTableauDeBordMock({ campagne: source.base });
  const fleurs = tableau.floraisonMensuelle.map((ligne) => ligne.fleursParZone.reduce((a, b) => a + b, 0));
  const decalees = fleurs.map((_, i) => Math.round(fleurs[(i + source.decalage) % fleurs.length] * source.facteur));
  const totalFleurs = decalees.reduce((a, b) => a + b, 0);
  return {
    campagne,
    totalFleurs,
    producteursSuivis: Math.round(tableau.producteursSuivis * source.facteur),
    moisPic: tableau.floraisonMensuelle[decalees.indexOf(Math.max(...decalees))].mois,
    productionEstimeeKg: Math.round((totalFleurs * tableau.productionEstimeeKg) / tableau.totalFleurs),
    floraisonMensuelle: tableau.floraisonMensuelle.map((ligne, i) => ({ mois: ligne.mois, fleurs: decalees[i] })),
  };
}

function estSuperAdministrateur(requete: HttpRequest<unknown>): boolean {
  return profilDeRequete(requete) === 'super-administrateur';
}

// Identifiant de la campagne active : les autres pages de test (rapports IA…) s'y réfèrent.
export const campagneActive = (): string | undefined => campagnes.find((campagne) => campagne.active)?.id;

const reponse = <T>(corps: T) => reponseMock(corps, delaiSimuleMs);
const refus = (status: number) => refusMock(status, urlCampagnes, delaiSimuleMs);

const parDebutDecroissant = (a: Campagne, b: Campagne) => b.debut.localeCompare(a.debut);

function modifier(id: string, donnees: DonneesCampagne): Observable<HttpResponse<null>> {
  if (!campagnes.some((campagne) => campagne.id === id)) {
    return refus(404);
  }
  if (!donnees.debut || !donnees.fin || donnees.fin < donnees.debut) {
    return refus(422);
  }
  campagnes = campagnes
    .map((campagne) => (campagne.id === id ? { ...campagne, debut: donnees.debut, fin: donnees.fin } : campagne))
    .sort(parDebutDecroissant);
  return reponse(null);
}

// Une seule campagne active à la fois : activer l'une désactive les autres (CDC §8.12, règle 2).
function changer(id: string, miseAJour: (campagne: Campagne, concernee: boolean) => Campagne): Observable<HttpResponse<null>> {
  if (!campagnes.some((campagne) => campagne.id === id)) {
    return refus(404);
  }
  campagnes = campagnes.map((campagne) => miseAJour(campagne, campagne.id === id));
  return reponse(null);
}

// Joue le rôle du serveur pour /campagnes. Les actions d'administration sont refusées (403) hors Super Administrateur.
export const campagnesMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (!requete.url.startsWith(urlCampagnes)) {
    return suivant(requete);
  }
  const [, id, action] = requete.url.slice(urlCampagnes.length).split('/').map(decodeURIComponent);
  const administrateur = estSuperAdministrateur(requete);

  if (requete.method === 'GET') {
    const corps: Campagnes = {
      peutAdministrer: administrateur,
      campagnes,
      comparaison: campagnes.flatMap((campagne) => indicateursDe(campagne.id) ?? []),
    };
    return reponse(corps);
  }
  if (!administrateur) {
    return refus(403);
  }
  if (requete.method === 'PUT' && id) {
    return modifier(id, requete.body as DonneesCampagne);
  }
  if (requete.method === 'POST' && action === 'cloture') {
    return changer(id, (campagne, concernee) => (concernee ? { ...campagne, statut: 'cloturee' as const } : campagne));
  }
  if (requete.method === 'POST' && action === 'activation') {
    return changer(id, (campagne, concernee) => ({ ...campagne, active: concernee }));
  }
  return suivant(requete);
};
