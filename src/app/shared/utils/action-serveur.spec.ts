import { Subject, throwError } from 'rxjs';
import { actionServeur } from './action-serveur';

describe('actionServeur', () => {
  it('reste en cours jusqu’à la réponse du serveur, puis appelle succes', () => {
    const action = actionServeur();
    const serveur = new Subject<string>();
    const recus: string[] = [];

    action.lancer(serveur, { succes: (resultat) => recus.push(resultat) });
    expect(action.enCours()).toBe(true);
    expect(recus).toEqual([]);

    serveur.next('fait');
    expect(action.enCours()).toBe(false);
    expect(recus).toEqual(['fait']);
  });

  it('traduit l’échec par le motif propre à l’action', () => {
    const action = actionServeur();

    action.lancer(throwError(() => ({ status: 422, message: '' })), { erreurs: { 422: 'invalide' } });

    expect(action.enCours()).toBe(false);
    expect(action.cleErreur()).toBe('invalide');
  });

  it('retombe sur les motifs communs, sans trace technique', () => {
    const action = actionServeur();

    action.lancer(throwError(() => ({ status: 429, message: 'trop de requêtes' })));

    expect(action.cleErreur()).toBe('trop_de_demandes');
  });

  it('efface le motif précédent quand une nouvelle action démarre', () => {
    const action = actionServeur();
    action.lancer(throwError(() => ({ status: 500, message: '' })));
    expect(action.cleErreur()).toBe('generique');

    action.lancer(new Subject<void>());

    expect(action.cleErreur()).toBeUndefined();
    expect(action.enCours()).toBe(true);
  });
});
