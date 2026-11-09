import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';
import { IconeComponent } from '../../../shared/ui/icone/icone.component';
import { AuthService } from '../../auth/auth.service';
import { ElementMenu, elementsMenu, GroupeMenu, groupesMenu, profilAutorise } from './elements-menu';
import { EtatMenuService } from './etat-menu.service';

// Entrée visible pour le profil, avec la page vers laquelle son lien mène.
interface EntreeVisible {
  readonly element: ElementMenu;
  readonly cible?: string;
}

// Bloc du menu : les entrées sans groupe (en haut), ou un groupe et ses entrées visibles.
interface Section {
  readonly groupe?: GroupeMenu;
  readonly entrees: readonly EntreeVisible[];
}

// Sidebar unique de la plateforme : le menu de navigation de toutes les pages protégées, en groupes repliables.
// Le bouton de réduction du header la masque (EtatMenuService).
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, TranslocoPipe, IconeComponent],
  templateUrl: './sidebar.component.html',
  host: { class: 'block w-full lg:w-72 lg:shrink-0', '[hidden]': 'etatMenu.menuReduit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private readonly profil = inject(AuthService).profilCourant;
  private readonly routeur = inject(Router);
  // Chemin de la page affichée (sans paramètres), pour repérer l'entrée active.
  private readonly urlCourante = toSignal(
    this.routeur.events.pipe(
      filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
      map((evenement) => evenement.urlAfterRedirects),
    ),
    { initialValue: this.routeur.url },
  );

  // Une entrée réservée à certains profils n'est montrée qu'à eux ; un profil inconnu ne voit que les entrées libres. Une
  // entrée à plusieurs pages est vue dès qu'une page est permise et mène à la première. Un groupe sans entrée visible est retiré.
  protected readonly sections = computed<readonly Section[]>(() => {
    const profil = this.profil();
    const visibles = elementsMenu.flatMap((element): EntreeVisible[] => {
      if (element.pages) {
        const permise = element.pages.find((page) => profilAutorise(page.profils, profil));
        return permise ? [{ element, cible: permise.route }] : [];
      }
      return profilAutorise(element.profils, profil) ? [{ element, cible: element.route }] : [];
    });
    const seules = visibles.filter((entree) => !entree.element.groupe);
    return [
      ...(seules.length ? [{ entrees: seules }] : []),
      ...groupesMenu
        .map((groupe) => ({ groupe, entrees: visibles.filter((entree) => entree.element.groupe === groupe.id) }))
        .filter((section) => section.entrees.length),
    ];
  });
  protected readonly etatMenu = inject(EtatMenuService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // La page affichée est toujours visible : son groupe s'ouvre à chaque navigation (les autres restent comme l'utilisateur
    // les a laissés).
    effect(() => {
      const url = this.urlCourante();
      const groupe = elementsMenu.find((element) => element.groupe && this.estActifPour(element, url))?.groupe;
      if (groupe) {
        untracked(() => this.etatMenu.ouvrirGroupe(groupe));
      }
    });

    // Sous 1024 px le menu est tout en haut de la page, dans le flux : rouvert alors que la page est défilée, il
    // apparaîtrait hors écran. On remonte donc en haut pour qu'il soit visible sans défiler à la main (le header, collant,
    // reste visible : il porte le bouton).
    effect(() => {
      if (!this.etatMenu.menuReduit() && this.empile()) {
        window.scrollTo({ top: 0 });
      }
    });
  }

  // Après l'authentification la coquille se crée, et avec elle cette sidebar : sous 1024 px le menu démarre fermé. Ici
  // (et non dans le constructeur, où la coquille n'est pas encore dans la page) sa mise en page existe ; ni dans
  // afterNextRender, qui s'exécute après le premier affichage : le menu s'afficherait une image avant de se fermer.
  ngOnInit(): void {
    this.refermerSiEmpile();
  }

  // Sous 1024 px le menu est empilé au-dessus de la page (la coquille est en colonne) : il se ferme au démarrage et à
  // chaque choix d'une entrée, pour montrer la page. En colonne latérale (à partir de lg) il reste affiché. Sans effet
  // s'il est déjà fermé : l'état du menu survit à une déconnexion, basculer() le rouvrirait.
  protected refermerSiEmpile(): void {
    if (!this.etatMenu.menuReduit() && this.empile()) {
      this.etatMenu.basculer();
    }
  }

  // Le menu est empilé au-dessus de la page quand la coquille (parente directe) est en colonne, c'est-à-dire sous lg.
  private empile(): boolean {
    const coque = this.element.nativeElement.parentElement;
    return coque !== null && getComputedStyle(coque).flexDirection === 'column';
  }

  protected estActif(element: ElementMenu): boolean {
    return this.estActifPour(element, this.urlCourante());
  }

  // Une entrée est active sur sa route, ses sous-routes (la fiche d'un producteur) et chacune de ses pages.
  private estActifPour(element: ElementMenu, url: string): boolean {
    const chemin = url.split(/[?#]/)[0];
    const routes = element.pages ? element.pages.map((page) => page.route) : element.route ? [element.route] : [];
    return routes.some((route) => chemin === route || chemin.startsWith(`${route}/`));
  }

  // Un groupe replié masque ses entrées ; les entrées seules (sans groupe) sont toujours affichées.
  protected estReplie(section: Section): boolean {
    return section.groupe !== undefined && !this.etatMenu.groupesOuverts().has(section.groupe.id);
  }
}
