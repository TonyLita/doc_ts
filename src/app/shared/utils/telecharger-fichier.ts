// Fait télécharger un fichier produit par le serveur : lien temporaire vers le contenu, cliqué puis libéré.
export function telechargerFichier(contenu: Blob, nomFichier: string): void {
  const adresse = URL.createObjectURL(contenu);
  const lien = document.createElement('a');
  lien.href = adresse;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(adresse);
}
