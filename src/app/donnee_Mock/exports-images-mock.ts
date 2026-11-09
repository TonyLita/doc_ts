import { echelleAxe, nombreGraduations } from '../shared/utils/echelle-graphique';

// DONNÉES DE TEST : image PNG d'un graphique exportable, dessinée au canvas à l'identique de l'aperçu de la page (même carte,
// mêmes couleurs, même échelle d'axe, même légende). En production, c'est le serveur qui produit l'image ; ce faux serveur
// lit les couleurs du thème affiché (--surface, --couleur-zone-N…) pour qu'elle ressemble à ce que l'utilisateur voit.
export interface SerieImage {
  readonly nom: string;
  readonly valeurs: readonly number[]; // une valeur par étiquette (une seule pour l'anneau)
}

export interface DonneesImage {
  readonly type: 'empile' | 'courbes' | 'anneau';
  readonly titre: string;
  readonly description: string;
  readonly etiquettes: readonly string[]; // mois ; vide pour l'anneau
  readonly series: readonly SerieImage[]; // une par zone ou par saison ; le rang d'une série donne sa couleur
  readonly total?: string; // anneau : total déjà formaté, affiché au centre
}

// Taille logique de l'image, dessinée en double résolution pour rester nette.
const largeur = 960;
const hauteur = 600;
const echelle = 2;
const cadre = 40;
const axe = { gauche: cadre + 70, droite: largeur - cadre, haut: 140, bas: 470 } as const;
const couleursParDefaut = ['#5aa9ec', '#01adee', '#8bc541', '#f2b134', '#a98bf8'];

function lireTheme() {
  const racine = getComputedStyle(document.documentElement);
  const lire = (nom: string, repli: string) => racine.getPropertyValue(nom).trim() || repli;
  return {
    fond: lire('--surface', '#1c2757'),
    texte: lire('--on-surface', '#eef4ff'),
    ligne: lire('--line', '#5c6fb8'),
    series: couleursParDefaut.map((repli, rang) => lire(`--couleur-zone-${rang}`, repli)),
    police: getComputedStyle(document.body).fontFamily || 'sans-serif',
    affichage: lire('--font-display', 'sans-serif'),
  };
}

type Theme = ReturnType<typeof lireTheme>;
type Dessin = CanvasRenderingContext2D;

const couleurDe = (theme: Theme, rang: number) => theme.series[rang % theme.series.length];

function ecrire(
  dessin: Dessin,
  theme: Theme,
  texte: string,
  x: number,
  y: number,
  police: string,
  opacite: number,
  alignement: CanvasTextAlign = 'left',
  base: CanvasTextBaseline = 'alphabetic',
) {
  dessin.font = police;
  dessin.globalAlpha = opacite;
  dessin.fillStyle = theme.texte;
  dessin.textAlign = alignement;
  dessin.textBaseline = base;
  dessin.fillText(texte, x, y);
  dessin.globalAlpha = 1;
}

// Légende sous le graphique : une pastille de couleur puis le texte, à la ligne quand la place manque.
function dessinerLegende(dessin: Dessin, theme: Theme, elements: readonly string[], centree: boolean) {
  const police = `400 18px ${theme.police}`;
  dessin.font = police;
  const pastille = 18;
  const espace = 10;
  const intervalle = 32;
  const largeurs = elements.map((texte) => pastille + espace + dessin.measureText(texte).width);
  const lignes: number[][] = [[]];
  let cumul = 0;
  largeurs.forEach((largeurElement, rang) => {
    if (cumul > 0 && cumul + intervalle + largeurElement > largeur - 2 * cadre) {
      lignes.push([]);
      cumul = 0;
    }
    lignes[lignes.length - 1].push(rang);
    cumul += (cumul > 0 ? intervalle : 0) + largeurElement;
  });
  lignes.forEach((rangs, ligne) => {
    const total = rangs.reduce((somme, rang, i) => somme + largeurs[rang] + (i > 0 ? intervalle : 0), 0);
    let x = centree ? (largeur - total) / 2 : cadre;
    const y = 540 + ligne * 30;
    rangs.forEach((rang) => {
      dessin.fillStyle = couleurDe(theme, rang);
      dessin.beginPath();
      dessin.roundRect(x, y - 14, pastille, pastille, 3);
      dessin.fill();
      ecrire(dessin, theme, elements[rang], x + pastille + espace, y, police, 1);
      x += largeurs[rang] + intervalle;
    });
  });
}

function dessinerAxes(dessin: Dessin, theme: Theme, donnees: DonneesImage, maximum: number) {
  const { pas, maxAxe } = echelleAxe(maximum);
  const y = (valeur: number) => axe.haut + (axe.bas - axe.haut) * (1 - valeur / maxAxe);
  dessin.lineWidth = 1.5;
  for (let graduation = 0; graduation <= nombreGraduations; graduation++) {
    dessin.globalAlpha = 0.35;
    dessin.strokeStyle = theme.ligne;
    dessin.beginPath();
    dessin.moveTo(axe.gauche, y(graduation * pas));
    dessin.lineTo(axe.droite, y(graduation * pas));
    dessin.stroke();
    dessin.globalAlpha = 1;
    ecrire(dessin, theme, String(graduation * pas), axe.gauche - 14, y(graduation * pas) + 1, `400 16px ${theme.police}`, 0.8, 'right', 'middle');
  }
  const bande = (axe.droite - axe.gauche) / Math.max(donnees.etiquettes.length, 1);
  donnees.etiquettes.forEach((etiquette, i) =>
    ecrire(dessin, theme, etiquette, axe.gauche + bande * (i + 0.5), axe.bas + 30, `400 16px ${theme.police}`, 0.8, 'center'),
  );
  return { y, bande };
}

function dessinerBarres(dessin: Dessin, theme: Theme, donnees: DonneesImage) {
  const sommes = donnees.etiquettes.map((_, i) => donnees.series.reduce((somme, serie) => somme + serie.valeurs[i], 0));
  const { y, bande } = dessinerAxes(dessin, theme, donnees, Math.max(0, ...sommes));
  donnees.etiquettes.forEach((_, i) => {
    let cumul = 0;
    donnees.series.forEach((serie, rang) => {
      const haut = y(cumul + serie.valeurs[i]);
      dessin.fillStyle = couleurDe(theme, rang);
      dessin.fillRect(axe.gauche + bande * i + bande * 0.15, haut, bande * 0.7, y(cumul) - haut);
      cumul += serie.valeurs[i];
    });
  });
}

function dessinerCourbes(dessin: Dessin, theme: Theme, donnees: DonneesImage) {
  const { y, bande } = dessinerAxes(dessin, theme, donnees, Math.max(0, ...donnees.series.flatMap((serie) => serie.valeurs)));
  const x = (i: number) => axe.gauche + bande * (i + 0.5);
  donnees.series.forEach((serie, rang) => {
    dessin.strokeStyle = dessin.fillStyle = couleurDe(theme, rang);
    dessin.lineWidth = 4;
    dessin.lineJoin = 'round';
    dessin.beginPath();
    serie.valeurs.forEach((valeur, i) => dessin[i ? 'lineTo' : 'moveTo'](x(i), y(valeur)));
    dessin.stroke();
    serie.valeurs.forEach((valeur, i) => {
      dessin.beginPath();
      dessin.arc(x(i), y(valeur), 6, 0, 2 * Math.PI);
      dessin.fill();
    });
  });
}

// Anneau comme celui de l'aperçu : trait de 5/36 du diamètre, départ en haut, sens horaire, total au centre.
function dessinerAnneau(dessin: Dessin, theme: Theme, donnees: DonneesImage) {
  const rayonExterieur = 170;
  const unite = rayonExterieur / 18.4155;
  const rayon = 15.9155 * unite;
  const centreX = largeur / 2;
  const centreY = axe.haut + rayonExterieur;
  const arc = (debut: number, fin: number, couleur: string, opacite: number) => {
    dessin.globalAlpha = opacite;
    dessin.strokeStyle = couleur;
    dessin.lineWidth = 5 * unite;
    dessin.beginPath();
    dessin.arc(centreX, centreY, rayon, debut, fin);
    dessin.stroke();
    dessin.globalAlpha = 1;
  };
  arc(0, 2 * Math.PI, theme.ligne, 0.25);
  const valeurs = donnees.series.map((serie) => serie.valeurs[0]);
  const total = valeurs.reduce((somme, valeur) => somme + valeur, 0) || 1;
  let cumul = 0;
  valeurs.forEach((valeur, rang) => {
    const debut = -Math.PI / 2 + (cumul / total) * 2 * Math.PI;
    cumul += valeur;
    arc(debut, -Math.PI / 2 + (cumul / total) * 2 * Math.PI, couleurDe(theme, rang), 1);
  });
  ecrire(dessin, theme, donnees.total ?? '', centreX, centreY + 2, `700 44px ${theme.affichage}`, 1, 'center', 'middle');
  return valeurs.map((valeur) => Math.round((valeur / total) * 100));
}

export function construireImageGraphique(donnees: DonneesImage): Promise<Blob> {
  const theme = lireTheme();
  const toile = document.createElement('canvas');
  toile.width = largeur * echelle;
  toile.height = hauteur * echelle;
  const dessin = toile.getContext('2d') as Dessin;
  dessin.scale(echelle, echelle);
  dessin.fillStyle = theme.fond;
  dessin.fillRect(0, 0, largeur, hauteur);
  ecrire(dessin, theme, donnees.titre, cadre, 62, `600 26px ${theme.police}`, 0.85);
  ecrire(dessin, theme, donnees.description, cadre, 96, `400 18px ${theme.police}`, 0.8);

  if (donnees.type === 'anneau') {
    const parts = dessinerAnneau(dessin, theme, donnees);
    dessinerLegende(dessin, theme, donnees.series.map((serie, rang) => `${serie.nom} · ${parts[rang]} %`), true);
  } else {
    (donnees.type === 'empile' ? dessinerBarres : dessinerCourbes)(dessin, theme, donnees);
    dessinerLegende(dessin, theme, donnees.series.map((serie) => serie.nom), false);
  }
  return new Promise((resolve) => toile.toBlob((image) => resolve(image as Blob), 'image/png'));
}
