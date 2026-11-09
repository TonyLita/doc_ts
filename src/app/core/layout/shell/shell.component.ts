import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../../shared/ui/logo/logo.component';
import { BoutonMenuComponent } from '../header/bouton-menu/bouton-menu.component';
import { HeaderComponent } from '../header/header.component';
import { MenuUtilisateurComponent } from '../header/menu-utilisateur/menu-utilisateur.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

// Coquille applicative des pages protégées : header en haut, sidebar à gauche, contenu de la page à droite.
// Chaque page ne fournit que son contenu (le <router-outlet> de <main>).
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    BoutonMenuComponent,
    HeaderComponent,
    LogoComponent,
    MenuUtilisateurComponent,
    SidebarComponent,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {}
