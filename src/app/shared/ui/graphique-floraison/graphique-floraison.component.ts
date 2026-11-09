import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { echelleAxe, nombreGraduations } from '../../utils/echelle-graphique';
import { LegendeZonesComponent } from '../legende-zones/legende-zones.component';

export interface MoisGraphique {
  readonly libelle: string; // nom du mois, déjà formaté
  readonly valeurs: readonly number[]; // une valeur par zone, même ordre que `zones`
}

export type ModeGraphique = 'empile' | 'courbes';

// Repère du dessin (viewBox) : le SVG s'adapte ensuite à la largeur de sa carte.
const largeurParDefaut = 640;
const hauteurParDefaut = 280;
const marge = { haut: 12, droite: 12, bas: 32, gauche: 52 } as const;

// Affichage pur de l'évolution mensuelle de la floraison : vue empilée par zone ou courbes (CDC §8.7).
@Component({
  selector: 'app-graphique-floraison',
  imports: [LegendeZonesComponent],
  templateUrl: './graphique-floraison.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphiqueFloraisonComponent {
  readonly titre = input.required<string>();
  readonly libelleEmpile = input('');
  readonly libelleCourbes = input('');
  readonly zones = input.required<readonly string[]>();
  readonly mois = input.required<readonly MoisGraphique[]>();
  // Réglages facultatifs : une série seule n'a besoin ni de légende, ni de bascule entre les deux vues.
  readonly modeInitial = input<ModeGraphique>('empile');
  readonly bascule = input(true);
  readonly legende = input(true);
  // Faux quand la carte qui l'accueille porte déjà le titre : il reste alors le nom accessible du dessin.
  readonly avecTitre = input(true);
  // Taille du repère de dessin : la réduire agrandit relativement les textes (colonnes étroites).
  readonly largeur = input(largeurParDefaut);
  readonly hauteur = input(hauteurParDefaut);

  protected readonly mode = linkedSignal(() => this.modeInitial());
  protected readonly modes = computed(() => [
    { mode: 'empile' as const, libelle: this.libelleEmpile() },
    { mode: 'courbes' as const, libelle: this.libelleCourbes() },
  ]);
  protected readonly boiteDessin = computed(() => `0 0 ${this.largeur()} ${this.hauteur()}`);
  protected readonly bas = computed(() => this.hauteur() - marge.bas);
  protected readonly gauche = marge.gauche;
  protected readonly droite = computed(() => this.largeur() - marge.droite);

  protected readonly dessin = computed(() => {
    const mois = this.mois();
    const zones = this.zones();
    const largeur = this.largeur();
    const hauteur = this.hauteur();
    const empile = this.mode() === 'empile';
    const sommes = mois.map((m) => m.valeurs.reduce((a, b) => a + b, 0));
    const maximum = Math.max(0, ...(empile ? sommes : mois.flatMap((m) => m.valeurs)));
    const { pas, maxAxe } = echelleAxe(maximum);

    const largeurUtile = largeur - marge.gauche - marge.droite;
    const hauteurUtile = hauteur - marge.haut - marge.bas;
    const bande = largeurUtile / Math.max(mois.length, 1);
    const echelleY = (valeur: number) => marge.haut + hauteurUtile * (1 - valeur / maxAxe);
    const centre = (indice: number) => marge.gauche + bande * (indice + 0.5);

    const graduations = Array.from({ length: nombreGraduations + 1 }, (_, i) => ({
      y: echelleY(i * pas),
      libelle: String(i * pas),
    }));
    const etiquettes = mois.map((m, i) => ({ x: centre(i), libelle: m.libelle }));

    const barres = mois.flatMap((m, i) => {
      let cumul = 0;
      return m.valeurs.map((valeur, zone) => {
        const haut = echelleY(cumul + valeur);
        const basDeBarre = echelleY(cumul);
        cumul += valeur;
        return {
          x: marge.gauche + bande * i + bande * 0.15,
          y: haut,
          largeur: bande * 0.7,
          hauteur: basDeBarre - haut,
          zone,
          titre: `${zones[zone]} · ${m.libelle} : ${valeur}`,
        };
      });
    });

    const courbes = zones.map((nom, zone) => ({
      zone,
      points: mois.map((m, i) => `${centre(i)},${echelleY(m.valeurs[zone] ?? 0)}`).join(' '),
      sommets: mois.map((m, i) => ({
        x: centre(i),
        y: echelleY(m.valeurs[zone] ?? 0),
        titre: `${nom} · ${m.libelle} : ${m.valeurs[zone] ?? 0}`,
      })),
    }));

    return { graduations, etiquettes, barres, courbes };
  });

  protected choisir(mode: ModeGraphique): void {
    this.mode.set(mode);
  }
}
