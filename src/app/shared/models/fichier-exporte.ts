// Fichier produit par le serveur (export, rapport d'erreurs, modèle d'import) : son contenu et le nom annoncé.
export interface FichierExporte {
  readonly contenu: Blob;
  readonly nom: string;
}
