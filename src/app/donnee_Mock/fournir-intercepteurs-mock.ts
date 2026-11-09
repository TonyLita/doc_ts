import { HttpInterceptorFn } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { urlAnalyseZones } from '../features/analyse-zones/data-access/analyse-zones.service';
import { urlEchantillonnage } from '../features/echantillonnage/data-access/echantillonnage.service';
import { urlObservations } from '../features/observations/data-access/observations.service';
import { urlSynchronisation } from '../features/synchronisation/data-access/synchronisation.service';
import { urlQualiteDonnees } from '../features/qualite-donnees/data-access/qualite-donnees.service';
import { urlCartographie } from '../features/cartographie/data-access/cartographie.service';
import { construireAnalyseZonesMock } from './analyse-zones-mock';
import { construireEchantillonnageMock } from './echantillonnage-mock';
import { construireObservationsMock } from './observations-mock';
import { construireQualiteDonneesMock } from './qualite-donnees-mock';
import { construireSynchronisationMock } from './synchronisation-mock';
import { construireCartographieMock } from './cartographie-mock';
import { administrationMockInterceptor } from './administration-mock';
import { campagnesMockInterceptor } from './campagnes-mock';
import { cooperativesMockInterceptor } from './cooperatives-mock';
import { exportsMockInterceptor } from './exports-mock';
import { importsMockInterceptor } from './imports-mock';
import { parcellesMockInterceptor } from './parcelles-mock';
import { producteursMockInterceptor } from './producteurs-mock';
import { rapportsIaMockInterceptor } from './rapports-ia-mock';
import { referentielGeoMockInterceptor } from './referentiel-geo-mock';
import { connexionMockInterceptor } from './connexion-mock.interceptor';
import { filtresDeRequete, intercepteurGetMock } from './intercepteur-get-mock';
import { tableauDeBordMockInterceptor } from './tableau-de-bord-mock.interceptor';

const cartographieMockInterceptor = intercepteurGetMock(urlCartographie, construireCartographieMock);
const analyseZonesMockInterceptor = intercepteurGetMock(urlAnalyseZones, (requete) =>
  construireAnalyseZonesMock(filtresDeRequete(requete)),
);
const echantillonnageMockInterceptor = intercepteurGetMock(urlEchantillonnage, (requete) =>
  construireEchantillonnageMock(requete.params),
);
const observationsMockInterceptor = intercepteurGetMock(urlObservations, (requete) =>
  construireObservationsMock(requete.params),
);
const synchronisationMockInterceptor = intercepteurGetMock(urlSynchronisation, (requete) =>
  construireSynchronisationMock(requete.params),
);
const qualiteDonneesMockInterceptor = intercepteurGetMock(urlQualiteDonnees, (requete) =>
  construireQualiteDonneesMock(requete.params),
);

// Seul point de contact du dossier avec le reste de l'application (app.config.ts).
// Actif uniquement en mode développement ; retirer ce dossier = supprimer cette ligne dans app.config.ts.
export function fournirIntercepteursMock(): HttpInterceptorFn[] {
  return isDevMode()
    ? [
        connexionMockInterceptor,
        tableauDeBordMockInterceptor,
        cartographieMockInterceptor,
        analyseZonesMockInterceptor,
        echantillonnageMockInterceptor,
        observationsMockInterceptor,
        qualiteDonneesMockInterceptor,
        campagnesMockInterceptor,
        rapportsIaMockInterceptor,
        exportsMockInterceptor,
        synchronisationMockInterceptor,
        importsMockInterceptor,
        administrationMockInterceptor,
        referentielGeoMockInterceptor,
        cooperativesMockInterceptor,
        producteursMockInterceptor,
        parcellesMockInterceptor,
      ]
    : [];
}
