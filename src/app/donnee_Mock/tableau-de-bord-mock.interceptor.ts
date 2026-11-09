import { urlTableauDeBord } from '../features/dashboard/data-access/tableau-de-bord.service';
import { filtresDeRequete, intercepteurGetMock } from './intercepteur-get-mock';
import { construireTableauDeBordMock } from './tableau-de-bord-mock';

// Joue le rôle du serveur pour GET /tableau-de-bord.
export const tableauDeBordMockInterceptor = intercepteurGetMock(urlTableauDeBord, (requete) =>
  construireTableauDeBordMock(filtresDeRequete(requete)),
);
