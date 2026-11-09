import { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApercuImport,
  ContexteImports,
  ControleLigne,
  EntreeHistorique,
  LigneApercu,
  MotifControle,
  PageApercu,
  ResultatImport,
  TypeReferentiel,
} from '../features/imports/data-access/imports.modeles';
import { urlImports } from '../features/imports/data-access/imports.service';
import { LangueDocument } from '../shared/utils/langue-document';
import { compteDeRequete } from './profil-mock';
import { reponseMock, refusMock } from './reponses-mock';

// DONNÉES DE TEST de l'import des référentiels (CDC §8.16). Même statut temporaire que comptes-mock.ts.
// Le « serveur » de test ne lit pas le contenu du fichier : seul son nom et sa taille comptent. L'aperçu est fabriqué.
// Les imports en attente et le journal vivent en mémoire, jusqu'au rechargement de la page.
const delaiAnalyseMs = 1200;
const delaiMs = 500;
const tailleMaxOctets = 10 * 1024 * 1024;
const extensionsParType: Readonly<Record<TypeReferentiel, readonly string[]>> = {
  parcelles: ['.kml', '.csv', '.xlsx'],
  cooperatives: ['.csv', '.xlsx'],
};

const cooperatives = ['OP Sava', 'OP Analanjirofo', 'OP Diana'] as const;
const motifsRejet: readonly MotifControle[] = ['producteur-inconnu', 'coordonnees-invalides', 'doublon', 'cooperative-inconnue'];

const coopsFichier = [
  ['OP Sava', 'Sambava', 'Sambava'],
  ['OP Analanjirofo', 'Fenerive Est', 'Fenerive Est'],
  ['OP Diana', 'Antsiranana', 'Antsiranana I'],
  ['OP Maroantsetra Nord', 'Maroantsetra', 'Maroantsetra'],
  ['OP Mananara Nord', 'Mananara', 'Mananara-Nord'],
  ['OP Antalaha', 'Antalaha', 'Antalaha'],
  ['OP Andapa', 'Andapa', 'Andapa'],
  ['OP Vohemar', 'Vohemar', 'Vohemar'],
  ['OP Cap Est', 'Maroantsetra', 'Maroantsetra'],
  ['OP Sava', 'Sambava', 'Sambava'],
  ['OP Analanjirofo', 'Fenerive Est', 'Fenerive Est'],
  ['', 'Mananara', 'Mananara-Nord'],
] as const;

const controleDe = (rejetee: boolean, aVerifier: boolean): ControleLigne =>
  rejetee ? 'rejetee' : aVerifier ? 'a-verifier' : 'valide';

// 1 840 lignes, dont 30 à vérifier et 20 rejetées (le schéma du CDC) ; 12 coopératives dont 2 à vérifier et 1 rejetée.
function fabriquerLignes(type: TypeReferentiel): LigneApercu[] {
  if (type === 'cooperatives') {
    return coopsFichier.map(([nom, village, commune], i) => {
      const controle = controleDe(i === 11, i === 9 || i === 10);
      return {
        numero: i + 2, // la ligne 1 du fichier est l'en-tête
        valeurs: { nom: nom || null, village, commune },
        controle,
        motif: controle === 'rejetee' ? 'champ-manquant' : controle === 'a-verifier' ? 'doublon' : undefined,
      };
    });
  }
  return Array.from({ length: 1840 }, (_, i) => {
    const controle = controleDe(i % 92 === 45, i % 61 === 10);
    const motif: MotifControle | undefined =
      controle === 'rejetee' ? motifsRejet[Math.floor(i / 92) % motifsRejet.length] : controle === 'a-verifier' ? 'coordonnees-invalides' : undefined;
    return {
      numero: i + 2,
      valeurs: {
        producteur: motif === 'producteur-inconnu' ? 'introuvable' : `Producteur ${(i % 3) + 1}-${String((i % 412) + 1).padStart(3, '0')}`,
        cooperative: cooperatives[i % cooperatives.length],
        latitude: (-15.43 - (i % 50) * 0.002).toFixed(4),
        longitude: (49.74 + (i % 40) * 0.003).toFixed(4),
        pieds: 60 + ((i * 7) % 120),
      },
      controle,
      motif,
    };
  });
}

interface ImportEnAttente {
  readonly type: TypeReferentiel;
  readonly fichier: string;
  readonly lignes: readonly LigneApercu[];
}

const enAttente = new Map<string, ImportEnAttente>();
let compteur = 0;
let historique: readonly EntreeHistorique[] = [
  { id: 'imp-3', date: '2026-08-04T09:12:00.000Z', utilisateur: 'admin', fichier: 'parcelles_2026.kml', type: 'parcelles', creees: 1650, miseAJour: 120, rejetees: 18 },
  { id: 'imp-2', date: '2026-07-29T14:40:00.000Z', utilisateur: 'admin', fichier: 'cooperatives.xlsx', type: 'cooperatives', creees: 7, miseAJour: 0, rejetees: 0 },
  { id: 'imp-1', date: '2026-07-20T08:05:00.000Z', utilisateur: 'admin', fichier: 'parcelles_initial.csv', type: 'parcelles', creees: 1432, miseAJour: 0, rejetees: 41 },
];

const compter = (lignes: readonly LigneApercu[], controle: ControleLigne) => lignes.filter((ligne) => ligne.controle === controle).length;

const textes = {
  fr: {
    modele: { parcelles: 'Producteur;Coopérative;Latitude;Longitude;Pieds', cooperatives: 'Nom;Village pivot;Commune' },
    rapport: 'Ligne;Motif',
    motifs: {
      'producteur-inconnu': 'producteur inconnu',
      'cooperative-inconnue': 'coopérative inconnue',
      'coordonnees-invalides': 'coordonnées invalides',
      doublon: 'doublon',
      'champ-manquant': 'champ obligatoire manquant',
    },
  },
  en: {
    modele: { parcelles: 'Farmer,Cooperative,Latitude,Longitude,Vines', cooperatives: 'Name,Hub village,Commune' },
    rapport: 'Row,Reason',
    motifs: {
      'producteur-inconnu': 'unknown farmer',
      'cooperative-inconnue': 'unknown cooperative',
      'coordonnees-invalides': 'invalid coordinates',
      doublon: 'duplicate',
      'champ-manquant': 'required field missing',
    },
  },
} as const;

const csv = (contenu: string) => new Blob(['﻿', contenu], { type: 'text/csv;charset=utf-8' });

function analyser(corps: FormData): Observable<HttpEvent<unknown>> {
  const fichier = corps.get('fichier');
  const type = corps.get('type') as TypeReferentiel | null;
  if (!(fichier instanceof File) || !type || !(type in extensionsParType)) {
    return refusMock(422, urlImports, delaiMs);
  }
  if (fichier.size > tailleMaxOctets) {
    return refusMock(413, urlImports, delaiMs);
  }
  const nom = fichier.name.toLowerCase();
  if (!extensionsParType[type].some((extension) => nom.endsWith(extension))) {
    return refusMock(415, urlImports, delaiMs); // .xlsm, .kmz, .pdf…
  }
  const lignes = fabriquerLignes(type);
  compteur += 1;
  const idImport = `apercu-${compteur}`;
  enAttente.set(idImport, { type, fichier: fichier.name, lignes });
  const apercu: ApercuImport = {
    idImport,
    fichier: fichier.name,
    type,
    lignesLues: lignes.length,
    compteurs: {
      valides: compter(lignes, 'valide'),
      aVerifier: compter(lignes, 'a-verifier'),
      rejetees: compter(lignes, 'rejetee'),
    },
  };
  return reponseMock(apercu, delaiAnalyseMs);
}

function confirmer(idImport: string, utilisateur: string): Observable<HttpEvent<unknown>> {
  const enCours = enAttente.get(idImport);
  if (!enCours) {
    return refusMock(404, urlImports, delaiMs);
  }
  // Import partiel : les lignes valides et à vérifier sont écrites, les rejetées restent dans le rapport d'erreurs.
  const ecrites = enCours.lignes.length - compter(enCours.lignes, 'rejetee');
  const miseAJour = Math.floor(ecrites * 0.05);
  const resultat: ResultatImport = {
    creees: ecrites - miseAJour,
    miseAJour,
    rejetees: compter(enCours.lignes, 'rejetee'),
  };
  historique = [
    { id: `imp-${historique.length + 1}`, date: new Date().toISOString(), utilisateur, fichier: enCours.fichier, type: enCours.type, ...resultat },
    ...historique,
  ];
  // L'import reste en mémoire : le rapport d'erreurs est encore téléchargeable après la confirmation.
  return reponseMock(resultat, delaiAnalyseMs);
}

// Joue le rôle du serveur pour /imports. Réservé au Super Administrateur : 403 pour les autres profils.
export const importsMockInterceptor: HttpInterceptorFn = (requete, suivant) => {
  if (!requete.url.startsWith(urlImports)) {
    return suivant(requete);
  }
  const compte = compteDeRequete(requete);
  const administrateur = compte?.profil === 'super-administrateur';
  const [, a, b] = requete.url.slice(urlImports.length).split('/').map(decodeURIComponent);
  const langue: LangueDocument = requete.params.get('langue') === 'en' ? 'en' : 'fr';

  if (requete.method === 'GET' && a === undefined) {
    const contexte: ContexteImports = { peutImporter: administrateur, historique: administrateur ? historique : [] };
    return reponseMock(contexte, delaiMs);
  }
  if (!administrateur) {
    return refusMock(403, urlImports, delaiMs);
  }
  if (requete.method === 'POST' && a === undefined && requete.body instanceof FormData) {
    return analyser(requete.body);
  }
  if (requete.method === 'GET' && a === 'modele' && b && b in extensionsParType) {
    return reponseMock(csv(textes[langue].modele[b as TypeReferentiel]), delaiMs, `modele-${b}.csv`);
  }
  const enCours = a ? enAttente.get(a) : undefined;
  if (a && !enCours) {
    return refusMock(404, urlImports, delaiMs);
  }
  if (enCours && a) {
    if (requete.method === 'GET' && b === 'apercu') {
      const page = Number(requete.params.get('page') ?? 1);
      const taille = Number(requete.params.get('taille') ?? 15);
      const corps: PageApercu = { total: enCours.lignes.length, lignes: enCours.lignes.slice((page - 1) * taille, page * taille) };
      return reponseMock(corps, 300);
    }
    if (requete.method === 'POST' && b === 'confirmation') {
      return confirmer(a, compte?.identifiant ?? 'admin');
    }
    if (requete.method === 'GET' && b === 'rapport-erreurs') {
      const lignes = enCours.lignes
        .filter((ligne) => ligne.controle === 'rejetee')
        .map((ligne) => `${ligne.numero}${langue === 'fr' ? ';' : ','}${ligne.motif ? textes[langue].motifs[ligne.motif] : ''}`);
      return reponseMock(csv([textes[langue].rapport, ...lignes].join('\r\n')), delaiMs, `rapport-erreurs-${a}.csv`);
    }
    if (requete.method === 'DELETE' && b === undefined) {
      enAttente.delete(a);
      return reponseMock(null, 200);
    }
  }
  return suivant(requete);
};
