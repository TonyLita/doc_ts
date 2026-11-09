import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  async function preparer() {
    await TestBed.configureTestingModule({ imports: [AppComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the app', async () => {
    const fixture = await preparer();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('n’affiche que la page courante : le header vient de la coquille ou de la page', async () => {
    const fixture = await preparer();
    const racine: HTMLElement = fixture.nativeElement;

    expect(racine.querySelector('router-outlet')).not.toBeNull();
    expect(racine.querySelector('app-header')).toBeNull();
  });
});
