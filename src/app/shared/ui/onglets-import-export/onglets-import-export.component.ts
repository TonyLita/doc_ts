import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/auth/auth.service';
import { pageAutorisee } from '../../../core/layout/sidebar/elements-menu';
import { OngletsComponent } from '../onglets/onglets.component';

export type OngletImportExport = 'import' | 'export';

const onglets: readonly { readonly id: OngletImportExport; readonly route: string }[] = [
  { id: 'import', route: '/imports' },
  { id: 'export', route: '/exports' },
];

// Onglets « Import » et « Export » de la page d'import et de la page d'export : chacun mène à sa propre route. Les pages
// y projettent leur contenu. Un profil qui n'a droit qu'à une des deux pages ne voit pas d'onglets (un seul n'aurait pas de
// sens) ; le contenu s'affiche alors sans barre. L'onglet actif est celui de la page qui contient ce composant.
@Component({
  selector: 'app-onglets-import-export',
  imports: [OngletsComponent, TranslocoPipe],
  templateUrl: './onglets-import-export.component.html',
  host: { class: 'flex flex-col gap-6' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OngletsImportExportComponent {
  private readonly profil = inject(AuthService).profilCourant;
  private readonly routeur = inject(Router);

  readonly actif = input.required<OngletImportExport>();

  // Les deux onglets ou aucun : seul le Super Administrateur a droit aux deux pages (droits lus dans le menu).
  protected readonly avecOnglets = computed(() => onglets.every((onglet) => pageAutorisee(onglet.route, this.profil())));

  protected aller(id: string): void {
    const onglet = onglets.find((candidat) => candidat.id === id);
    if (onglet && onglet.id !== this.actif()) {
      void this.routeur.navigateByUrl(onglet.route);
    }
  }
}
