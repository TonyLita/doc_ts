import { TestBed } from '@angular/core/testing';
import { GraphiqueFloraisonComponent } from './graphique-floraison.component';

describe('GraphiqueFloraisonComponent', () => {
  function creer() {
    const fixture = TestBed.createComponent(GraphiqueFloraisonComponent);
    fixture.componentRef.setInput('titre', 'Floraison');
    fixture.componentRef.setInput('libelleEmpile', 'Empilé');
    fixture.componentRef.setInput('libelleCourbes', 'Courbes');
    fixture.componentRef.setInput('zones', ['A', 'B']);
    fixture.componentRef.setInput('mois', [
      { libelle: 'août', valeurs: [10, 20] },
      { libelle: 'sept.', valeurs: [30, 40] },
    ]);
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement };
  }

  it('dessine une barre par zone et par mois en vue empilée', () => {
    const { racine } = creer();

    expect(racine.querySelectorAll('svg rect')).toHaveLength(4);
    expect(racine.querySelectorAll('svg polyline')).toHaveLength(0);
  });

  it('bascule en courbes : une courbe par zone', () => {
    const { fixture, racine } = creer();

    (racine.querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(racine.querySelectorAll('svg polyline')).toHaveLength(2);
    expect(racine.querySelectorAll('svg rect')).toHaveLength(0);
    expect(racine.querySelectorAll('button')[1].getAttribute('aria-pressed')).toBe('true');
  });
});
