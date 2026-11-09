import { TestBed } from '@angular/core/testing';
import { EtatMenuService } from './etat-menu.service';

describe('EtatMenuService', () => {
  it('affiche le menu par défaut', () => {
    expect(TestBed.inject(EtatMenuService).menuReduit()).toBe(false);
  });

  it('réduit puis ré-affiche le menu à chaque bascule', () => {
    const etat = TestBed.inject(EtatMenuService);

    etat.basculer();
    expect(etat.menuReduit()).toBe(true);

    etat.basculer();
    expect(etat.menuReduit()).toBe(false);
  });
});
