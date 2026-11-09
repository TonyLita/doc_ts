1. Les tâches côté Angular faisables tout de suite sont : aligner l'URL, créer la garde, passer le formulaire en typé et ajouter la zone d'erreur.

2. Créer authGuard dans core/auth/, en fonction CanActivateFn : il laisse passer si AuthService.isAuthenticated() est vrai, sinon il redirige vers /connexion. Aucune route protégée n'existe encore, donc il sera testé par un test unitaire.

3. Formulaire réactif typé pour la connexion : identifiant et mot de passe obligatoires, validation immédiate, messages d'erreur liés aux champs (aria-describedby pour les lecteurs d'écran).

////////////////

# Voici les modifications faites pour la logique d'authentification. Elles sont sur feature/flw-5-authentification-logique, non committées, et seules ces 4 fichiers ont changé.

Fichiers modifiés
1. src/app/app.routes.ts (modifié)

Changements par rapport à develop :
- Ajout d'un commentaire qui renvoie au manuel (§5.4).
- '' redirige désormais vers connexion (avant : login).
- Nouvelle route login qui redirige vers connexion (ancienne URL conservée).
- La route de la page de connexion passe de login à connexion. Le composant chargé reste LoginPageComponent.

2. src/app/core/auth/auth.guard.ts (nouveau)

Garde de route fonctionnelle authGuard (CanActivateFn) :
- Renvoie true si AuthService.isAuthenticated() est vrai.
- Sinon, renvoie une redirection vers /connexion.
- Un commentaire rappelle que masquer un bouton n'est pas un contrôle d'accès (§7.1).

3. src/app/core/auth/auth.guard.spec.ts (nouveau)

Trois tests :
- autorise la navigation quand un jeton est présent ;
- redirige vers /connexion sans jeton ;
- redirige de nouveau après suppression du jeton.

4. src/app/app.routes.spec.ts (nouveau)

Deux tests :
- / et /login aboutissent à /connexion ;
- la page de connexion s'affiche sur /connexion.

Fichiers existants, non modifiés

- src/app/core/auth/auth.service.ts : déjà présent, inchangé.
- src/app/core/auth/auth.interceptor.ts : déjà présent, inchangé.

Ce qui n'est pas encore fait

- Aucune route n'est protégée par authGuard : il n'est pas encore branché (canActivate).
- Pas de formulaire typé, pas de message d'erreur, pas d'appel au serveur.

Le travail est sur cette branche, rien n'est committé ni poussé.