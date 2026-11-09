import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

export interface MarqueurParcelle {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly couleur: string; // couleur CSS de la coopérative
}

export interface RepereCentre {
  readonly nom: string;
  readonly latitude: number;
  readonly longitude: number;
}

// Vue initiale : région SAVA, avant l'arrivée des données.
const centreInitial: L.LatLngTuple = [-14.5, 50];
const zoomInitial = 8;

// Décalage vertical de la bulle : sa pointe se pose juste au-dessus du cercle (rayon 7 px).
const decalageBulle = -10;

// Seul composant qui connaît Leaflet : le reste du module ne manipule que des données (manuel 4.3).
// Les parcelles sont des cercles dessinés sur un canvas (preferCanvas) : fluide pour ~2 000 points.
// La parcelle choisie s'affiche dans une bulle au-dessus de son point : le contenu projeté (la fiche) est déplacé
// dans cette bulle, il n'est donc écrit qu'une fois, par la page.
@Component({
  selector: 'app-carte',
  template: `
    <div #conteneur class="carte-leaflet"></div>
    <div hidden>
      <div #contenuBulle class="carte-bulle"><ng-content /></div>
    </div>
  `,
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarteComponent {
  readonly parcelles = input.required<readonly MarqueurParcelle[]>();
  readonly centres = input.required<readonly RepereCentre[]>();
  // Identifiant de la parcelle dont la bulle est ouverte ; absent : aucune bulle.
  readonly idBulle = input<string>();
  readonly parcelleChoisie = output<string>();
  // La bulle a été fermée par l'utilisateur (✕, Échap ou clic sur la carte) : la page efface la sélection.
  readonly bulleFermee = output<void>();

  private readonly conteneur = viewChild.required<ElementRef<HTMLElement>>('conteneur');
  private readonly contenuBulle = viewChild.required<ElementRef<HTMLElement>>('contenuBulle');
  private readonly carte = signal<L.Map | undefined>(undefined);
  private readonly marqueurs = L.layerGroup();
  private bulle?: L.Popup;
  // Vrai pendant une fermeture décidée par la page : elle ne doit pas être renvoyée comme une fermeture utilisateur.
  private fermetureProgrammee = false;
  private vueAjustee = false;

  constructor() {
    const destruction = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.conteneur().nativeElement;
      const carte = L.map(element, { preferCanvas: true }).setView(centreInitial, zoomInitial);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(carte);
      this.marqueurs.addTo(carte);

      this.bulle = L.popup({ offset: [0, decalageBulle], maxWidth: 240, className: 'bulle-parcelle' }).on('remove', () => {
        if (!this.fermetureProgrammee) {
          this.bulleFermee.emit();
        }
      });

      // La carte change de largeur quand on réduit le menu : Leaflet doit recalculer sa taille.
      const observateur = new ResizeObserver(() => carte.invalidateSize());
      observateur.observe(element);
      destruction.onDestroy(() => {
        observateur.disconnect();
        carte.remove();
      });
      this.carte.set(carte);
    });

    effect(() => {
      const carte = this.carte();
      if (!carte) {
        return;
      }
      this.marqueurs.clearLayers();

      const parcelles = this.parcelles();
      const centres = this.centres();
      for (const parcelle of parcelles) {
        // bubblingMouseEvents: false : le clic sur un cercle ne remonte pas à la carte, qui fermerait la bulle avant.
        L.circleMarker([parcelle.latitude, parcelle.longitude], {
          radius: 7,
          weight: 1,
          color: '#ffffff',
          fillColor: parcelle.couleur,
          fillOpacity: 0.9,
          bubblingMouseEvents: false,
        })
          .on('click', () => this.parcelleChoisie.emit(parcelle.id))
          .addTo(this.marqueurs);
      }
      for (const centre of centres) {
        // Repère en losange, distinct des cercles des parcelles. Le nom est posé en texte, jamais en HTML.
        const nom = document.createElement('span');
        nom.textContent = centre.nom;
        L.marker([centre.latitude, centre.longitude], {
          icon: L.divIcon({ className: 'repere-centre', iconSize: [18, 18] }),
          keyboard: false,
        })
          .bindTooltip(nom)
          .addTo(this.marqueurs);
      }

      // La vue s'ajuste une seule fois, aux premières données : les filtres ne déplacent plus la carte.
      if (!this.vueAjustee && parcelles.length > 0) {
        this.vueAjustee = true;
        carte.fitBounds(L.latLngBounds(parcelles.map((p) => [p.latitude, p.longitude])), { padding: [24, 24] });
      }
    });

    // Ouvre la bulle au-dessus de la parcelle choisie, ou la ferme si la page n'en garde aucune.
    effect(() => {
      const carte = this.carte();
      const id = this.idBulle();
      if (!carte || !this.bulle) {
        return;
      }
      const parcelle = id === undefined ? undefined : untracked(() => this.parcelles().find((p) => p.id === id));
      if (!parcelle) {
        this.fermetureProgrammee = true;
        carte.closePopup();
        this.fermetureProgrammee = false;
        return;
      }
      this.bulle
        .setLatLng([parcelle.latitude, parcelle.longitude])
        .setContent(this.contenuBulle().nativeElement)
        .openOn(carte);
    });
  }
}
