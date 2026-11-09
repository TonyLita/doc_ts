import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Profil } from './profil';

// Réserve une route à certains profils (ex. imports : Super Administrateur seul). Un profil inconnu ou non autorisé
// est renvoyé vers le tableau de bord. Le serveur refuse de toute façon les appels d'un profil sans droit.
export const profilGuard =
  (profils: readonly Profil[]): CanActivateFn =>
  () => {
    const profil = inject(AuthService).profilCourant();
    return (profil !== null && profils.includes(profil)) || inject(Router).parseUrl('/tableau-de-bord');
  };
