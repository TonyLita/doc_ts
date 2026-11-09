import { Cooperative, FiltresCampagneCooperative } from '../../../shared/models/cooperative';
import { Zone } from '../../../shared/models/zone';
import { LangueDocument } from '../../../shared/utils/langue-document';

// Contrat d'API SUPPOSÉ en l'absence de backend (CDC §8.14) : à ajuster dès réception de la documentation.
// GET <urlApi>/exports                                          →  ContexteExports
// GET <urlApi>/exports/producteurs?format=&<filtres>            →  fichier Excel ou CSV (une ligne par producteur,
//                                                                  floraison mensuelle, total)
// GET <urlApi>/exports/rapport-pdf?<filtres>                    →  fichier PDF « rapport officiel »
// GET <urlApi>/exports/graphiques/<id>?<filtres>                →  image PNG d'un graphique clé
// GET <urlApi>/exports/resume?<filtres>                         →  ResumeExport (texte copiable, pas un fichier)
// GET <urlApi>/exports/apercus?<filtres>                        →  ApercusExport (données des aperçus de graphiques de la page)
// <filtres> : campagne, cooperative, zone (facultatifs) et langue (fr ou en, celle de l'interface).
// Le serveur produit tous les fichiers : il neutralise les cellules qui commencent par = + - @ (formules), encode le
// CSV en UTF-8 avec marque d'ordre des octets, pagine les gros volumes et trace les exports (données personnelles).
// Le fichier arrive avec son nom dans l'en-tête Content-Disposition. Accès réservé au Super Administrateur et à
// l'Utilisateur : le serveur répond 403 à un visiteur, quelle que soit l'interface.
export type FormatTableur = 'xlsx' | 'csv';

// Graphiques clés exportables en PNG : ceux du tableau de bord (§8.7), de l'analyse par zone (§8.8) et la comparaison des
// trois dernières saisons (§8.12).
export type GraphiqueExportable = 'floraison-mensuelle' | 'repartition-zones' | 'analyse-zones' | 'comparaison-saisons';

export interface FiltresExports extends FiltresCampagneCooperative {
  readonly zone?: string;
  readonly langue: LangueDocument;
}

export interface ContexteExports {
  readonly peutExporter: boolean; // droit du profil du jeton (le visiteur n'a aucun accès aux exports)
  readonly region?: string; // région du programme, affichée sous le titre ; absente : rien n'est affiché
  readonly campagne: string; // campagne active, par défaut
  readonly campagnes: readonly string[];
  readonly cooperatives: readonly Cooperative[];
  readonly zones: readonly Zone[];
}

export interface ResumeExport {
  readonly texte: string; // chiffres clés dans la langue demandée
}

// Données des trois aperçus de la page, pour le périmètre demandé : les mêmes que celles des PNG exportables (§8.14).
// La répartition par zone s'en déduit : c'est la somme de chaque zone sur les mois.
export interface MoisApercu {
  readonly mois: number; // 1 à 12
  readonly fleursParZone: readonly number[]; // même ordre que ApercusExport.zones
}

export interface MoisSaisons {
  readonly mois: number; // 1 à 12
  readonly fleurs: readonly number[]; // même ordre que ApercusExport.saisons.campagnes
}

export interface ApercusExport {
  readonly zones: readonly string[]; // noms dans la langue demandée, dans l'ordre du serveur (le rang d'une zone donne sa couleur)
  readonly mensuel: readonly MoisApercu[]; // campagne choisie, mois par mois
  readonly saisons: {
    readonly campagnes: readonly string[]; // les trois dernières saisons, la campagne choisie en dernier
    readonly mois: readonly MoisSaisons[]; // total des zones, mois par mois
  };
}
