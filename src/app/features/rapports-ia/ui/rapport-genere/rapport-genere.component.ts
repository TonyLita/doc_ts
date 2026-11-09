import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { BoutonCopierComponent } from '../../../../shared/ui/bouton-copier/bouton-copier.component';

export interface LibellesRapport {
  readonly avertissement: string; // « Brouillon généré par IA — relecture humaine recommandée avant diffusion »
  readonly baseSur: string; // « Basé sur : campagne 2026, données au 12/11/2026 »
  readonly copier: string;
  readonly copie: string; // retour après la copie
}

// Affichage pur d'un rapport généré, mis en forme depuis son Markdown (titres, listes…). L'avertissement reste toujours visible : un rapport est un brouillon de travail
// (CDC §8.13, règle 3). Le bouton « Copier » met le texte dans le presse-papiers.
@Component({
  selector: 'app-rapport-genere',
  imports: [BoutonCopierComponent, MarkdownComponent],
  // Fourni ici et non pour toute l'application : la librairie ne se charge qu'avec cette page. Le HTML produit est assaini
  // par Angular (réglage par défaut de ngx-markdown, à ne jamais désactiver).
  providers: [provideMarkdown()],
  templateUrl: './rapport-genere.component.html',
  host: { class: 'carte' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportGenereComponent {
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly libelles = input.required<LibellesRapport>();
}
