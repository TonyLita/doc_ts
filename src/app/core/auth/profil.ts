// Profils de la plateforme à droits croissants (CDC §6, §8.1). Le serveur fait foi : le profil ne sert côté
// navigateur qu'à n'afficher que les entrées de menu et les pages auxquelles le profil a droit.
export type Profil = 'super-administrateur' | 'utilisateur' | 'visiteur';
