import { Profil } from '../../auth/profil';

// Page couverte par une entrée de menu, avec les profils qui y ont droit (absent : tous).
export interface PageElementMenu {
  readonly route: string;
  readonly profils?: readonly Profil[];
}

export interface ElementMenu {
  // Clé de traduction (portée « layout » : public/i18n/layout/<langue>.json).
  readonly cle: string;
  // Absente tant que la page du module n'existe pas : l'entrée est alors affichée désactivée.
  readonly route?: string;
  // Profils qui voient l'entrée ; absent : tous les profils (CDC §8.1, §8.14, §8.16).
  readonly profils?: readonly Profil[];
  // Groupe du menu (id d'un GroupeMenu) ; absent : l'entrée est seule, en haut du menu.
  readonly groupe?: string;
  // Entrée qui couvre plusieurs pages (ex. Import / Export) : elle est vue par les profils qui ont droit à l'une d'elles,
  // son lien mène à la première page permise et elle est active sur chacune. Remplace `profils` et `route` pour la visibilité.
  readonly pages?: readonly PageElementMenu[];
}

export interface GroupeMenu {
  readonly id: string;
  // Clé de traduction du titre du groupe.
  readonly cle: string;
  // « bas » : le groupe est ancré en bas du menu (colonne latérale), après les autres.
  readonly ancre?: 'bas';
}

// Un profil voit ce qui n'est réservé à personne (profils absent) ou ce qui lui est ouvert ; un profil inconnu ne voit que le libre.
export function profilAutorise(profils: readonly Profil[] | undefined, profil: Profil | null): boolean {
  return !profils || (profil !== null && profils.includes(profil));
}

// Groupes du menu, dans l'ordre d'affichage. Un groupe sans entrée visible pour le profil n'est pas affiché.
export const groupesMenu: readonly GroupeMenu[] = [
  { id: 'operations_terrain', cle: 'layout.groupe.operations_terrain' },
  { id: 'analyses_rapports', cle: 'layout.groupe.analyses_rapports' },
  { id: 'referentiels', cle: 'layout.groupe.referentiels' },
  { id: 'gestion_donnees', cle: 'layout.groupe.gestion_donnees' },
  { id: 'systeme', cle: 'layout.groupe.systeme', ancre: 'bas' },
];

// Entrées du menu de navigation, dans l'ordre d'affichage (les entrées sans groupe d'abord, puis chaque groupe). Seules les
// entrées dotées d'une route ont une page pour l'instant.
// Pour activer un module : lui donner sa route. Pour changer un intitulé : modifier les fichiers JSON.
export const elementsMenu: readonly ElementMenu[] = [
  { cle: 'layout.menu.tableau_de_bord', route: '/tableau-de-bord' },

  { cle: 'layout.menu.campagnes', route: '/campagnes', groupe: 'operations_terrain' },
  { cle: 'layout.menu.observations', route: '/observations', groupe: 'operations_terrain' },
  { cle: 'layout.menu.echantillonnage', route: '/echantillonnage', groupe: 'operations_terrain' },

  { cle: 'layout.menu.cartographie', route: '/cartographie', groupe: 'analyses_rapports' },
  { cle: 'layout.menu.analyse_zones', route: '/analyse-zones', groupe: 'analyses_rapports' },
  { cle: 'layout.menu.rapports', route: '/rapports-ia', groupe: 'analyses_rapports' },
  { cle: 'layout.menu.qualite_donnees', route: '/qualite-donnees', groupe: 'analyses_rapports' },

  { cle: 'layout.menu.referentiel_cooperatives', route: '/referentiels/cooperatives', groupe: 'referentiels' },
  { cle: 'layout.menu.referentiel_producteurs', route: '/referentiels/producteurs', groupe: 'referentiels' },
  { cle: 'layout.menu.referentiel_parcelles', route: '/referentiels/parcelles', groupe: 'referentiels' },
  { cle: 'layout.menu.referentiel_geographique', route: '/referentiels/geographique', groupe: 'referentiels' },

  { cle: 'layout.menu.synchronisation', route: '/synchronisation', groupe: 'gestion_donnees' },
  {
    cle: 'layout.menu.import_export',
    route: '/imports',
    groupe: 'gestion_donnees',
    pages: [
      { route: '/imports', profils: ['super-administrateur'] },
      { route: '/exports', profils: ['super-administrateur', 'utilisateur'] },
    ],
  },

  { cle: 'layout.menu.administration', route: '/administration', groupe: 'systeme' },
];

// Droit d'un profil sur une page du menu : déclarée dans le champ `pages` d'une entrée (ex. /imports, /exports) ou route d'une
// entrée simple (ex. /rapports-ia). Source unique, relue par les pages et par les onglets Import / Export au lieu de
// redéclarer les profils. Une route absente du menu n'est autorisée à personne.
export function pageAutorisee(route: string, profil: Profil | null): boolean {
  const page =
    elementsMenu.flatMap((element) => element.pages ?? []).find((candidate) => candidate.route === route) ??
    elementsMenu.find((element) => !element.pages && element.route === route);
  return page !== undefined && profilAutorise(page.profils, profil);
}
