import { of, Subject, throwError } from 'rxjs';
import { chargerAvecCache, oublierCache } from './charger-avec-cache';

describe('chargerAvecCache', () => {
  afterEach(() => oublierCache(''));

  it('n’émet que la réponse fraîche tant que rien n’est gardé', () => {
    const recues: number[] = [];

    chargerAvecCache('a', () => of(1)).subscribe((valeur) => recues.push(valeur));

    expect(recues).toEqual([1]);
  });

  it('montre tout de suite la dernière réponse gardée, puis la réponse fraîche', () => {
    chargerAvecCache('a', () => of(1)).subscribe();
    const serveur = new Subject<number>();
    const recues: number[] = [];

    chargerAvecCache('a', () => serveur).subscribe((valeur) => recues.push(valeur));
    expect(recues).toEqual([1]);

    serveur.next(2);
    expect(recues).toEqual([1, 2]);
  });

  it('ne mélange pas deux clés', () => {
    chargerAvecCache('imports|admin', () => of('données de admin')).subscribe();
    const recues: string[] = [];

    chargerAvecCache('imports|agronome', () => of('données de agronome')).subscribe((valeur) => recues.push(valeur));

    expect(recues).toEqual(['données de agronome']);
  });

  it('oublie les réponses dont la clé commence par le préfixe donné', () => {
    chargerAvecCache('imports|admin', () => of(1)).subscribe();
    chargerAvecCache('exports|admin', () => of(2)).subscribe();
    oublierCache('imports');
    const imports: number[] = [];
    const exports: number[] = [];
    const serveur = new Subject<number>();

    chargerAvecCache('imports|admin', () => serveur).subscribe((valeur) => imports.push(valeur));
    chargerAvecCache('exports|admin', () => serveur).subscribe((valeur) => exports.push(valeur));

    expect(imports).toEqual([]);
    expect(exports).toEqual([2]);
  });

  it('transmet l’erreur du serveur', () => {
    let erreur: unknown;

    chargerAvecCache('a', () => throwError(() => new Error('refus'))).subscribe({ error: (e: unknown) => (erreur = e) });

    expect(erreur).toEqual(new Error('refus'));
  });
});
