// Couleurs des séries d'un graphique ou d'une carte : variables --couleur-zone-0 à 4 (core/layout/page.css).
// Une série garde toujours la même couleur grâce à son rang ; au-delà de 5 séries, les couleurs se répètent.
const nombreCouleurs = 5;

export function indiceCouleurSerie(rang: number): number {
  return rang % nombreCouleurs;
}

// Valeur CSS réelle de la couleur, pour les dessins qui ne lisent pas les variables CSS (canvas Leaflet).
export function couleurSerieCss(indice: number): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--couleur-zone-${indice}`).trim();
}
