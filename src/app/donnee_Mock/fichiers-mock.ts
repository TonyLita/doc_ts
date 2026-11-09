// DONNÉES DE TEST : fichiers que les faux serveurs renvoient à l'export (CSV et PDF texte), construits à la main pour tester
// le téléchargement. En production, c'est le serveur qui produit les vrais fichiers (Excel, PDF).

// Une cellule qui commence par = + - @ serait lue comme une formule à l'ouverture : on la préfixe pour qu'elle reste du texte.
const neutraliser = (cellule: string) => (/^[=+\-@]/.test(cellule) ? `'${cellule}` : cellule);
const echapper = (cellule: string) => (/[";,\n]/.test(cellule) ? `"${cellule.replaceAll('"', '""')}"` : cellule);

// CSV en UTF-8 avec marque d'ordre des octets (BOM) : Excel affiche ainsi correctement les accents.
export function construireCsvMock(lignes: readonly (readonly string[])[], separateur: string): Blob {
  const corps = lignes.map((ligne) => ligne.map((cellule) => echapper(neutraliser(cellule))).join(separateur)).join('\r\n');
  return new Blob(['﻿', corps], { type: 'text/csv;charset=utf-8' });
}

// PDF d'une page, écrit à la main (police Helvetica, texte seul) : suffisant pour tester le téléchargement.
// Les caractères hors du jeu de la police sont remplacés, et une page ne tient qu'une quarantaine de lignes.
export function construirePdfTexteMock(lignes: readonly string[]): Blob {
  const propres = lignes.map((ligne) =>
    ligne.replace(/[\u202f\u2009]/g, ' ').replace(/[^\u0020-\u00ff]/g, '-').replace(/[\\()]/g, '\\$&'),
  );
  const flux = ['BT', '/F1 12 Tf', '50 790 Td', '18 TL', ...propres.map((ligne) => `(${ligne}) Tj T*`), 'ET'].join('\n');
  const objets = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${flux.length} >>\nstream\n${flux}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let pdf = '%PDF-1.4\n';
  const positions = objets.map((objet, i) => {
    const position = pdf.length;
    pdf += `${i + 1} 0 obj\n${objet}\nendobj\n`;
    return position;
  });
  const debutXref = pdf.length;
  pdf +=
    `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n` +
    positions.map((position) => `${String(position).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${debutXref}\n%%EOF`;
  return new Blob([Uint8Array.from(pdf, (caractere) => caractere.charCodeAt(0))], { type: 'application/pdf' });
}
